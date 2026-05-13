import { Link } from 'react-router-dom';
import { Github, Download } from 'lucide-react';
import { motion } from 'motion/react';
import Logo from './Logo';

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-background-main/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <Logo size={32} />
          <span className="font-bold text-xl tracking-tight">
            Lorapok{' '}
            <span className="relative inline-block text-accent">
              Tab<span className="text-accent">M</span>an
              {/* Glow animation */}
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
          <motion.a
            href="/extension/tabman-v1.0.0.zip"
            download
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="group relative flex items-center gap-2 bg-accent hover:opacity-90 text-white px-5 py-2 rounded-full text-sm font-semibold shadow-lg shadow-accent/20 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
            <Download className="w-4 h-4" />
            Add to Firefox
          </motion.a>
        </div>
      </div>
    </nav>
  );
}
