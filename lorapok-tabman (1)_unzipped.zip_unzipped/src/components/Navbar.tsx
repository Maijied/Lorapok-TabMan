import { Link } from 'react-router-dom';
import { Github, Download, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import Logo from './Logo';

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#030711]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <Logo size={32} />
          <span className="font-bold text-xl tracking-tight">
            Lorapok <span className="text-sky-400">Tabman</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Home</Link>
          <Link to="/features" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Features</Link>
          <a href="https://github.com/lorapok" className="text-sm font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-1">
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
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="group relative flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-white px-5 py-2 rounded-full text-sm font-semibold shadow-lg shadow-sky-500/20 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
            <Download className="w-4 h-4" />
            Add to Firefox
          </motion.button>
        </div>
      </div>
    </nav>
  );
}
