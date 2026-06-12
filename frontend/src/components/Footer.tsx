import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';

/**
 * Shared site footer. Appears on every page so Privacy, Terms, Contact, and
 * Our Story are always one click away. `tone` adjusts colours for dark hero
 * backgrounds vs. light content pages.
 */
const Footer: React.FC<{ tone?: 'dark' | 'light' }> = ({ tone = 'dark' }) => {
  const navigate = useNavigate();

  if (tone === 'light') {
    return (
      <footer className="border-t border-slate-200 bg-white text-slate-500 py-6 mt-auto">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
            <span className="text-slate-700 font-bold text-sm">Gr8Day Bingo</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
            <button onClick={() => navigate('/welcome')} className="hover:text-slate-800 underline underline-offset-2">Our Story</button>
            <span>·</span>
            <button onClick={() => navigate('/terms')} className="hover:text-slate-800 underline underline-offset-2">Terms of Service</button>
            <span>·</span>
            <button onClick={() => navigate('/privacy')} className="hover:text-slate-800 underline underline-offset-2">Privacy Policy</button>
            <span>·</span>
            <a href="mailto:support@havagr8day.com" className="hover:text-slate-800 underline underline-offset-2">Contact Us</a>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-slate-900 text-slate-400 py-8 mt-auto">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Heart className="w-5 h-5 text-indigo-400 fill-indigo-400" />
          <span className="text-white font-bold">Gr8Day Bingo</span>
        </div>
        <p className="text-sm mb-4">Building stronger communities through everyday acts of kindness.</p>
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
          <button onClick={() => navigate('/welcome')} className="hover:text-slate-300 underline underline-offset-2">Our Story</button>
          <span>·</span>
          <button onClick={() => navigate('/terms')} className="hover:text-slate-300 underline underline-offset-2">Terms of Service</button>
          <span>·</span>
          <button onClick={() => navigate('/privacy')} className="hover:text-slate-300 underline underline-offset-2">Privacy Policy</button>
          <span>·</span>
          <a href="mailto:support@havagr8day.com" className="hover:text-slate-300 underline underline-offset-2">Contact Us</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
