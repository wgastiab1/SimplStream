import { Heart, Sparkles, Gift, Coffee, Star } from 'lucide-react';


interface DonationPageProps {
  onClose: () => void;
  theme: 'light' | 'dark';
}


export function DonationPage({ onClose, theme }: DonationPageProps) {
  const handleDonate = () => {
    window.open('https://cash.app/$justanormalchrurro', '_blank');
  };


  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 overflow-y-auto">
      <div className={`${theme === 'dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl p-8 max-w-2xl w-full shadow-2xl`}>
        <div className="text-center">
          <div className="flex justify-center gap-2 mb-4">
            <Heart className="text-red-500 animate-pulse" size={48} />
            <Sparkles className="text-yellow-500 animate-pulse" size={48} />
            <Gift className="text-blue-500 animate-pulse" size={48} />
          </div>


          <h1 className={`text-4xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Support WilStream! <Star className="inline text-yellow-500 animate-spin" size={32} />
          </h1>


          <div className={`text-lg mb-8 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} space-y-4`}>
            <p className="flex items-center justify-center gap-2">
              <Coffee size={24} className="text-orange-500" />
              WilStream is completely FREE for you to use!
            </p>


            <p className="font-semibold text-2xl text-red-500">
              But it takes TIME, EFFORT, and LOVE to maintain! <Heart className="inline animate-bounce" size={28} />
            </p>


            <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 p-6 rounded-xl border-2 border-red-500">
              <p className="font-bold text-xl mb-2">Every donation helps:</p>
              <ul className="text-left list-disc list-inside space-y-2">
                <li>Keep the servers running 24/7</li>
                <li>Add new features YOU request</li>
                <li>Fix bugs and improve performance</li>
                <li>Keep WilStream AD-FREE (mostly!)</li>
                <li>Support a solo developer who made this possible</li>
              </ul>
            </div>


            <p className="text-2xl font-bold text-blue-500 flex items-center justify-center gap-2">
              <Sparkles size={24} />
              Even $1 makes a HUGE difference!
              <Sparkles size={24} />
            </p>


            <p className="italic text-xl">
              If WilStream has brought you joy, please consider giving back! <Heart className="inline text-red-500" size={24} />
            </p>
          </div>


          <button
            onClick={handleDonate}
            className="w-full px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-xl font-bold text-2xl transition-all shadow-xl mb-4 animate-pulse"
          >
            <Gift className="inline mr-2" size={28} />
            Donate Now via Cash App
            <Heart className="inline ml-2" size={28} />
          </button>


          <button
            onClick={onClose}
            className={`px-6 py-3 ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-900'} rounded-lg font-medium transition-colors`}
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}


