import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Github, Download, X, CheckCircle2, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Logo from './Logo';

// Direct download from GitHub Releases (latest release asset)
const ADDON_DOWNLOAD_URL = 'https://github.com/Maijied/Lorapok-TabMan/releases/latest/download/lorapok-tabman-latest.zip';
const ADDON_RELEASES_URL = 'https://github.com/Maijied/Lorapok-TabMan/releases/latest';

function InstallModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-lg bg-[#0a0f1a] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
      >
        {/* Glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-sky-500/10 blur-[80px] rounded-full pointer-events-none" />

        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <Logo size={40} />
            <div>
              <h2 className="text-xl font-black text-white">Install Lorapok TabMan</h2>
              <p className="text-slate-500 text-xs mt-0.5">Firefox Add-on · Free · Open Source</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Download button */}
        <a
          href={ADDON_DOWNLOAD_URL}
          download="lorapok-tabman-latest.zip"
          className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-black text-white text-sm mb-6 group relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 50%, #0284c7 100%)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          <Download className="w-5 h-5 relative" />
          <span className="relative">Download Latest ZIP</span>
        </a>

        <p className="text-center text-[10px] text-slate-600 mb-4">
          Or browse all releases:{' '}
          <a href={ADDON_RELEASES_URL} target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:underline">
            GitHub Releases <ExternalLink className="w-3 h-3 inline" />
          </a>
        </p>

        {/* Install steps */}
        <div className="space-y-3">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">How to install locally</p>
          {[
            { step: '01', text: 'Click "Download Latest ZIP" above and download the file' },
            { step: '02', text: 'Extract the ZIP to a folder on your computer' },
            { step: '03', text: 'Open Firefox and go to about:debugging' },
            { step: '04', text: 'Click "This Firefox" → "Load Temporary Add-on..."' },
            { step: '05', text: 'Select the manifest.json file inside the extracted folder' },
            { step: '06', text: 'The TabMan icon appears in your Firefox toolbar — done!' },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-[10px] font-black text-sky-500 font-mono mt-0.5 shrink-0">{step}</span>
              <p className="text-slate-300 text-sm leading-relaxed">{text}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-amber-300/80 text-xs leading-relaxed">
              <strong>Note:</strong> Temporary add-ons are removed when Firefox restarts. For permanent installation, wait for Mozilla review approval — we've submitted to AMO and it's pending review.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 font-bold text-sm transition-all border border-white/5"
        >
          Got it
        </button>
      </motion.div>
    </div>
  );
}

export default function Navbar() {
  const [showInstallModal, setShowInstallModal] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-background-main/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <Logo size={32} />
            <span className="font-bold text-xl tracking-tight">
              Lorapok{' '}
              <span className="relative inline-block text-accent">
                Tab<span className="text-accent">M</span>an
                <span className="absolute inset-0 blur-md bg-accent/30 rounded-sm animate-pulse pointer-events-none" />
              </span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Home</Link>
            <a href="#features" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Features</a>
            <a href="#architecture" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Architecture</a>
            <a href="#github" className="text-sm font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-1">
              <Github className="w-4 h-4" /> GitHub
            </a>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="text-sm font-medium px-4 py-2 rounded-full hover:bg-white/5 transition-colors"
            >
              Dashboard
            </Link>
            <motion.button
              onClick={() => setShowInstallModal(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group relative flex items-center gap-2 bg-accent hover:opacity-90 text-white px-5 py-2 rounded-full text-sm font-semibold shadow-lg shadow-accent/20 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
              <Download className="w-4 h-4" />
              Add to Firefox
            </motion.button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {showInstallModal && <InstallModal onClose={() => setShowInstallModal(false)} />}
      </AnimatePresence>
    </>
  );
}
