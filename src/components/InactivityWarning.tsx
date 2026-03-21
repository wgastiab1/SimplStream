import { useEffect, useState } from 'react';


interface InactivityWarningProps {
  onStillWatching: () => void;
  onDontShowAgain: () => void;
  onTimeout: () => void;
}


export function InactivityWarning({ onStillWatching, onDontShowAgain, onTimeout }: InactivityWarningProps) {
  const [countdown, setCountdown] = useState(100);


  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);


    return () => clearInterval(interval);
  }, [onTimeout]);


  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-700">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Are you still watching?</h2>
            <p className="text-gray-400 text-sm md:text-base">You've been inactive for 10 minutes</p>
          </div>
        </div>


        <div className="mb-6">
          <div className="text-center">
            <p className="text-gray-300 text-base md:text-lg mb-3">Returning to profile selection in</p>
            <div className="text-6xl md:text-7xl font-bold text-blue-500 mb-2">{countdown}</div>
            <p className="text-gray-400 text-sm">seconds</p>
          </div>
        </div>


        <div className="flex flex-col gap-3">
          <button
            onClick={onStillWatching}
            className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-base md:text-lg transition-all transform hover:scale-105 shadow-lg"
          >
            I'm still watching
          </button>
          <button
            onClick={onDontShowAgain}
            className="w-full px-6 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium text-sm md:text-base transition-all"
          >
            Don't show again
          </button>
        </div>
      </div>
    </div>
  );
}


