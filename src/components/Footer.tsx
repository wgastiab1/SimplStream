import { FileText, Info, Mail } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';


interface FooterProps {
  onShowAbout: () => void;
  onShowTerms: () => void;
}


export function Footer({ onShowAbout, onShowTerms }: FooterProps) {
  const { effectiveTheme } = useTheme();


  const bgClass = effectiveTheme === 'dark' ? 'bg-gray-900' : 'bg-white border-t border-gray-200';
  const textClass = effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-600';


  return (
    <footer className={`${bgClass} py-8 mt-20`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <button
              onClick={onShowAbout}
              className={`flex items-center gap-2 ${textClass} hover:text-blue-500 transition-colors`}
            >
              <Info size={18} />
              <span>About</span>
            </button>
            <button
              onClick={onShowTerms}
              className={`flex items-center gap-2 ${textClass} hover:text-blue-500 transition-colors`}
            >
              <FileText size={18} />
              <span>Terms & Conditions</span>
            </button>
            <a
              href="mailto:admin.WilStream@protonmail.com"
              className={`flex items-center gap-2 ${textClass} hover:text-blue-500 transition-colors`}
            >
              <Mail size={18} />
              <span>Contact</span>
            </a>
          </div>
        </div>


        <div className={`mt-6 pt-6 border-t ${effectiveTheme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
          <p className={`text-center text-sm ${textClass} leading-relaxed`}>
            © 2025 <span className={effectiveTheme === 'dark' ? 'text-white' : 'text-black'}>WilStream</span> by <span className={effectiveTheme === 'dark' ? 'text-white' : 'text-black'}>Andy</span>. All rights reserved.
          </p>
          <p className={`text-center text-sm ${textClass} mt-2 leading-relaxed`}>
            Website design and interface are the exclusive property of Andy and WilStream.
          </p>
          <p className={`text-center text-sm ${textClass} mt-2 leading-relaxed`}>
            Movies, shows, and data are provided by third-party streaming servers (VidSRC, Vidlink Pro, 111Movies, Videasy, Vidfast, and others) and TMDB.
          </p>
          <p className={`text-center text-sm ${textClass} mt-2 leading-relaxed`}>
            Live TV channels are provided through DaddyLive embed streams.
          </p>
          <p className={`text-center text-sm ${textClass} mt-2 leading-relaxed`}>
            WilStream does not host, upload, or distribute copyrighted files; copyright remains with the respective owners.
          </p>
          <p className={`text-center text-sm ${textClass} mt-2 italic`}>
            "This product uses the TMDB API but is not endorsed or certified by TMDB."
          </p>
          <p className={`text-center text-sm ${textClass} mt-4 leading-relaxed`}>
            Have issues with Live TV channels or want to suggest new ones? <a href="mailto:admin.WilStream@protonmail.com" className="text-blue-500 hover:text-blue-600">Contact us</a>
          </p>
        </div>
      </div>
    </footer>
  );
}


