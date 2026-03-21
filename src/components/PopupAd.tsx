import { X, Heart, Gift } from 'lucide-react';


interface PopupAdProps {
  onClose: () => void;
  onDonate: () => void;
  theme: 'light' | 'dark';
}


export function PopupAd({ onClose, onDonate, theme }: PopupAdProps) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className={`relative max-w-md 4k:max-w-4xl w-full mx-4 4k:mx-8 ${theme === 'dark' ? 'bg-gradient-to-br from-purple-900 to-blue-900' : 'bg-gradient-to-br from-purple-100 to-blue-100'} rounded-2xl 4k:rounded-[3rem] shadow-2xl p-8 4k:p-16 animate-scale-in border-4 4k:border-8 ${theme === 'dark' ? 'border-purple-500' : 'border-purple-400'}`}>
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 4k:top-8 4k:right-8 p-2 4k:p-4 ${theme === 'dark' ? 'hover:bg-white/20' : 'hover:bg-black/10'} rounded-full transition-colors`}
        >
          <X size={24} className={`${theme === 'dark' ? 'text-white' : 'text-gray-800'} 4k:w-12 4k:h-12`} />
        </button>


        <div className="text-center">
          <div className="mb-4 4k:mb-8 flex justify-center">
            <div className={`p-4 4k:p-8 ${theme === 'dark' ? 'bg-white/10' : 'bg-white/50'} rounded-full`}>
              <Heart size={48} className={`${theme === 'dark' ? 'text-pink-400' : 'text-pink-600'} animate-pulse 4k:w-32 4k:h-32`} />
            </div>
          </div>


          <h2 className={`text-3xl 4k:text-7xl font-bold mb-4 4k:mb-8 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Enjoying WilStream?
          </h2>


          <p className={`text-lg 4k:text-4xl mb-6 4k:mb-12 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
            Help keep WilStream free for everyone! Your support helps us maintain and improve the service.
          </p>


          <button
            onClick={onDonate}
            className={`w-full px-8 py-4 4k:px-16 4k:py-8 ${theme === 'dark' ? 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700' : 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600'} text-white rounded-lg 4k:rounded-3xl font-bold text-lg 4k:text-4xl transition-all flex items-center justify-center gap-2 4k:gap-4 shadow-lg mb-4 4k:mb-8`}
          >
            <Gift size={24} className="4k:w-12 4k:h-12" />
            Support WilStream
          </button>


          <button
            onClick={onClose}
            className={`text-sm 4k:text-3xl ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'} transition-colors`}
          >
            Maybe later
          </button>
        </div>
      </div>


      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes scale-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}


