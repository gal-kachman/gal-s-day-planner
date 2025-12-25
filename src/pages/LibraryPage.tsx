import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLibraryData } from '@/hooks/useLibraryData';
import { useLibraryEnrichment } from '@/hooks/useLibraryEnrichment';
import { BookSpine } from '@/components/library/BookSpine';
import { WoodenShelf } from '@/components/library/WoodenShelf';
import { LibraryDetailModal } from '@/components/library/LibraryDetailModal';
import { LibraryItem } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, BookOpen, Film, Tv, Podcast, FileText, Library, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

// Google Spreadsheet ID for the library/culture data
const SPREADSHEET_ID = '18VH_PFbgVD86BCLnin775mkELzGuj--kfLwz1xt9axs';

const mediaTypeFilters = [
  { key: 'all', label: 'הכל', icon: Library },
  { key: 'ספר', label: 'ספרים', icon: BookOpen },
  { key: 'סרט', label: 'סרטים', icon: Film },
  { key: 'סדרה', label: 'סדרות', icon: Tv },
  { key: 'פודקאסט', label: 'פודקאסטים', icon: Podcast },
  { key: 'מאמר', label: 'מאמרים', icon: FileText },
];

export default function LibraryPage() {
  const {
    items,
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
  } = useLibraryData({ spreadsheetId: SPREADSHEET_ID });

  const { enrichItem, isEnriching, getEnrichedImage, loadedFromDb } = useLibraryEnrichment();

  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const autoEnrichStarted = useRef(false);

  // Auto-enrich items without images when data is loaded
  useEffect(() => {
    if (!loadedFromDb || isLoading || autoEnrichStarted.current) return;
    
    const itemsToEnrich = items.filter(item => !item.imageUrl && !getEnrichedImage(item.id));
    if (itemsToEnrich.length === 0) return;
    
    autoEnrichStarted.current = true;
    
    // Enrich items sequentially (up to 5 at a time)
    const enrichSequentially = async () => {
      for (const item of itemsToEnrich.slice(0, 5)) {
        await enrichItem(item);
      }
    };
    enrichSequentially();
  }, [items, loadedFromDb, isLoading, getEnrichedImage, enrichItem]);

  const handleEnrichAll = async () => {
    const itemsWithoutImages = items.filter(item => !item.imageUrl && !getEnrichedImage(item.id));
    for (const item of itemsWithoutImages.slice(0, 5)) { // Limit to 5 at a time
      await enrichItem(item);
    }
  };

  const handleItemClick = (item: LibraryItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  // Group items into shelves (8 items per shelf)
  const shelves: LibraryItem[][] = [];
  const itemsPerShelf = 8;
  for (let i = 0; i < items.length; i += itemsPerShelf) {
    shelves.push(items.slice(i, i + itemsPerShelf));
  }

  return (
    <>
      <Helmet>
        <title>הספרייה שלי | My Library</title>
        <meta name="description" content="אוסף הספרים, סרטים, סדרות ופודקאסטים שלי" />
      </Helmet>

      <div className="library-page min-h-screen" dir="rtl">
        {/* Warm ambient lighting overlay */}
        <div className="library-ambient-light fixed inset-0 pointer-events-none z-0" />
        
        {/* Header */}
        <header className="library-header relative z-10 pt-8 pb-6 px-4 md:px-8">
          <div className="max-w-6xl mx-auto">
            {/* Back navigation */}
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-library-paper/70 hover:text-library-paper transition-colors mb-6"
            >
              <ArrowRight className="h-4 w-4" />
              <span>חזרה לתכנון</span>
            </Link>
            
            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="font-serif-display text-4xl md:text-5xl text-library-gold mb-2">
                הספרייה שלי
              </h1>
              <p className="text-library-paper/60 font-sans">
                ספרים, סרטים, סדרות ופודקאסטים
              </p>
            </div>

            {/* Search and filters */}
            <div className="space-y-4">
              {/* Search bar */}
              <div className="relative max-w-md mx-auto">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-library-paper/50" />
                <Input
                  type="text"
                  placeholder="חיפוש..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="library-search-input pr-10 bg-library-paper/10 border-library-paper/20 text-library-paper placeholder:text-library-paper/40"
                />
              </div>

              {/* Media type filters */}
              <div className="flex flex-wrap justify-center gap-2">
                {mediaTypeFilters.map((filter) => {
                  const Icon = filter.icon;
                  const isActive = selectedMediaType === filter.key;
                  // Only show filter if it exists in data or is 'all'
                  if (filter.key !== 'all' && !mediaTypes.includes(filter.key)) return null;
                  
                  return (
                    <Button
                      key={filter.key}
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedMediaType(filter.key)}
                      className={cn(
                        'library-filter-btn gap-2',
                        isActive 
                          ? 'bg-library-gold/20 text-library-gold border-library-gold/30' 
                          : 'text-library-paper/70 hover:text-library-paper hover:bg-library-paper/10'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{filter.label}</span>
                    </Button>
                  );
                })}
              </div>

              {/* Status filters */}
              {statuses.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedStatus('all')}
                    className={cn(
                      'library-filter-btn text-xs',
                      selectedStatus === 'all'
                        ? 'bg-library-gold/20 text-library-gold'
                        : 'text-library-paper/60 hover:text-library-paper'
                    )}
                  >
                    כל הסטטוסים
                  </Button>
                  {statuses.map((status) => (
                    <Button
                      key={status}
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedStatus(status)}
                      className={cn(
                        'library-filter-btn text-xs',
                        selectedStatus === status
                          ? 'bg-library-gold/20 text-library-gold'
                          : 'text-library-paper/60 hover:text-library-paper'
                      )}
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              )}
              {/* Enrich all button */}
              {items.some(item => !item.imageUrl && !getEnrichedImage(item.id)) && (
                <div className="flex justify-center mt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEnrichAll}
                    className="gap-2 text-library-gold/70 hover:text-library-gold hover:bg-library-gold/10"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>חפש תמונות אוטומטית</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main content - Bookshelves */}
        <main className="library-shelves relative z-10 px-4 md:px-8 pb-16">
          <div className="max-w-6xl mx-auto">
            {isLoading ? (
              <div className="text-center py-16">
                <div className="animate-pulse text-library-paper/60">טוען את הספרייה...</div>
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <p className="text-red-400">{error}</p>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-16">
                <Library className="h-16 w-16 mx-auto text-library-paper/30 mb-4" />
                <p className="text-library-paper/60">הספרייה ריקה</p>
              </div>
            ) : (
              <div className="space-y-4">
                {shelves.map((shelfItems, index) => (
                  <WoodenShelf key={index}>
                    {shelfItems.map((item) => (
                      <BookSpine
                        key={item.id}
                        item={item}
                        onClick={() => handleItemClick(item)}
                        enrichedImage={getEnrichedImage(item.id)}
                        isEnriching={isEnriching(item.id)}
                        onEnrich={() => enrichItem(item)}
                      />
                    ))}
                  </WoodenShelf>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Detail Modal */}
        <LibraryDetailModal
          item={selectedItem}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    </>
  );
}
