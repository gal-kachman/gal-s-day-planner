import { LibraryItem } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Film, Tv, Podcast, FileText, User, Calendar } from 'lucide-react';

interface LibraryDetailModalProps {
  item: LibraryItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const mediaTypeIcons: Record<string, typeof BookOpen> = {
  'ספר': BookOpen,
  'סרט': Film,
  'סדרה': Tv,
  'פודקאסט': Podcast,
  'מאמר': FileText,
};

export function LibraryDetailModal({ item, isOpen, onClose }: LibraryDetailModalProps) {
  if (!item) return null;
  
  const MediaIcon = mediaTypeIcons[item.mediaType] || BookOpen;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="library-modal max-w-2xl bg-library-paper border-library-wood-dark" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-serif-display text-2xl text-library-ink flex items-center gap-3">
            <MediaIcon className="h-6 w-6 text-library-gold" />
            {item.hebrewTitle}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 mt-4">
          {/* Cover image */}
          <div className="flex justify-center">
            {item.imageUrl ? (
              <img 
                src={item.imageUrl} 
                alt={item.hebrewTitle}
                className="w-full max-w-[200px] rounded-lg shadow-lg border-2 border-library-wood/30"
              />
            ) : (
              <div className="w-full max-w-[200px] aspect-[2/3] bg-library-wood/20 rounded-lg flex items-center justify-center border-2 border-library-wood/30">
                <MediaIcon className="h-16 w-16 text-library-wood/50" />
              </div>
            )}
          </div>
          
          {/* Details */}
          <div className="space-y-4">
            {/* Original title */}
            {item.originalTitle && (
              <p className="text-muted-foreground font-sans text-sm" dir="ltr">
                {item.originalTitle}
              </p>
            )}
            
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-library-wood/20 text-library-ink">
                {item.mediaType}
              </Badge>
              {item.status && (
                <Badge variant="outline" className="border-library-gold/50 text-library-gold">
                  {item.status}
                </Badge>
              )}
            </div>
            
            {/* Meta info */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {item.creators && (
                <div className="flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  <span>{item.creators}</span>
                </div>
              )}
              {item.year && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>{item.year}</span>
                </div>
              )}
            </div>
            
            {/* Summary */}
            {item.summary && (
              <div className="space-y-2">
                <h4 className="font-semibold text-library-ink">תקציר</h4>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {item.summary}
                </p>
              </div>
            )}
            
            {/* Notes */}
            {item.notes && (
              <div className="space-y-2">
                <h4 className="font-semibold text-library-ink">הערות</h4>
                <p className="text-sm text-foreground/80 leading-relaxed bg-library-wood/10 p-3 rounded-lg">
                  {item.notes}
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
