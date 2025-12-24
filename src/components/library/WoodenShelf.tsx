import { ReactNode } from 'react';

interface WoodenShelfProps {
  children: ReactNode;
}

export function WoodenShelf({ children }: WoodenShelfProps) {
  return (
    <div className="wooden-shelf-container mb-8">
      {/* Books container */}
      <div className="flex items-end justify-center gap-1 md:gap-2 px-4 pb-2 min-h-[200px] md:min-h-[240px] flex-wrap">
        {children}
      </div>
      
      {/* Wooden shelf */}
      <div className="wooden-shelf relative h-6 md:h-8 rounded-sm shadow-lg">
        {/* Main shelf */}
        <div className="absolute inset-0 bg-library-wood rounded-sm" />
        
        {/* Wood grain texture */}
        <div className="absolute inset-0 opacity-40 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMjAiPgo8cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjIwIiBmaWxsPSJ0cmFuc3BhcmVudCI+PC9yZWN0Pgo8bGluZSB4MT0iMCIgeTE9IjUiIHgyPSIxMDAiIHkyPSI1IiBzdHJva2U9IiM0YTM1MjgiIHN0cm9rZS13aWR0aD0iMC41IiBzdHJva2Utb3BhY2l0eT0iMC4zIj48L2xpbmU+CjxsaW5lIHgxPSIwIiB5MT0iMTIiIHgyPSIxMDAiIHkyPSIxMiIgc3Ryb2tlPSIjNGEzNTI4IiBzdHJva2Utd2lkdGg9IjAuMyIgc3Ryb2tlLW9wYWNpdHk9IjAuMiI+PC9saW5lPgo8L3N2Zz4=')] pointer-events-none" />
        
        {/* Shelf edge highlight */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-b from-library-wood-light to-transparent rounded-t-sm" />
        
        {/* Shelf bottom shadow */}
        <div className="absolute -bottom-2 left-2 right-2 h-2 bg-gradient-to-b from-black/20 to-transparent rounded-full blur-sm" />
      </div>
    </div>
  );
}
