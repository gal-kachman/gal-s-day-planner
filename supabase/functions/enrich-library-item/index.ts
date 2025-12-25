import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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

// Download image and return as Uint8Array
async function downloadImage(url: string): Promise<{ data: Uint8Array; contentType: string } | null> {
  try {
    console.log('Downloading image from:', url);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LibraryEnrichment/1.0)',
      },
    });
    
    if (!response.ok) {
      console.error('Failed to download image:', response.status);
      return null;
    }
    
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await response.arrayBuffer();
    return { data: new Uint8Array(arrayBuffer), contentType };
  } catch (error) {
    console.error('Error downloading image:', error);
    return null;
  }
}

// Get file extension from content type
function getExtension(contentType: string): string {
  const mapping: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };
  return mapping[contentType] || 'jpg';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { itemId, title, mediaType, creators } = await req.json();

    if (!title || !itemId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Title and itemId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const query = buildSearchQuery(title, mediaType, creators);
    console.log('Searching for:', query);

    const response = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
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

    const foundImageUrl = extractBestImage(data.data || []);
    
    if (!foundImageUrl) {
      // Save enrichment record with no image
      await supabase.from('library_item_enrichments').upsert({
        item_id: itemId,
        image_url: null,
        source_query: query,
        enriched_at: new Date().toISOString(),
      }, { onConflict: 'item_id' });

      return new Response(
        JSON.stringify({ 
          success: true, 
          imageUrl: null,
          query,
          resultsCount: data.data?.length || 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Download the image
    const imageData = await downloadImage(foundImageUrl);
    
    if (!imageData) {
      console.log('Could not download image, saving external URL');
      // If we can't download, still save the external URL
      await supabase.from('library_item_enrichments').upsert({
        item_id: itemId,
        image_url: foundImageUrl,
        source_query: query,
        enriched_at: new Date().toISOString(),
      }, { onConflict: 'item_id' });

      return new Response(
        JSON.stringify({ 
          success: true, 
          imageUrl: foundImageUrl,
          query,
          resultsCount: data.data?.length || 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Upload to Supabase Storage
    const extension = getExtension(imageData.contentType);
    const filePath = `${itemId}.${extension}`;
    
    console.log('Uploading to storage:', filePath);
    
    const { error: uploadError } = await supabase.storage
      .from('library-covers')
      .upload(filePath, imageData.data, {
        contentType: imageData.contentType,
        upsert: true,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      // Fall back to external URL
      await supabase.from('library_item_enrichments').upsert({
        item_id: itemId,
        image_url: foundImageUrl,
        source_query: query,
        enriched_at: new Date().toISOString(),
      }, { onConflict: 'item_id' });

      return new Response(
        JSON.stringify({ 
          success: true, 
          imageUrl: foundImageUrl,
          query,
          resultsCount: data.data?.length || 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('library-covers')
      .getPublicUrl(filePath);

    const storageUrl = publicUrlData.publicUrl;
    console.log('Uploaded successfully:', storageUrl);

    // Save enrichment record
    await supabase.from('library_item_enrichments').upsert({
      item_id: itemId,
      image_url: storageUrl,
      source_query: query,
      enriched_at: new Date().toISOString(),
    }, { onConflict: 'item_id' });

    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUrl: storageUrl,
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
