import { MicroseasonInfo } from '@/types';
import botanicalCorner from '@/assets/botanical-corner.png';

interface MicroseasonHeaderProps {
  microseason: MicroseasonInfo;
}

export function MicroseasonHeader({ microseason }: MicroseasonHeaderProps) {
  return (
    <header className="microseason-strip relative overflow-hidden">
      {/* Botanical decoration - top right */}
      <img
        src={botanicalCorner}
        alt=""
        className="botanical-accent absolute -top-8 -right-8 w-40 h-40 rotate-180 opacity-20"
      />
      
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-6">
          {/* Date */}
          <div className="text-center sm:text-left">
            <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
              מחר
            </p>
            <p className="font-serif text-lg text-foreground">
              {microseason.date}
            </p>
          </div>

          {/* Microseason name */}
          <div className="flex-1 text-center">
            <h1 className="font-serif text-2xl sm:text-3xl font-light text-foreground tracking-wide">
              {microseason.name}
            </h1>
          </div>

          {/* Poetic tone */}
          <div className="text-center sm:text-right max-w-[200px]">
            <p className="font-serif text-sm italic text-muted-foreground leading-relaxed">
              "{microseason.tone}"
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
