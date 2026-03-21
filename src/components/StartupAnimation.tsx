import { useEffect, useState, useRef } from 'react';
import { useTranslation } from '../context/LanguageContext';


interface StartupAnimationProps {
  onComplete: () => void;
}


export function StartupAnimation({ onComplete }: StartupAnimationProps) {
  const { t } = useTranslation();
  const [stage, setStage] = useState<'wil' | 'stream' | 'full' | 'slogan' | 'final' | 'fade'>('wil');
  const audioRef = useRef<HTMLAudioElement | null>(null);


  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audioRef.current.play().catch(_e => console.log('Audio autoplay prevented'));


    const timer1 = setTimeout(() => setStage('stream'), 1000);
    const timer2 = setTimeout(() => setStage('full'), 2400);
    const timer3 = setTimeout(() => setStage('slogan'), 3400);
    const timer4 = setTimeout(() => setStage('final'), 4400);
    const timer5 = setTimeout(() => setStage('fade'), 5700);
    const timer6 = setTimeout(() => onComplete(), 6000);


    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
      clearTimeout(timer6);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [onComplete]);


  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black transition-opacity duration-500 overflow-hidden ${
        stage === 'fade' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {(stage === 'final' || stage === 'fade') && (
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-fall-and-turn"
              style={{
                left: `${(i * 8.33) + Math.random() * 5}%`,
                top: '-10%',
                animationDelay: `${i * 0.15}s`,
                animationDuration: '1.8s',
              }}
            >
              <div
                className="w-2 h-96 rounded-full blur-md opacity-80"
                style={{
                  background: ['#3B82F6', '#EF4444', '#F97316', '#8B5CF6', '#10B981'][i % 5],
                  boxShadow: `0 0 40px ${['#3B82F6', '#EF4444', '#F97316', '#8B5CF6', '#10B981'][i % 5]}`,
                }}
              />
            </div>
          ))}
        </div>
      )}


      <div className="text-center relative z-10">
        {stage === 'wil' && (
          <div className="animate-scale-in">
            <h1 className="text-6xl md:text-8xl 4k:text-[12rem] font-bold text-blue-500 drop-shadow-2xl">
              Wil
            </h1>
          </div>
        )}


        {stage === 'stream' && (
          <div className="animate-scale-in bg-black px-8 py-4 4k:px-16 4k:py-8 rounded-xl 4k:rounded-3xl border border-white/10">
            <h1 className="text-6xl md:text-8xl 4k:text-[12rem] font-bold text-white drop-shadow-lg">
              Stream
            </h1>
          </div>
        )}


        {(stage === 'full' || stage === 'slogan' || stage === 'final' || stage === 'fade') && (
          <div className="animate-scale-in">
            <h1 className="text-6xl md:text-8xl 4k:text-[12rem] font-bold drop-shadow-2xl">
              <span className="text-blue-500">Wil</span>
              <span className="text-white">Stream</span>
            </h1>
            {(stage === 'slogan' || stage === 'final' || stage === 'fade') && (
              <p className="text-xl md:text-2xl 4k:text-6xl text-gray-400 mt-4 4k:mt-8 animate-fade-in-slow font-medium">
                {t('slogan')}
              </p>
            )}
          </div>
        )}
      </div>


      <style>{`
        @keyframes scale-in {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }


        @keyframes fade-in-slow {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }


        @keyframes fall-and-turn {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          70% {
            transform: translateY(70vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(70vh) rotate(90deg);
            opacity: 0;
          }
        }


        .animate-scale-in {
          animation: scale-in 0.6s ease-out forwards;
        }


        .animate-fade-in-slow {
          animation: fade-in-slow 1s ease-out forwards;
        }


        .animate-fall-and-turn {
          animation: fall-and-turn 1.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>
    </div>
  );
}


