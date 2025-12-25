import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Build search query based on media type
function buildSearchQuery(title: string, mediaType: string, creators?: string): string {
  const cleanTitle = title.replace(/[^\w\s\u0590-\u05FF]/g, '').trim();
  
  switch (mediaType) {
    case 'ספר':
      return `"${cleanTitle}" book cover ${creators ? creators : ''} goodreads OR amazon`;
    case 'סרט':
      return `"${cleanTitle}" movie poster imdb OR tmdb`;
    case 'סדרה':
      return `"${cleanTitle}" tv series poster imdb OR tmdb`;
    case 'פודקאסט':
      return `"${cleanTitle}" podcast cover artwork spotify OR apple podcasts`;
    case 'מאמר':
      return `"${cleanTitle}" article ${creators ? creators : ''}`;
    default:
      return `"${cleanTitle}" cover image`;
  }
}

// Extract best image URL from search results
function extractBestImage(results: any[]): string | null {
  for (const result of results) {
    // Check for images in the result
    if (result.markdown) {
      // Extract image URLs from markdown
      const imageMatches = result.markdown.match(/!\[.*?\]\((https?:\/\/[^\s)]+\.(?:jpg|jpeg|png|webp|gif)[^\s)]*)\)/gi);
      if (imageMatches && imageMatches.length > 0) {
        const urlMatch = imageMatches[0].match(/\((https?:\/\/[^\s)]+)\)/);
        if (urlMatch) return urlMatch[1];
      }
    }
    
    // Check metadata for og:image or other image properties
    if (result.metadata?.ogImage) {
      return result.metadata.ogImage;
    }
    
    // Check for image in HTML
    if (result.html) {
      const ogMatch = result.html.match(/property="og:image"\s+content="([^"]+)"/);
      if (ogMatch) return ogMatch[1];
      
      const imgMatch = result.html.match(/<img[^>]+src="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp))[^"]*"/i);
      if (imgMatch) return imgMatch[1];
    }
  }
  
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, mediaType, creators } = await req.json();

    if (!title) {
      return new Response(
        JSON.stringify({ success: false, error: 'Title is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const query = buildSearchQuery(title, mediaType, creators);
    console.log('Searching for:', query);

    const response = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        limit: 5,
        scrapeOptions: {
          formats: ['markdown', 'html'],
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Firecrawl API error:', data);
      return new Response(
        JSON.stringify({ success: false, error: data.error || 'Search failed' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Search returned', data.data?.length || 0, 'results');

    const imageUrl = extractBestImage(data.data || []);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUrl,
        query,
        resultsCount: data.data?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error enriching item:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
