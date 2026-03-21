import { ArrowLeft, Scale, Shield, FileText, AlertTriangle, Globe, Mail } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';


interface TermsViewProps {
  onBack: () => void;
}


export function TermsView({ onBack }: TermsViewProps) {
  const { effectiveTheme } = useTheme();


  const bgClass = effectiveTheme === 'dark' ? 'bg-black' : 'bg-gray-50';
  const textClass = effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900';
  const cardClass = effectiveTheme === 'dark' ? 'bg-gray-900' : 'bg-white border border-gray-200';


  return (
    <div className={`min-h-screen ${bgClass} ${textClass}`}>
      <div className={`fixed top-0 left-0 right-0 z-50 ${effectiveTheme === 'dark' ? 'bg-gradient-to-b from-black via-black/95 to-transparent' : 'bg-gradient-to-b from-white via-white/95 to-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button
            onClick={onBack}
            className={`flex items-center gap-2 ${textClass} hover:text-blue-400 transition-colors`}
          >
            <ArrowLeft size={24} />
            <span className="font-medium">Back</span>
          </button>
        </div>
      </div>


      <div className="pt-24 px-6 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Scale size={40} className="text-blue-500" />
              <h1 className={`text-5xl font-bold ${textClass}`}>Terms and Conditions</h1>
            </div>
            <p className={`text-xl ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Effective Date: October 2025
            </p>
          </div>


          <div className={`${cardClass} rounded-lg p-8 mb-6 shadow-lg`}>
            <div className="flex items-start gap-4 mb-4">
              <FileText size={28} className="text-blue-500 flex-shrink-0" />
              <div>
                <h2 className={`text-2xl font-bold mb-3 ${textClass}`}>1. Introduction</h2>
                <p className={`${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
                  Welcome to WilStream ("we," "us," "our," "the Service"). By accessing or using this website, you agree to comply with and be bound by these Terms and Conditions. If you do not agree, please do not use the Service.
                </p>
              </div>
            </div>
          </div>


          <div className={`${cardClass} rounded-lg p-8 mb-6 shadow-lg`}>
            <div className="flex items-start gap-4 mb-4">
              <Shield size={28} className="text-green-500 flex-shrink-0" />
              <div>
                <h2 className={`text-2xl font-bold mb-3 ${textClass}`}>2. Ownership and Scope 🏢</h2>
                <p className={`${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed mb-4`}>
                  All visual design, branding, features, and website code, including but not limited to the user interface and site experience, are the exclusive property of Andy and WilStream.
                </p>
                <p className={`${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed mb-3`}>
                  WilStream does not host, upload, or control the actual media streams. All movies, TV shows, and videos are streamed from external, third-party servers, including but not limited to:
                </p>
                <ul className={`list-disc list-inside space-y-1 ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} ml-4`}>
                  <li>VidSRC</li>
                  <li>Vidlink Pro</li>
                  <li>111Movies</li>
                  <li>Videasy</li>
                  <li>Vidfast</li>
                  <li>DaddyLive (for Live TV channels)</li>
                  <li>Other independently operated content sources</li>
                </ul>
                <p className={`${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed mt-4`}>
                  We make no claim to ownership, hosting, or control of the content accessed through these servers.
                </p>
              </div>
            </div>
          </div>


          <div className={`${cardClass} rounded-lg p-8 mb-6 shadow-lg`}>
            <div className="flex items-start gap-4 mb-4">
              <Globe size={28} className="text-purple-500 flex-shrink-0" />
              <div>
                <h2 className={`text-2xl font-bold mb-3 ${textClass}`}>3. External Content and API Attribution 🌐</h2>
                <p className={`${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed mb-3`}>
                  All media, trailers, posters, and metadata come from unaffiliated outside providers.
                </p>
                <p className={`${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed mb-3`}>
                  TMDB API data is used under license: <span className="italic">"This product uses the TMDB API but is not endorsed or certified by TMDB."</span>
                </p>
                <p className={`${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed mb-3`}>
                  Live TV channels are provided through DaddyLive embed streams. WilStream does not own, control, or manage these streams.
                </p>
                <p className={`${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed mb-3`}>
                  All intellectual property, trademarks, and copyright for video content belong to their respective owners.
                </p>
                <p className={`${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
                  We are not responsible for the accuracy, legality, or safety of third-party media, links, or data.
                </p>
              </div>
            </div>
          </div>


          <div className={`${cardClass} rounded-lg p-8 mb-6 shadow-lg`}>
            <div className="flex items-start gap-4 mb-4">
              <Shield size={28} className="text-blue-500 flex-shrink-0" />
              <div>
                <h2 className={`text-2xl font-bold mb-3 ${textClass}`}>4. Permitted Usage ✅</h2>
                <ul className={`list-disc list-inside space-y-2 ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  <li>WilStream is free for personal, non-commercial use.</li>
                  <li>Users may not resell, redistribute, record, or use the Service or linked streams for commercial purposes.</li>
                  <li>You must not attempt to bypass, modify, or disrupt features, security, or source attribution.</li>
                  <li>Any misuse, illegal behavior, or copyright violations are strictly prohibited.</li>
                  <li>Profile features including passcode protection, watchlist, watch history, and ad preferences are provided as-is and may be subject to browser storage limitations.</li>
                </ul>
              </div>
            </div>
          </div>


          <div className={`${cardClass} rounded-lg p-8 mb-6 shadow-lg`}>
            <div className="flex items-start gap-4 mb-4">
              <AlertTriangle size={28} className="text-yellow-500 flex-shrink-0" />
              <div>
                <h2 className={`text-2xl font-bold mb-3 ${textClass}`}>5. Ads and Third-Party Services 📢</h2>
                <p className={`${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed mb-3`}>
                  WilStream may display minimal ads to support the free service, including banner ads, countdown ads, fullscreen ads, and popup ads.
                </p>
                <p className={`${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed mb-3`}>
                  Users have the option to remove all ads by toggling the "Remove Ads" feature in their profile settings. This feature is completely free and requires no payment or subscription.
                </p>
                <p className={`${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed mb-3`}>
                  Additionally, streaming servers or external providers may display their own ads which are beyond WilStream's control.
                </p>
                <p className={`${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed mb-3`}>
                  These third-party providers may utilize cookies, trackers, and advertising platforms.
                </p>
                <p className={`${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed mb-3`}>
                  For additional privacy protection, we strongly recommend using browser ad/tracker blockers such as AdBlock or Ghostery.
                </p>
                <p className={`${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
                  WilStream cannot guarantee any minimum level of ad frequency or third-party ad behavior from external sources.
                </p>
              </div>
            </div>
          </div>


          <div className={`${cardClass} rounded-lg p-8 mb-6 shadow-lg`}>
            <div className="flex items-start gap-4 mb-4">
              <Shield size={28} className="text-indigo-500 flex-shrink-0" />
              <div>
                <h2 className={`text-2xl font-bold mb-3 ${textClass}`}>6. Data and Privacy 🔒</h2>
                <p className={`${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed mb-3`}>
                  WilStream itself does not collect, store, share, or sell your personal or usage data.
                </p>
                <p className={`${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed mb-3`}>
                  All profile data, watch history, and preferences are stored locally in your browser using localStorage. This data never leaves your device.
                </p>
                <p className={`${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed mb-3`}>
                  However, third-party servers, advertisers, or APIs may collect data per their own privacy policies.
                </p>
                <p className={`${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed mb-3`}>
                  You are solely responsible for reviewing and accepting the privacy practices of any connected service.
                </p>
                <p className={`${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
                  <strong>Parents and guardians:</strong> This Service is not designed for children under 13 without supervision.
                </p>
              </div>
            </div>
          </div>


          <div className={`${cardClass} rounded-lg p-8 mb-6 shadow-lg`}>
            <div className="flex items-start gap-4 mb-4">
              <Scale size={28} className="text-red-500 flex-shrink-0" />
              <div>
                <h2 className={`text-2xl font-bold mb-3 ${textClass}`}>7. Intellectual Property ©</h2>
                <p className={`${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed mb-3`}>
                  All site elements, text, graphics, UI, and original materials are © 2025 Andy/WilStream.
                </p>
                <p className={`${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed mb-3`}>
                  External video/server content is NOT claimed or owned by WilStream.
                </p>
                <p className={`${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
                  Use of third-party branding or trademarks is only for identification and descriptive purposes under fair use laws.
                </p>
              </div>
            </div>
          </div>


          <div className={`${cardClass} rounded-lg p-8 mb-6 shadow-lg`}>
            <div className="flex items-start gap-4 mb-4">
              <AlertTriangle size={28} className="text-orange-500 flex-shrink-0" />
              <div>
                <h2 className={`text-2xl font-bold mb-3 ${textClass}`}>8. Limitation of Liability ⚠️</h2>
                <p className={`${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed mb-3`}>
                  WilStream disclaims any liability for errors, omissions, interruptions, server downtime, illegal content, or damages resulting from use or inability to use the Service.
                </p>
                <p className={`${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed mb-3`}>
                  All content is provided as-is and as-available from independent sources.
                </p>
                <p className={`${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
                  You use WilStream at your own risk.
                </p>
              </div>
            </div>
          </div>


          <div className={`${cardClass} rounded-lg p-8 mb-6 shadow-lg`}>
            <div className="flex items-start gap-4 mb-4">
              <Globe size={28} className="text-cyan-500 flex-shrink-0" />
              <div>
                <h2 className={`text-2xl font-bold mb-3 ${textClass}`}>9. Links to Other Websites 🔗</h2>
                <p className={`${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed mb-3`}>
                  The Service may contain links or embeds to other sites not owned or operated by WilStream.
                </p>
                <p className={`${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
                  We do not control, recommend, or endorse any third-party content or policies. Use and access to these sites are at your own risk.
                </p>
              </div>
            </div>
          </div>


          <div className={`${cardClass} rounded-lg p-8 mb-6 shadow-lg`}>
            <div className="flex items-start gap-4 mb-4">
              <FileText size={28} className="text-pink-500 flex-shrink-0" />
              <div>
                <h2 className={`text-2xl font-bold mb-3 ${textClass}`}>10. Changes and Termination 🔄</h2>
                <p className={`${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed mb-3`}>
                  These Terms may be amended at any time without prior notice.
                </p>
                <p className={`${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
                  WilStream reserves the right to suspend, restrict, or terminate service to any user who violates these Terms.
                </p>
              </div>
            </div>
          </div>


          <div className={`${cardClass} rounded-lg p-8 mb-6 shadow-lg`}>
            <div className="flex items-start gap-4 mb-4">
              <Scale size={28} className="text-teal-500 flex-shrink-0" />
              <div>
                <h2 className={`text-2xl font-bold mb-3 ${textClass}`}>11. Governing Law ⚖️</h2>
                <p className={`${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
                  These Terms are governed by the laws of the State of Texas, United States, without regard to conflict of law principles.
                </p>
              </div>
            </div>
          </div>


          <div className={`${cardClass} rounded-lg p-8 shadow-lg text-center`}>
            <div className="flex items-center justify-center gap-3 mb-4">
              <Mail size={28} className="text-blue-500" />
              <h2 className={`text-2xl font-bold ${textClass}`}>12. Contact 📧</h2>
            </div>
            <p className={`${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-4`}>
              For any questions or legal requests, please email:
            </p>
            <a
              href="mailto:admin.WilStream@protonmail.com"
              className="text-blue-500 hover:text-blue-600 text-xl font-semibold"
            >
              admin.WilStream@protonmail.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}


