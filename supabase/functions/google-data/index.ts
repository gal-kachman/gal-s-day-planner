import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const GoogleDataSchema = z.object({
  action: z.enum(['calendar', 'tasks', 'library', 'updateTask', 'updateTaskCompletion', 'all']),
  calendarId: z.string().max(200).optional(),
  spreadsheetId: z.string().max(200).optional(),
  sheetRange: z.string().max(100).optional(),
  sheetName: z.string().max(100).optional(),
  column: z.string().regex(/^[A-Z]+$/).optional(),
  rowNumber: z.number().int().positive().max(10000).optional(),
  value: z.string().max(1000).optional(),
  completed: z.boolean().optional(),
  timestamp: z.string().optional(),
});

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

// Validate authentication
async function validateAuth(req: Request): Promise<{ userId: string | null; error: string | null }> {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { userId: null, error: 'Missing or invalid authorization header' };
  }
  
  const token = authHeader.replace('Bearer ', '');
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return { userId: null, error: 'Invalid or expired token' };
  }
  
  return { userId: user.id, error: null };
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

// Fetch tasks from Google Sheet (columns A-K)
// A=taskId, B=title, C=due_date, D=clarified_next_action, E=eisenhower_quadrant, 
// F=priority_rank, G=delegate_to, H=reason_short, I=Creation Timestamp, J=completion, K=completion Timestamp
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
  
  if (rows.length <= 1) {
    return [];
  }
  
  // Filter out completed tasks and rows without titles, then map to Task format
  return rows.slice(1)
    .filter((row: string[]) => {
      // Filter out rows without a title in column B
      const title = row[1]?.trim();
      if (!title) return false;
      
      // Filter out completed tasks
      const completionValue = row[9]?.toUpperCase() || '';
      const isCompleted = completionValue === 'TRUE' || completionValue === '✓' || completionValue === 'YES';
      return !isCompleted;
    })
    .map((row: string[], _filteredIndex: number, _arr: string[][]) => {
      // Calculate original row number by finding this row in the original array
      const originalIndex = rows.slice(1).findIndex((r: string[]) => r === row);
      const rowNumber = originalIndex + 2; // +2 because: +1 for 0-indexed, +1 for header row
      
      // Parse priority rank (column F) to priority level
      const priorityRank = parseInt(row[5] || '0', 10);
      let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
      if (priorityRank >= 4) priority = 'urgent';
      else if (priorityRank === 3) priority = 'high';
      else if (priorityRank === 2) priority = 'medium';
      else if (priorityRank <= 1) priority = 'low';
      
      return {
        id: `sheet-${rowNumber}`,
        taskId: row[0] || '', // Column A
        title: row[1].trim(), // Column B (already validated)
        dueDate: row[2] || undefined, // Column C
        clarifiedNextAction: row[3] || undefined, // Column D
        eisenhowerQuadrant: row[4] || undefined, // Column E
        priorityRank: priorityRank || undefined, // Column F
        delegateTo: row[6] || undefined, // Column G
        reasonShort: row[7] || undefined, // Column H
        createdAt: row[8] || undefined, // Column I
        completion: false, // Already filtered out completed
        completionTimestamp: row[10] || undefined, // Column K
        priority,
        rowNumber,
      };
    });
}

// Fetch library items from Google Sheet (culture tab)
async function fetchLibraryItems(accessToken: string, spreadsheetId: string, range: string): Promise<any[]> {
  console.log(`Fetching library items from ${spreadsheetId}, range: ${range}`);
  
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error('Sheets API error:', error);
    throw new Error(`Failed to fetch library data: ${error}`);
  }
  
  const data = await response.json();
  const rows = data.values || [];
  
  console.log(`Found ${rows.length} rows in library sheet`);
  
  // Skip header row
  // Columns: סטטוס, סוג מדיה, כותרת בעברית, כותרת מקורית, יוצרים, שנה, תקציר, הערות, קישור לתמונה
  if (rows.length <= 1) {
    return [];
  }
  
  return rows.slice(1).map((row: string[], index: number) => ({
    id: `library-${index + 1}`,
    status: row[0] || '',
    mediaType: row[1] || '',
    hebrewTitle: row[2] || 'ללא כותרת',
    originalTitle: row[3] || '',
    creators: row[4] || '',
    year: row[5] || '',
    summary: row[6] || '',
    notes: row[7] || '',
    imageUrl: row[8] || '',
  }));
}

// Update a specific cell in Google Sheet
async function updateSheetCell(
  accessToken: string, 
  spreadsheetId: string, 
  sheetName: string,
  column: string,
  rowNumber: number, 
  value: string
): Promise<void> {
  const range = `${sheetName}!${column}${rowNumber}`;
  console.log(`Updating cell ${range} with value: ${value}`);
  
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`;
  
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [[value]],
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error('Sheets API update error:', error);
    throw new Error(`Failed to update sheet cell: ${error}`);
  }
  
  console.log(`Successfully updated cell ${range}`);
}

// Update task completion checkbox (column J) and timestamp (column K)
async function updateTaskCompletion(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string,
  rowNumber: number,
  completed: boolean,
  timestamp: string
): Promise<void> {
  const range = `${sheetName}!J${rowNumber}:K${rowNumber}`;
  console.log(`Updating completion for row ${rowNumber}: completed=${completed}, timestamp=${timestamp}`);
  
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [[completed ? 'TRUE' : 'FALSE', timestamp]],
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error('Sheets API update error:', error);
    throw new Error(`Failed to update task completion: ${error}`);
  }
  
  console.log(`Successfully updated completion for row ${rowNumber}`);
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

    // Parse and validate input
    const rawBody = await req.json();
    const parseResult = GoogleDataSchema.safeParse(rawBody);
    
    if (!parseResult.success) {
      console.error('Validation failed:', parseResult.error.errors);
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: parseResult.error.errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, calendarId, spreadsheetId, sheetRange, sheetName, column, rowNumber, value, completed, timestamp } = parseResult.data;
    
    // Determine scopes based on action
    const needsWrite = action === 'updateTask' || action === 'updateTaskCompletion';
    const scopes = needsWrite
      ? ['https://www.googleapis.com/auth/spreadsheets']
      : [
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
      result.tasks = await fetchSheetTasks(accessToken, spreadsheetId, sheetRange || 'tasks!A:K');
    }

    if (action === 'library') {
      if (!spreadsheetId) {
        return new Response(
          JSON.stringify({ error: 'spreadsheetId is required for library action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      result.libraryItems = await fetchLibraryItems(accessToken, spreadsheetId, sheetRange || 'culture!A:I');
    }

    if (action === 'updateTask') {
      if (!spreadsheetId || !sheetName || !column || !rowNumber || value === undefined) {
        return new Response(
          JSON.stringify({ error: 'spreadsheetId, sheetName, column, rowNumber, and value are required for updateTask action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      await updateSheetCell(accessToken, spreadsheetId, sheetName, column, rowNumber, value);
      result.success = true;
      result.message = `Updated ${sheetName}!${column}${rowNumber}`;
    }

    if (action === 'updateTaskCompletion') {
      if (!spreadsheetId || !sheetName || !rowNumber || completed === undefined) {
        return new Response(
          JSON.stringify({ error: 'spreadsheetId, sheetName, rowNumber, and completed are required for updateTaskCompletion action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      await updateTaskCompletion(accessToken, spreadsheetId, sheetName, rowNumber, completed, timestamp || '');
      result.success = true;
      result.message = `Updated completion for row ${rowNumber}`;
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
