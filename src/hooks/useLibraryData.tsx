import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LibraryItem } from '@/types';

interface UseLibraryDataProps {
  spreadsheetId: string;
}

export function useLibraryData({ spreadsheetId }: UseLibraryDataProps) {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMediaType, setSelectedMediaType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchLibraryData() {
      if (!spreadsheetId) {
        setError('Spreadsheet ID not configured');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const { data, error: fnError } = await supabase.functions.invoke('google-data', {
          body: {
            action: 'library',
            spreadsheetId,
            sheetRange: 'culture!A:I',
          },
        });

        if (fnError) {
          throw new Error(fnError.message);
        }

        if (data?.libraryItems) {
          setItems(data.libraryItems);
        }
      } catch (err) {
        console.error('Error fetching library data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch library data');
      } finally {
        setIsLoading(false);
      }
    }

    fetchLibraryData();
  }, [spreadsheetId]);

  // Get unique media types for filter
  const mediaTypes = useMemo(() => {
    const types = new Set(items.map(item => item.mediaType).filter(Boolean));
    return Array.from(types);
  }, [items]);

  // Get unique statuses for filter
  const statuses = useMemo(() => {
    const statusSet = new Set(items.map(item => item.status).filter(Boolean));
    return Array.from(statusSet);
  }, [items]);

  // Filter items based on selected filters and search
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesMediaType = selectedMediaType === 'all' || item.mediaType === selectedMediaType;
      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
      const matchesSearch = searchQuery === '' || 
        item.hebrewTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.originalTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.creators?.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesMediaType && matchesStatus && matchesSearch;
    });
  }, [items, selectedMediaType, selectedStatus, searchQuery]);

  return {
    items: filteredItems,
    allItems: items,
    isLoading,
    error,
    mediaTypes,
    statuses,
    selectedMediaType,
    setSelectedMediaType,
    selectedStatus,
    setSelectedStatus,
    searchQuery,
    setSearchQuery,
  };
}
