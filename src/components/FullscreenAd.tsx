import { useState, useEffect } from 'react';
import { Heart, Sparkles, Coffee, Zap, Star } from 'lucide-react';


interface FullscreenAdProps {
  onClose: () => void;
  onDonate: () => void;
  theme: 'light' | 'dark';
}


export function FullscreenAd({ onClose, onDonate, theme }: FullscreenAdProps) {
  const [countdown, setCountdown] = useState(10);


  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      onClose();
    }
  }, [countdown, onClose]);


  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center ${theme === 'dark' ? 'bg-gradient-to-br from-purple-900 to-blue-900' : 'bg-gradient-to-br from-purple-500 to-blue-500'} p-4 4k:p-8 overflow-y-auto`}>
      <div className="text-center max-w-3xl 4k:max-w-[120rem]">
        <div className="flex justify-center gap-4 4k:gap-8 mb-6 4k:mb-12 animate-bounce">
          <Star className="text-yellow-300 4k:w-40 4k:h-40" size={60} />
          <Heart className="text-red-300 4k:w-40 4k:h-40" size={60} />
          <Sparkles className="text-yellow-300 4k:w-40 4k:h-40" size={60} />
          <Coffee className="text-orange-300 4k:w-40 4k:h-40" size={60} />
          <Zap className="text-yellow-300 4k:w-40 4k:h-40" size={60} />
        </div>


        <h1 className="text-5xl md:text-7xl 4k:text-[12rem] font-bold text-white mb-8 4k:mb-16 drop-shadow-2xl">
          Still Watching? <Heart className="inline animate-pulse text-red-300 4k:w-52 4k:h-52" size={64} />
        </h1>


        <div className="text-white text-xl md:text-2xl 4k:text-6xl space-y-6 4k:space-y-12 mb-10 4k:mb-20">
          <p className="font-bold text-3xl 4k:text-8xl animate-pulse">
            WilStream has been serving you NON-STOP!
          </p>


          <div className="bg-white/20 backdrop-blur-md p-6 4k:p-12 rounded-2xl 4k:rounded-[3rem] border-2 4k:border-4 border-white/50">
            <p className="font-bold text-2xl 4k:text-7xl mb-4 4k:mb-8">Here's what you get for FREE:</p>
            <ul className="text-left list-disc list-inside space-y-2 4k:space-y-4 text-lg 4k:text-5xl">
              <li>Unlimited movies & TV shows</li>
              <li>Live TV channels</li>
              <li>No subscription fees EVER</li>
              <li>Beautiful, ad-light experience</li>
              <li>Made with LOVE by one developer</li>
            </ul>
          </div>


          <p className="font-bold text-4xl 4k:text-9xl text-yellow-300 drop-shadow-lg">
            <Sparkles className="inline animate-spin 4k:w-32 4k:h-32" size={40} />
            ALL I ASK: Consider a small donation!
            <Sparkles className="inline animate-spin 4k:w-32 4k:h-32" size={40} />
          </p>


          <p className="text-2xl 4k:text-7xl italic">
            You've been here a while... surely WilStream is worth $1-5? <Coffee className="inline 4k:w-24 4k:h-24" size={32} />
          </p>


          <p className="text-xl 4k:text-6xl text-red-300 font-semibold">
            Without support, WilStream might not survive <Heart className="inline animate-bounce 4k:w-20 4k:h-20" size={28} />
          </p>
        </div>


        <button
          onClick={onDonate}
          className="px-12 py-6 4k:px-24 4k:py-12 bg-white text-purple-600 hover:bg-gray-100 rounded-2xl 4k:rounded-[3rem] font-bold text-3xl 4k:text-8xl transition-all shadow-2xl mb-6 4k:mb-12 animate-pulse"
        >
          <Heart className="inline mr-3 4k:mr-6 4k:w-24 4k:h-24" size={36} />
          Donate & Keep WilStream Alive!
          <Sparkles className="inline ml-3 4k:ml-6 4k:w-24 4k:h-24" size={36} />
        </button>


        <p className="text-white/70 text-lg 4k:text-5xl">
          Auto-closing in {countdown} seconds...
        </p>
      </div>
    </div>
  );
}



