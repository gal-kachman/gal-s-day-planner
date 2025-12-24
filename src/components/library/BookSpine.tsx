import { LibraryItem } from '@/types';
import { cn } from '@/lib/utils';

interface BookSpineProps {
  item: LibraryItem;
  onClick: () => void;
}

// Color mapping for different media types
const mediaTypeColors: Record<string, { bg: string; border: string }> = {
  'ספר': { bg: 'bg-library-book', border: 'border-library-book-dark' },
  'סרט': { bg: 'bg-library-movie', border: 'border-library-movie-dark' },
  'סדרה': { bg: 'bg-library-tv', border: 'border-library-tv-dark' },
  'פודקאסט': { bg: 'bg-library-podcast', border: 'border-library-podcast-dark' },
  'מאמר': { bg: 'bg-library-article', border: 'border-library-article-dark' },
};

const defaultColors = { bg: 'bg-library-default', border: 'border-library-default-dark' };

export function BookSpine({ item, onClick }: BookSpineProps) {
  const colors = mediaTypeColors[item.mediaType] || defaultColors;
  
  return (
    <button
      onClick={onClick}
      className={cn(
        'book-spine group relative flex flex-col items-center justify-center',
        'h-[180px] w-[45px] md:h-[220px] md:w-[55px]',
        'rounded-sm border-2 cursor-pointer',
        'transition-all duration-300 ease-out',
        'hover:translate-y-[-8px] hover:shadow-lg hover:z-10',
        colors.bg,
        colors.border,
        'shadow-md'
      )}
      title={item.hebrewTitle}
    >
      {/* Leather texture overlay */}
      <div className="absolute inset-0 opacity-30 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwMDAwIiBmaWxsLW9wYWNpdHk9IjAuMDUiPjwvcmVjdD4KPC9zdmc+')] pointer-events-none" />
      
      {/* Gold embossed title */}
      <div className="book-title w-full px-1 text-center">
        <span className="text-library-gold font-serif-display text-[10px] md:text-xs font-semibold leading-tight line-clamp-4 [writing-mode:vertical-rl] rotate-180">
          {item.hebrewTitle}
        </span>
      </div>
      
      {/* Bottom decoration line */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-library-gold/50 rounded-full" />
      
      {/* Top decoration line */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-library-gold/30 rounded-full" />
      
      {/* Spine ridge effect */}
      <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-r from-black/20 to-transparent" />
      <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-gradient-to-l from-black/10 to-transparent" />
    </button>
  );
}
