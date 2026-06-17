import { useState, useEffect, type FormEvent } from 'react';
import { Mail, Sparkles, Download, Heart, Compass, CheckCircle2, AlertCircle, Share2 } from 'lucide-react';
// @ts-ignore
import meditatingWomanImg from './assets/images/woman_meditating_nature_1781017857296.webp';

export default function App() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [path, setPath] = useState(window.location.pathname);
  const [shareSuccess, setShareSuccess] = useState(false);

  const handleShare = async () => {
    const shareData = {
      title: 'Activate Inner Goddess Meditation',
      text: 'Activate Inner Goddess Meditation',
      url: 'https://meditation.goddessrebornritual.com',
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText('https://meditation.goddessrebornritual.com');
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2500);
      } catch (err) {
        console.error('Failed to copy link:', err);
      }
    }
  };

  // Sync client-side SPA routing state with location path
  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (to: string) => {
    window.history.pushState({}, '', to);
    setPath(to);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubscribe = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Pre-validation of email input
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Redirect to Page 2 after a brief delightful transition
        setTimeout(() => {
          setLoading(false);
          navigate('/download');
        }, 800);
      } else {
        setLoading(false);
        setError(data.error || 'Unable to save subscription. Please try again.');
      }
    } catch (err) {
      setLoading(false);
      setError('We encountered a temporary connection issue. Please try again.');
      console.error('Subscription error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF7] text-[#2C3E2B] font-sans relative overflow-hidden flex flex-col justify-between">
      {/* Decorative Golden Ambient Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-[#e9bd0d]/5 blur-[60px] md:blur-[120px] pointer-events-none transform-gpu" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#6ea358]/5 blur-[80px] md:blur-[150px] pointer-events-none transform-gpu" />

      {/* Optionally Visited Top Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-4 flex justify-between items-center relative z-20">
        <div className="flex items-center gap-2 select-none">
          {path === '/download' && (
            <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-[#526B51] font-semibold">
              <Sparkles className="w-4 h-4 text-[#e9bd0d]" />
              <span>Goddess Reborn</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Router */}
      {path === '/download' ? (
        /* PAGE 2: DOWNLOAD PAGE */
        <main className="flex-grow flex items-center justify-center px-6 py-12 md:py-24 relative z-10">
          <div className="max-w-xl w-full bg-white/60 backdrop-blur-md rounded-3xl p-8 md:p-12 shadow-sm border border-[#6ea358]/10 text-center flex flex-col items-center">
            
            {/* Spiritual Lotus Icon Backdrop Container */}
            <div className="w-20 h-20 rounded-full bg-[#6ea358]/10 flex items-center justify-center text-[#6ea358] mb-8 animate-pulse">
              <Compass className="w-10 h-10 stroke-[1.5]" />
            </div>

            <span className="text-xs uppercase tracking-[0.25em] text-[#6ea358] font-semibold mb-3">
              Welcome Home Goddess
            </span>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-serif text-[#2C3E2B] leading-tight mb-4 tracking-wide font-normal">
              Your Meditation is Ready
            </h1>

            {/* Message */}
            <p className="text-base text-[#526B51] leading-relaxed mb-10 max-w-md font-sans">
              Take a moment for yourself. Unwind, create space for breath, and let your journey inward begin now.
            </p>

            {/* Download Link Button */}
            <a
              id="cta_download_button"
              href="https://drive.google.com/file/d/1DsapZ11778RcEBnoIl3AFr06aGHSCmQr/view?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 w-full bg-[#6ea358] text-white py-4 px-8 rounded-xl font-medium tracking-wide transition-all duration-300 hover:bg-[#5b8749] hover:shadow-lg hover:shadow-[#6ea358]/20 focus:outline-none focus:ring-2 focus:ring-[#6ea358]/50 active:scale-[0.99] text-lg"
            >
              <Download className="w-5 h-5 animate-bounce" />
              Download Meditation
            </a>

            {/* Share Section */}
            <div className="mt-4 w-full">
              <button
                id="cta_share_button"
                onClick={handleShare}
                className="inline-flex items-center justify-center gap-3 w-full bg-white text-[#2C3E2B] border-2 border-[#6ea358]/25 hover:border-[#6ea358]/60 hover:bg-[#6ea358]/5 py-3.5 px-8 rounded-xl font-medium tracking-wide transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#6ea358]/30 active:scale-[0.99] text-base shadow-sm"
              >
                <Share2 className={`w-4 h-4 transition-transform ${shareSuccess ? 'text-amber-500 scale-110' : 'text-[#6ea358]'}`} />
                <span>{shareSuccess ? 'Link Copied to Clipboard! ✨' : 'Share Meditation With Friend'}</span>
              </button>
            </div>

            {/* Back Button or Route trigger */}
            <button
              onClick={() => navigate('/')}
              className="mt-6 text-sm text-[#526B51] hover:text-[#6ea358] font-medium tracking-wide transition-colors focus:outline-none"
            >
              ← Back to main portal
            </button>

            {/* Affirmation Text Block */}
            <div className="mt-12 pt-8 border-t border-[#6ea358]/10 w-full">
              <span className="block text-amber-500 text-xs tracking-widest mb-2 font-serif">✧ GODDESS AFFIRMATION ✧</span>
              <p className="font-serif italic text-lg text-[#526B51] tracking-wide leading-relaxed">
                “I am powerful. I am important. I am love.”
              </p>
            </div>
          </div>
        </main>
      ) : (
        /* PAGE 1: LANDING PAGE */
        <main className="flex-grow flex flex-col md:flex-row relative z-10 w-full max-w-7xl mx-auto md:px-6 md:py-8 lg:py-16 items-stretch">
          
          {/* Left Side Content & Opt-In */}
          <div className="flex-1 flex flex-col justify-center px-6 py-12 md:py-8 md:pr-12 lg:pr-20">
            {/* Elegant Brand Tagline */}
            <div className="flex items-center gap-2 text-[#6ea358] mb-6">
              <Sparkles className="w-5 h-5 fill-[#e9bd0d]/20 text-[#e9bd0d]" />
              <span className="text-sm uppercase tracking-[0.3em] font-semibold text-[#526B51]">
                GODDESS REBORN
              </span>
            </div>

            {/* Hero Headings */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-[#2C3E2B] leading-[1.12] tracking-wide font-normal mb-6">
              Activate Your <br />
              <span className="relative inline-block">
                Inner Goddess
                <span className="absolute bottom-1 left-0 w-full h-[6px] bg-[#e9bd0d]/30 rounded-full -z-10" />
              </span>
            </h1>

            <p className="text-lg text-[#526B51] leading-relaxed mb-10 max-w-lg">
              Download a guided meditation to align with your truth and awaken the Goddess that has always lived within you.
            </p>

            {/* Email Form Section */}
            <div className="bg-white/50 backdrop-blur-md p-6 md:p-8 rounded-2xl border border-[#6ea358]/10 shadow-sm max-w-md w-full">
              <form onSubmit={handleSubscribe} className="space-y-4">
                <div>
                  <label htmlFor="email_capture" className="block text-xs uppercase tracking-widest text-[#526B51] font-semibold mb-2">
                    Enter your email to receive access
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#526B51]/60">
                      <Mail className="w-5 h-5 stroke-[1.5]" />
                    </span>
                    <input
                      id="email_capture"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      disabled={loading}
                      className="w-full bg-[#FDFCF7]/60 text-[#2C3E2B] pl-12 pr-4 py-3.5 rounded-xl border border-[#6ea358]/20 focus:outline-none focus:ring-2 focus:ring-[#6ea358]/40 focus:border-[#6ea358]/40 placeholder-[#2C3E2B]/40 leading-relaxed transition-all tracking-wide disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* Submit CTA Button */}
                <button
                  id="cta_submit_button"
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#6ea358] text-white py-4 px-6 rounded-xl font-medium tracking-wider transition-all duration-300 hover:bg-[#5b8749] hover:shadow-lg hover:shadow-[#6ea358]/20 focus:outline-none focus:ring-2 focus:ring-[#6ea358]/50 active:scale-[0.99] flex items-center justify-center gap-2 group text-base"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Opening Portal...</span>
                    </div>
                  ) : (
                    <>
                      <span>Get My Meditation</span>
                      <Sparkles className="w-4 h-4 text-[#e9bd0d] transition-transform duration-300 group-hover:scale-125" />
                    </>
                  )}
                </button>
              </form>

              {/* Status Indications */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-xl flex items-start gap-2.5 text-sm border border-red-100 animate-slideUp">
                  <AlertCircle className="w-5 h-5 shrink-0 text-red-500 stroke-[1.8]" />
                  <span>{error}</span>
                </div>
              )}

              {/* Secure statement */}
              <p className="mt-4 text-xs text-[#526B51]/75 text-center leading-relaxed">
                By submitting, you agree to receive emails such as ancient wisdom to activate the Goddess within and healings to break karmic patterns. No spam. Unsubscribe anytime. Your privacy is protected. Please review our <a href="https://privatepolicy.goddessrebornritual.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#2C3E2B] transition-colors font-medium">Privacy Policy</a>.
              </p>
            </div>

            {/* Natural Aesthetic Highlights */}
            <div className="mt-12 grid grid-cols-2 gap-4 max-w-md border-t border-[#6ea358]/10 pt-8">
              <div className="flex gap-2.5 items-start">
                <div className="p-1 rounded-full bg-[#e9bd0d]/10 text-amber-600 mt-0.5">
                  <Heart className="w-4 h-4 fill-amber-500/20" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#2C3E2B]">Goddess Power</h4>
                  <p className="text-xs text-[#526B51] mt-0.5">Reconnect with intuitive strength and flow.</p>
                </div>
              </div>
              <div className="flex gap-2.5 items-start">
                <div className="p-1 rounded-full bg-[#6ea358]/10 text-[#6ea358] mt-0.5">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#2C3E2B]">Inner Clarity</h4>
                  <p className="text-xs text-[#526B51] mt-0.5">Align with your truth.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side Photograph (Serene Goddess Reborn Woman Meditating in Sunrise Nature Setting) */}
          <div className="flex-1 min-h-[350px] md:min-h-0 md:h-auto relative group overflow-hidden md:rounded-3xl shadow-md border border-[#6ea358]/5 mb-8 md:mb-0 bg-[#fbfaf5]">
            <img
              src={meditatingWomanImg}
              alt="Bright Smiling Woman Meditating in Nature"
              referrerPolicy="no-referrer"
              loading="eager"
              fetchPriority="high"
              className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-10000 group-hover:scale-110"
            />
            {/* Ambient Overlay Layer to tie image with palette */}
            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#FDFCF7] via-transparent to-transparent opacity-80 md:opacity-100 md:w-1/3" />
            <div className="absolute inset-0 bg-gradient-to-tr from-[#6ea358]/10 via-transparent to-[#e9bd0d]/10 mix-blend-color-burn pointer-events-none" />
            
            {/* Visual focus element */}
            <div className="absolute bottom-6 right-6 bg-white/80 backdrop-blur-md py-3 px-5 rounded-xl border border-[#6ea358]/10 shadow-sm max-w-[240px] hidden sm:block">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#526B51] block mb-1">🌿 SACRED ATMOSPHERE</span>
              <p className="text-xs text-[#2C3E2B] font-serif italic">“In the stillness, my power returns.”</p>
            </div>
          </div>

        </main>
      )}

      {/* Footer Branding Area */}
      <footer className="w-full text-center py-6 px-4 border-t border-[#6ea358]/10 text-xs text-[#526B51]/60 relative z-10 select-none">
        <p>© 2026 Goddess Reborn. All rights reserved.</p>
      </footer>
    </div>
  );
}
