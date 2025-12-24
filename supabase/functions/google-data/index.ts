import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ServiceAccountKey {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

// Create a JWT for service account authentication
async function createJWT(serviceAccount: ServiceAccountKey, scopes: string[]): Promise<string> {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    scope: scopes.join(' '),
    aud: serviceAccount.token_uri,
    iat: now,
    exp: now + 3600, // 1 hour
  };

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  const signatureInput = `${headerB64}.${payloadB64}`;
  
  // Import the private key
  const pemContents = serviceAccount.private_key
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\n/g, '');
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(signatureInput)
  );
  
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  
  return `${headerB64}.${payloadB64}.${signatureB64}`;
}

// Exchange JWT for access token
async function getAccessToken(serviceAccount: ServiceAccountKey, scopes: string[]): Promise<string> {
  const jwt = await createJWT(serviceAccount, scopes);
  
  const response = await fetch(serviceAccount.token_uri, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error('Token exchange failed:', error);
    throw new Error(`Failed to get access token: ${error}`);
  }
  
  const data = await response.json();
  return data.access_token;
}

// Fetch calendar events for tomorrow
async function fetchCalendarEvents(accessToken: string, calendarId: string): Promise<any[]> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);
  
  const timeMin = tomorrow.toISOString();
  const timeMax = dayAfter.toISOString();
  
  console.log(`Fetching calendar events from ${timeMin} to ${timeMax}`);
  
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error('Calendar API error:', error);
    throw new Error(`Failed to fetch calendar events: ${error}`);
  }
  
  const data = await response.json();
  console.log(`Found ${data.items?.length || 0} calendar events`);
  
  return (data.items || []).map((event: any) => ({
    id: event.id,
    title: event.summary || 'Untitled Event',
    startTime: event.start?.dateTime || event.start?.date,
    endTime: event.end?.dateTime || event.end?.date,
    location: event.location,
    description: event.description,
    isAllDay: !event.start?.dateTime,
  }));
}

// Get the first sheet name from spreadsheet metadata
async function getFirstSheetName(accessToken: string, spreadsheetId: string): Promise<string> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  
  if (!response.ok) {
    console.error('Failed to get spreadsheet metadata');
    return 'Sheet1'; // Fallback to default
  }
  
  const data = await response.json();
  const firstSheet = data.sheets?.[0]?.properties?.title;
  console.log(`First sheet name: ${firstSheet}`);
  return firstSheet || 'Sheet1';
}

// Fetch tasks from Google Sheet
async function fetchSheetTasks(accessToken: string, spreadsheetId: string, range: string): Promise<any[]> {
  // If range starts with "Sheet1", try to get actual sheet name
  let actualRange = range;
  if (range.startsWith('Sheet1')) {
    const actualSheetName = await getFirstSheetName(accessToken, spreadsheetId);
    actualRange = range.replace('Sheet1', actualSheetName);
    console.log(`Adjusted range from ${range} to ${actualRange}`);
  }
  
  console.log(`Fetching sheet data from ${spreadsheetId}, range: ${actualRange}`);
  
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(actualRange)}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error('Sheets API error:', error);
    throw new Error(`Failed to fetch sheet data: ${error}`);
  }
  
  const data = await response.json();
  const rows = data.values || [];
  
  console.log(`Found ${rows.length} rows in sheet`);
  
  // Skip header row if present and map to tasks
  // Detected columns: Index, Notes, Status, Quadrant, Priority
  if (rows.length <= 1) {
    return [];
  }
  
  return rows.slice(1).map((row: string[], index: number) => {
    const statusRaw = row[2]?.toLowerCase() || '';
    let status: 'todo' | 'doing' | 'done' = 'todo';
    if (statusRaw === 'done' || statusRaw === 'completed') {
      status = 'done';
    } else if (statusRaw === 'doing' || statusRaw === 'in progress') {
      status = 'doing';
    }
    
    const priorityRaw = row[4]?.toLowerCase() || 'medium';
    let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
    if (priorityRaw === 'high' || priorityRaw === 'urgent') {
      priority = 'high';
    } else if (priorityRaw === 'low') {
      priority = 'low';
    }
    
    return {
      id: `sheet-${index + 1}`,
      title: row[1] || 'Untitled Task', // Notes column as title
      notes: undefined,
      status,
      priority,
      estimatedMinutes: undefined,
      dueDate: row[3] || undefined, // Quadrant column
      tags: row[4] ? [row[4]] : undefined, // Priority as tag
      createdAt: new Date().toISOString(),
    };
  });
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serviceAccountKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
    
    if (!serviceAccountKey) {
      console.error('GOOGLE_SERVICE_ACCOUNT_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Service account not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const serviceAccount: ServiceAccountKey = JSON.parse(serviceAccountKey);
    console.log(`Using service account: ${serviceAccount.client_email}`);

    const { action, calendarId, spreadsheetId, sheetRange } = await req.json();
    
    const scopes = [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/spreadsheets.readonly',
    ];
    
    console.log(`Getting access token for scopes: ${scopes.join(', ')}`);
    const accessToken = await getAccessToken(serviceAccount, scopes);
    console.log('Access token obtained successfully');

    let result: any = {};

    if (action === 'calendar' || action === 'all') {
      if (!calendarId) {
        return new Response(
          JSON.stringify({ error: 'calendarId is required for calendar action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      result.events = await fetchCalendarEvents(accessToken, calendarId);
    }

    if (action === 'tasks' || action === 'all') {
      if (!spreadsheetId) {
        return new Response(
          JSON.stringify({ error: 'spreadsheetId is required for tasks action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      result.tasks = await fetchSheetTasks(accessToken, spreadsheetId, sheetRange || 'Sheet1!A:E');
    }

    console.log('Returning data successfully');
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error in google-data function:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
