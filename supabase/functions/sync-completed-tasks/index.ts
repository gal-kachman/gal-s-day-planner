import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    exp: now + 3600,
  };

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  const signatureInput = `${headerB64}.${payloadB64}`;
  
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

// Update completed tasks in Google Sheet by matching column C
async function updateSheetWithCompletions(
  accessToken: string, 
  spreadsheetId: string, 
  sheetName: string,
  tasks: { task_title: string; completed_at: string }[]
): Promise<{ updated: number; notFound: string[] }> {
  if (tasks.length === 0) {
    console.log('No tasks to update');
    return { updated: 0, notFound: [] };
  }

  // First, read column C to find matching rows
  const readRange = `${sheetName}!C:C`;
  const readUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(readRange)}`;

  console.log(`Reading column C from sheet ${sheetName}`);

  const readResponse = await fetch(readUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!readResponse.ok) {
    const error = await readResponse.text();
    console.error('Sheets API read error:', error);
    throw new Error(`Failed to read sheet: ${error}`);
  }

  const readData = await readResponse.json();
  const columnCValues: string[][] = readData.values || [];

  console.log(`Found ${columnCValues.length} rows in column C`);

  // Build batch update requests
  const updateRequests: { range: string; values: string[][] }[] = [];
  const notFound: string[] = [];

  for (const task of tasks) {
    // Find row where column C matches task_title
    const rowIndex = columnCValues.findIndex(
      (row) => row[0]?.trim().toLowerCase() === task.task_title.trim().toLowerCase()
    );

    if (rowIndex === -1) {
      console.log(`Task not found in sheet: "${task.task_title}"`);
      notFound.push(task.task_title);
      continue;
    }

    // Row numbers are 1-indexed in Sheets API
    const rowNumber = rowIndex + 1;
    const timestamp = new Date(task.completed_at).toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' });

    // Update columns H and I for this row
    updateRequests.push({
      range: `${sheetName}!H${rowNumber}:I${rowNumber}`,
      values: [[task.task_title, timestamp]]
    });

    console.log(`Will update row ${rowNumber}: H="${task.task_title}", I="${timestamp}"`);
  }

  if (updateRequests.length === 0) {
    console.log('No matching rows found to update');
    return { updated: 0, notFound };
  }

  // Batch update all matching rows
  const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;

  const batchResponse = await fetch(batchUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: updateRequests
    }),
  });

  if (!batchResponse.ok) {
    const error = await batchResponse.text();
    console.error('Sheets API batch update error:', error);
    throw new Error(`Failed to update sheet: ${error}`);
  }

  console.log(`Successfully updated ${updateRequests.length} rows in sheet`);
  return { updated: updateRequests.length, notFound };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serviceAccountKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!serviceAccountKey) {
      console.error('GOOGLE_SERVICE_ACCOUNT_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Service account not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase credentials not configured');
      return new Response(
        JSON.stringify({ error: 'Supabase not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body for spreadsheet config (with defaults for your specific sheet)
    const body = await req.json().catch(() => ({}));
    const spreadsheetId = body.spreadsheetId || '1Jp-Aq4xQzwrzaQwXErSxq3oJYvEMyWADLttXMZSSTZc';
    const sheetName = body.sheetName || 'Sheet1';

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get tasks completed in the last 24 hours that haven't been synced
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    console.log(`Fetching completed tasks since ${yesterday.toISOString()}`);

    const { data: completedTasks, error: dbError } = await supabase
      .from('task_completions')
      .select('task_title, completed_at')
      .gte('completed_at', yesterday.toISOString())
      .order('completed_at', { ascending: true });

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error(`Failed to fetch completed tasks: ${dbError.message}`);
    }

    console.log(`Found ${completedTasks?.length || 0} completed tasks`);

    if (!completedTasks || completedTasks.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No completed tasks to sync', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Google access token with write permissions
    const serviceAccount: ServiceAccountKey = JSON.parse(serviceAccountKey);
    console.log(`Using service account: ${serviceAccount.client_email}`);

    const scopes = ['https://www.googleapis.com/auth/spreadsheets'];
    const accessToken = await getAccessToken(serviceAccount, scopes);
    console.log('Access token obtained successfully');

    // Update Google Sheet by matching column C
    const result = await updateSheetWithCompletions(accessToken, spreadsheetId, sheetName, completedTasks);

    return new Response(
      JSON.stringify({ 
        message: 'Successfully synced completed tasks', 
        updated: result.updated,
        notFound: result.notFound,
        totalProcessed: completedTasks.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error in sync-completed-tasks function:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
