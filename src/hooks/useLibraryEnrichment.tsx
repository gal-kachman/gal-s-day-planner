import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LibraryItem } from '@/types';
import { toast } from 'sonner';

interface EnrichmentResult {
  success: boolean;
  imageUrl?: string | null;
  error?: string;
}

interface EnrichmentRecord {
  item_id: string;
  image_url: string | null;
}

export function useLibraryEnrichment() {
  const [enrichingItems, setEnrichingItems] = useState<Set<string>>(new Set());
  const [enrichedImages, setEnrichedImages] = useState<Record<string, string>>({});
  const [loadedFromDb, setLoadedFromDb] = useState(false);

  // Load existing enrichments from database on mount
  useEffect(() => {
    async function loadEnrichments() {
      try {
        const { data, error } = await supabase
          .from('library_item_enrichments')
          .select('item_id, image_url');

        if (error) {
          console.error('Error loading enrichments:', error);
          return;
        }

        if (data && data.length > 0) {
          const images: Record<string, string> = {};
          (data as EnrichmentRecord[]).forEach((record) => {
            if (record.image_url) {
              images[record.item_id] = record.image_url;
            }
          });
          setEnrichedImages(images);
        }
      } catch (error) {
        console.error('Error loading enrichments:', error);
      } finally {
        setLoadedFromDb(true);
      }
    }

    loadEnrichments();
  }, []);

  const enrichItem = useCallback(async (item: LibraryItem): Promise<EnrichmentResult> => {
    if (enrichingItems.has(item.id)) {
      return { success: false, error: 'Already enriching this item' };
    }

    setEnrichingItems(prev => new Set(prev).add(item.id));

    try {
      const { data, error } = await supabase.functions.invoke('enrich-library-item', {
        body: {
          itemId: item.id,
          title: item.hebrewTitle || item.originalTitle,
          mediaType: item.mediaType,
          creators: item.creators,
        },
      });

      if (error) {
        console.error('Enrichment error:', error);
        toast.error('לא הצלחתי למצוא תמונה');
        return { success: false, error: error.message };
      }

      if (data?.success && data.imageUrl) {
        setEnrichedImages(prev => ({ ...prev, [item.id]: data.imageUrl }));
        toast.success('נמצאה תמונה!');
        return { success: true, imageUrl: data.imageUrl };
      }

      toast.info('לא נמצאה תמונה מתאימה');
      return { success: true, imageUrl: null };
    } catch (error) {
      console.error('Enrichment error:', error);
      toast.error('שגיאה בחיפוש תמונה');
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      setEnrichingItems(prev => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  }, [enrichingItems]);

  const isEnriching = useCallback((itemId: string) => enrichingItems.has(itemId), [enrichingItems]);
  
  const getEnrichedImage = useCallback((itemId: string) => enrichedImages[itemId], [enrichedImages]);

  return {
    enrichItem,
    isEnriching,
    getEnrichedImage,
    enrichingItems,
    loadedFromDb,
  };
}
