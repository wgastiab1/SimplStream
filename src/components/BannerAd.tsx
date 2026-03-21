import { X, Heart, Sparkles, Gift } from 'lucide-react';


interface BannerAdProps {
  onClose: () => void;
  onDonate: () => void;
  theme: 'light' | 'dark';
}


export function BannerAd({ onClose, onDonate, theme }: BannerAdProps) {
  return (
    <div className={`fixed top-20 4k:top-40 left-0 right-0 z-40 ${theme === 'dark' ? 'bg-gradient-to-r from-purple-600 to-blue-600' : 'bg-gradient-to-r from-purple-500 to-blue-500'} text-white shadow-2xl animate-slide-down`}>
      <div className="4k:max-w-none max-w-7xl mx-auto px-4 4k:px-12 py-3 4k:py-6 flex items-center justify-between gap-4 4k:gap-8">
        <div className="flex items-center gap-3 4k:gap-6 flex-1">
          <Heart className="animate-pulse 4k:w-12 4k:h-12" size={24} />
          <p className="text-sm md:text-base 4k:text-3xl font-semibold">
            <Sparkles className="inline 4k:w-10 4k:h-10" size={16} /> Enjoying WilStream? Support the developer and help keep it FREE! <Gift className="inline 4k:w-10 4k:h-10" size={16} />
          </p>
        </div>
        <div className="flex items-center gap-2 4k:gap-4">
          <button
            onClick={onDonate}
            className="px-4 py-2 4k:px-8 4k:py-4 bg-white text-purple-600 hover:bg-gray-100 rounded-lg 4k:rounded-2xl font-bold text-sm 4k:text-2xl transition-all whitespace-nowrap"
          >
            Donate Now
          </button>
          <button
            onClick={onClose}
            className="p-2 4k:p-4 hover:bg-white/20 rounded-full transition-colors"
          >
            <X size={20} className="4k:w-10 4k:h-10" />
          </button>
        </div>
      </div>
      <style>{`
        @keyframes slide-down {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-down {
          animation: slide-down 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}


