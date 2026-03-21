import { useState, useEffect } from 'react';
import { Heart, Sparkles, DollarSign, Coffee, X } from 'lucide-react';


interface CountdownAdProps {
  onClose: () => void;
  onDonate: () => void;
  theme: 'light' | 'dark';
}


export function CountdownAd({ onClose, onDonate, theme }: CountdownAdProps) {
  const [countdown, setCountdown] = useState(5);
  const [canClose, setCanClose] = useState(false);


  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanClose(true);
    }
  }, [countdown]);


  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 4k:p-8">
      <div className={`${theme === 'dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl 4k:rounded-[3rem] p-8 4k:p-16 max-w-xl 4k:max-w-6xl w-full shadow-2xl relative`}>
        {canClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 4k:top-8 4k:right-8 p-2 4k:p-4 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X size={24} className="4k:w-12 4k:h-12" />
          </button>
        )}


        <div className="text-center">
          <div className="flex justify-center gap-2 4k:gap-4 mb-4 4k:mb-8">
            <Heart className="text-red-500 animate-bounce 4k:w-24 4k:h-24" size={40} />
            <Sparkles className="text-yellow-500 animate-pulse 4k:w-24 4k:h-24" size={40} />
            <Coffee className="text-orange-500 animate-bounce 4k:w-24 4k:h-24" size={40} />
          </div>


          <h2 className={`text-3xl 4k:text-7xl font-bold mb-4 4k:mb-8 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Wait! You've watched 10 shows! <Sparkles className="inline text-yellow-500 4k:w-16 4k:h-16" size={28} />
          </h2>


          <div className={`text-lg 4k:text-4xl mb-6 4k:mb-12 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} space-y-3 4k:space-y-6`}>
            <p className="font-semibold text-xl 4k:text-5xl">
              You're clearly LOVING WilStream! <Heart className="inline text-red-500 animate-pulse 4k:w-12 4k:h-12" size={24} />
            </p>


            <div className="bg-red-500/20 p-4 4k:p-8 rounded-xl 4k:rounded-3xl border-2 4k:border-4 border-red-500">
              <p className="font-bold text-lg 4k:text-4xl mb-2 4k:mb-4">But did you know?</p>
              <ul className="text-left list-disc list-inside space-y-1 4k:space-y-3">
                <li>This took MONTHS to build</li>
                <li>Server costs add up FAST</li>
                <li>I'm just ONE person maintaining this</li>
                <li>Your support keeps it AD-FREE</li>
              </ul>
            </div>


            <p className="text-2xl 4k:text-6xl font-bold text-blue-500">
              <DollarSign className="inline 4k:w-12 4k:h-12" size={24} />
              Just $1-3 would mean THE WORLD!
              <Heart className="inline text-red-500 4k:w-12 4k:h-12" size={24} />
            </p>


            <p className="italic 4k:text-3xl">
              You've already gotten SO MUCH value... won't you give back? <Coffee className="inline 4k:w-10 4k:h-10" size={20} />
            </p>
          </div>


          <button
            onClick={onDonate}
            className="w-full px-8 py-4 4k:px-16 4k:py-8 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-xl 4k:rounded-3xl font-bold text-xl 4k:text-5xl transition-all shadow-xl mb-3 4k:mb-6"
          >
            <Heart className="inline mr-2 4k:mr-4 4k:w-12 4k:h-12" size={24} />
            Yes! I'll Support WilStream
          </button>


          {!canClose && (
            <p className="text-gray-500 text-sm 4k:text-3xl">
              You can skip in {countdown} seconds...
            </p>
          )}


          {canClose && (
            <button
              onClick={onClose}
              className={`px-6 py-2 4k:px-12 4k:py-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} hover:underline text-sm 4k:text-3xl`}
            >
              Maybe later (but please reconsider!)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


