import { LibraryItem } from '@/types';
import { cn } from '@/lib/utils';
import { BookOpen, Film, Tv, Podcast, FileText, ImagePlus, Loader2 } from 'lucide-react';

interface BookSpineProps {
  item: LibraryItem;
  onClick: () => void;
  enrichedImage?: string;
  isEnriching?: boolean;
  onEnrich?: () => void;
}

// Color mapping for different media types
const mediaTypeColors: Record<string, { bg: string; border: string }> = {
  'ספר': { bg: 'bg-library-book', border: 'border-library-book-dark' },
  'סרט': { bg: 'bg-library-movie', border: 'border-library-movie-dark' },
  'סדרה': { bg: 'bg-library-tv', border: 'border-library-tv-dark' },
  'פודקאסט': { bg: 'bg-library-podcast', border: 'border-library-podcast-dark' },
  'מאמר': { bg: 'bg-library-article', border: 'border-library-article-dark' },
};

const mediaTypeIcons: Record<string, typeof BookOpen> = {
  'ספר': BookOpen,
  'סרט': Film,
  'סדרה': Tv,
  'פודקאסט': Podcast,
  'מאמר': FileText,
};

const defaultColors = { bg: 'bg-library-default', border: 'border-library-default-dark' };

export function BookSpine({ item, onClick, enrichedImage, isEnriching, onEnrich }: BookSpineProps) {
  const colors = mediaTypeColors[item.mediaType] || defaultColors;
  const MediaIcon = mediaTypeIcons[item.mediaType] || BookOpen;
  const displayImage = enrichedImage || item.imageUrl;
  const hasImage = !!displayImage;
  
  return (
    <button
      onClick={onClick}
      className={cn(
        'book-cover group relative flex flex-col overflow-hidden',
        'h-[180px] w-[120px] md:h-[220px] md:w-[150px]',
        'rounded-sm cursor-pointer',
        'transition-all duration-300 ease-out',
        'hover:translate-y-[-8px] hover:scale-105 hover:shadow-xl hover:z-10',
        'shadow-lg'
      )}
      title={item.hebrewTitle}
    >
      {/* Cover image or placeholder */}
      {hasImage ? (
        <img 
          src={displayImage} 
          alt={item.hebrewTitle}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className={cn(
          'absolute inset-0 flex flex-col items-center justify-center',
          colors.bg
        )}>
          {/* Decorative pattern for non-image covers */}
          <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxyZWN0IHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgZmlsbD0idHJhbnNwYXJlbnQiPjwvcmVjdD4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIwLjMiPjwvY2lyY2xlPgo8L3N2Zz4=')]" />
          {isEnriching ? (
            <Loader2 className="h-12 w-12 text-library-gold/70 mb-3 animate-spin" />
          ) : (
            <MediaIcon className="h-12 w-12 text-library-gold/70 mb-3" />
          )}
        </div>
      )}
      
      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      
      {/* Title overlay at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-3" dir="rtl">
        <h3 className="text-library-paper font-serif-display text-sm md:text-base font-semibold leading-tight line-clamp-3 text-shadow-lg">
          {item.hebrewTitle}
        </h3>
        {item.creators && (
          <p className="text-library-paper/70 text-xs mt-1 line-clamp-1">
            {item.creators}
          </p>
        )}
      </div>
      
      {/* Media type badge */}
      <div className={cn(
        'absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-medium',
        'bg-black/50 text-library-gold backdrop-blur-sm'
      )}>
        {item.mediaType}
      </div>
      
      {/* Enrich button for items without images */}
      {!hasImage && onEnrich && !isEnriching && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEnrich();
          }}
          className={cn(
            'absolute top-2 left-2 p-1.5 rounded',
            'bg-library-gold/80 text-library-wood hover:bg-library-gold',
            'transition-all duration-200 opacity-0 group-hover:opacity-100',
            'backdrop-blur-sm'
          )}
          title="חפש תמונה"
        >
          <ImagePlus className="h-4 w-4" />
        </button>
      )}
      
      {/* Subtle border frame */}
      <div className="absolute inset-0 border-2 border-library-wood/30 rounded-sm pointer-events-none" />
      
      {/* Hover glow effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-library-gold/10 pointer-events-none" />
    </button>
  );
}
