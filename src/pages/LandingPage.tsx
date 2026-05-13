import { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Zap, Shield, Globe, Layout, Layers, RefreshCw, Twitter, Mail, ExternalLink, Linkedin, MessageSquare, UserCheck, X, CheckCircle2, Github, Instagram, Facebook, Send, Phone } from 'lucide-react';
import Navbar from '../components/Navbar';
import Logo from '../components/Logo';
import { Link } from 'react-router-dom';

const ADDON_RELEASES_URL = 'https://github.com/Maijied/Lorapok-TabMan/releases/latest';
const ADDON_DOWNLOAD_URL = 'https://github.com/Maijied/Lorapok-TabMan/releases/latest/download/lorapok-tabman-latest.zip';

function InstallModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-lg bg-[#0a0f1a] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
      >
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-sky-500/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <Logo size={40} />
            <div>
              <h2 className="text-xl font-black text-white">Install Lorapok TabMan</h2>
              <p className="text-slate-500 text-xs mt-0.5">Firefox Add-on · Free · Open Source</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
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
        <button onClick={onClose} className="w-full mt-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 font-bold text-sm transition-all border border-white/5">
          Got it
        </button>
      </motion.div>
    </div>
  );
}

export default function LandingPage() {
  const [showInstallModal, setShowInstallModal] = useState(false);

  return (
    <div className="relative overflow-hidden bg-[#030711]">
      <Navbar />

      <AnimatePresence>
        {showInstallModal && <InstallModal onClose={() => setShowInstallModal(false)} />}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-sky-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-3/4 h-[400px] bg-sky-500/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold uppercase tracking-widest mb-6">
              <Logo size={12} className="hover:scale-100" /> A Product of Lorapok Labs
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8 leading-[0.9]"
          >
            Collapse the <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-600">Chaos.</span><br />
            Save your <span className="text-white">Memory.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Lorapok TabMan instantly converts all your open tabs into a single, beautiful list.
            Reduce memory usage by up to 95% and reclaim your focus.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/dashboard">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(56,189,248,0.4)' }}
                whileTap={{ scale: 0.97 }}
                className="group relative w-full sm:w-auto px-10 py-4 rounded-2xl font-black text-lg text-white overflow-hidden focus:outline-none focus:ring-4 focus:ring-sky-500/40"
                style={{ background: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 50%, #0284c7 100%)' }}
              >
                {/* Shimmer */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                {/* Glow */}
                <div className="absolute inset-0 rounded-2xl shadow-[0_0_30px_rgba(56,189,248,0.35)] group-hover:shadow-[0_0_50px_rgba(56,189,248,0.55)] transition-shadow duration-300" />
                <span className="relative flex items-center gap-2.5">
                  <Layout className="w-5 h-5" />
                  Launch Dashboard
                </span>
              </motion.button>
            </Link>
            <motion.button
                onClick={() => setShowInstallModal(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-bold text-lg backdrop-blur-md transition-all flex items-center gap-2"
              >
                <Download className="w-5 h-5" /> Download Addon
              </motion.button>
            </motion.div>
        </div>
      </section>

      {/* App Preview / Dashboard Mockup */}
      <section className="px-6 py-20 relative overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-sky-500 font-bold tracking-widest text-xs uppercase">Dashboard Preview</span>
            <h2 className="text-3xl font-black mt-2">Your tabs, organized.</h2>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative rounded-3xl border border-white/10 bg-[#0a0f1a] overflow-hidden shadow-2xl"
          >
            {/* Browser chrome */}
            <div className="h-10 bg-white/[0.03] border-b border-white/10 flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
              <div className="ml-4 flex-1 h-6 bg-white/5 rounded-md flex items-center px-3">
                <span className="text-[10px] text-slate-600 font-mono">maijied.github.io/Lorapok-TabMan/#/dashboard</span>
              </div>
            </div>
            <div className="flex h-[420px] overflow-hidden">
              {/* Sidebar */}
              <div className="w-52 border-r border-white/5 p-4 flex flex-col gap-3 shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-sky-500/20 border border-sky-500/30" />
                  <div className="flex flex-col gap-1">
                    <div className="h-2.5 w-20 bg-white/20 rounded-sm" />
                    <div className="h-1.5 w-14 bg-emerald-400/40 rounded-sm" />
                  </div>
                </div>
                {['My Groups', 'Analytics', 'Archive', 'Settings', 'Help'].map((item, i) => (
                  <div key={item} className={`flex items-center gap-2 p-2 rounded-xl text-xs font-bold ${i === 0 ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'text-slate-500'}`}>
                    <div className={`w-3 h-3 rounded-sm ${i === 0 ? 'bg-sky-400/50' : 'bg-white/10'}`} />
                    {item}
                  </div>
                ))}
                <div className="mt-auto pt-4 border-t border-white/5 space-y-2">
                  <div className="flex justify-between text-[10px] text-slate-600"><span>Total Groups</span><span className="text-sky-400 font-bold">12</span></div>
                  <div className="flex justify-between text-[10px] text-slate-600"><span>Total Tabs</span><span className="text-sky-400 font-bold">87</span></div>
                  <div className="flex justify-between text-[10px] text-slate-600"><span>Memory Saved</span><span className="text-emerald-400 font-bold">~4.3GB</span></div>
                </div>
              </div>
              {/* Main content */}
              <div className="flex-1 p-5 overflow-hidden">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-9 bg-white/[0.03] border border-white/5 rounded-xl" />
                  <div className="h-9 w-24 bg-white/[0.03] border border-white/5 rounded-xl" />
                </div>
                {/* Tab groups */}
                {[
                  { name: 'Work Session', tabs: 8, tag: 'work', starred: true, color: 'amber' },
                  { name: 'Research — AI Tools', tabs: 14, tag: 'research', starred: false, color: 'sky' },
                  { name: 'Dev Resources', tabs: 6, tag: 'dev', starred: false, color: 'purple' },
                ].map((group) => (
                  <div key={group.name} className="mb-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${group.starred ? 'bg-amber-400' : 'bg-white/20'}`} />
                        <span className="text-sm font-bold text-slate-200">{group.name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold bg-${group.color}-500/10 text-${group.color}-400 border border-${group.color}-500/20`}>#{group.tag}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500">{group.tabs} tabs</span>
                        <div className="px-3 py-1 bg-sky-500/20 text-sky-400 rounded-lg text-[10px] font-bold">Restore All</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {Array.from({ length: Math.min(group.tabs, 5) }).map((_, i) => (
                        <div key={i} className="flex items-center gap-1.5 px-2 py-1 bg-white/[0.03] rounded-lg border border-white/5">
                          <div className="w-3 h-3 rounded-sm bg-white/10" />
                          <div className="h-1.5 w-16 bg-white/10 rounded-sm" />
                        </div>
                      ))}
                      {group.tabs > 5 && <div className="flex items-center px-2 py-1 text-[10px] text-slate-500">+{group.tabs - 5} more</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-sky-500/3 via-transparent to-purple-500/3" />
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black mb-4">Engineered for Performance.</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">Built with modern tech for a seamless, lightning-fast experience.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard icon={<Zap className="w-6 h-6 text-yellow-400" />} title="Instant Collapse" description="One click to save all open tabs into a single list and free up system memory immediately." />
          <FeatureCard icon={<RefreshCw className="w-6 h-6 text-sky-400" />} title="Hybrid Storage" description="Use local JSON storage for quick use, or sync with Firebase for cross-device backup." />
          <FeatureCard icon={<Shield className="w-6 h-6 text-emerald-400" />} title="Privacy First" description="Your tab data is yours. We don't track your browsing or sell your data. Open source and secure." />
          <FeatureCard icon={<Layout className="w-6 h-6 text-purple-400" />} title="Group Organization" description="Organize tabs into groups, name them, star them, and add custom tags for advanced filtering." />
          <FeatureCard icon={<Layers className="w-6 h-6 text-blue-400" />} title="Memory Master" description="Reduces tab memory usage by up to 95%. Perfect for power users and developers." />
          <FeatureCard icon={<Globe className="w-6 h-6 text-pink-400" />} title="Cloud Sync" description="Access your saved tab groups from any device with Lorapok TabMan installed." />
          <FeatureCard icon={<RefreshCw className="w-6 h-6 text-amber-400" />} title="Cross-Browser Migration" description="Easily import your data from Chrome's OneTab or export to JSON for universal portability." />
        </div>
      </section>

      {/* Architecture */}
      <section id="architecture" className="py-24 px-6 border-t border-white/5 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-sky-500 font-bold tracking-widest text-xs uppercase mb-4 block">System Architecture</span>
              <h2 className="text-4xl md:text-5xl font-black mb-8">Inside the <span className="text-sky-400">Lab.</span></h2>
              <div className="space-y-8">
                <div className="flex gap-6">
                  <div className="w-12 h-12 shrink-0 rounded-2xl bg-sky-500/10 flex items-center justify-center border border-sky-500/20">
                    <span className="text-sky-400 font-bold">01</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold mb-2">Atomic Capture Engine</h4>
                    <p className="text-slate-400 text-sm md:text-base">Our background engine utilizes the low-level WebExtensions API to atomically capture tab state across multiple windows, ensuring no data loss during high-load sessions.</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="w-12 h-12 shrink-0 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                    <span className="text-purple-400 font-bold">02</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold mb-2">Real-time Reactive Sync</h4>
                    <p className="text-slate-400 text-sm md:text-base">Using Firebase Firestore's reactive listeners, your dashboard updates instantly across all devices. Change a name on your laptop, see it on your desktop in milliseconds.</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="w-12 h-12 shrink-0 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                    <span className="text-emerald-400 font-bold">03</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold mb-2">Memory Isolation Layer</h4>
                    <p className="text-slate-400 text-sm md:text-base">By offloading tab metadata to a separate process, we isolate your browsing history from active system resources, reclaiming locked RAM immediately.</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="w-12 h-12 shrink-0 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                    <span className="text-amber-400 font-bold">04</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold mb-2">Tab Snooze Engine</h4>
                    <p className="text-slate-400 text-sm md:text-base">The background script uses <code className="text-sky-400 text-xs bg-sky-500/10 px-1 rounded">browser.alarms</code> to periodically check tab inactivity and automatically discard idle tabs — freeing RAM without losing your session.</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="w-12 h-12 shrink-0 rounded-2xl bg-pink-500/10 flex items-center justify-center border border-pink-500/20">
                    <span className="text-pink-400 font-bold">05</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold mb-2">ABAC Security Model</h4>
                    <p className="text-slate-400 text-sm md:text-base">Firestore rules enforce Attribute-Based Access Control — every read and write is validated against the authenticated user's identity, ensuring complete data isolation.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-sky-500/20 to-purple-500/20 border border-white/10 p-8 flex items-center justify-center overflow-hidden">
                <div className="relative w-full h-full flex items-center justify-center">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute inset-0 border-2 border-dashed border-sky-500/20 rounded-full" />
                  <motion.div animate={{ rotate: -360 }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className="absolute inset-8 border-2 border-dashed border-purple-500/20 rounded-full" />
                  <div className="relative z-10 bg-slate-900 p-8 rounded-full border border-white/10 shadow-2xl overflow-hidden">
                    <Logo size={120} />
                  </div>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-sky-500 shadow-[0_0_20px_rgba(56,189,248,0.5)]" />
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.5)]" />
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]" />
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-pink-500 shadow-[0_0_20px_rgba(236,72,153,0.5)]" />
                </div>
              </div>
              <div className="absolute -top-4 -right-4 px-4 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs font-mono text-sky-400">React 19</div>
              <div className="absolute -bottom-4 -left-4 px-4 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs font-mono text-purple-400">Firestore</div>
              <div className="absolute top-1/2 -right-8 px-4 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs font-mono text-emerald-400">Vite</div>
            </div>
          </div>

          {/* GitHub / Open Source Section */}
          <div id="github" className="mt-24 pt-24 border-t border-white/5">
            <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-8 md:p-12">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
                <div>
                  <h3 className="text-3xl font-black mb-2 flex items-center gap-3">
                    <Logo size={40} />
                    lorapok/tabman
                  </h3>
                  <p className="text-slate-400 text-lg">A next-generation Firefox tab manager. Fully open source and audited.</p>
                </div>
                <div className="flex gap-4">
                  <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-slate-300">Apache-2.0 License</div>
                  <div className="px-4 py-2 bg-sky-500/10 border border-sky-500/20 rounded-xl text-xs font-bold text-sky-400">v1.0.0 Stable</div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 group hover:border-sky-500/30 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center mb-6"><Layers className="w-5 h-5 text-sky-400" /></div>
                  <h4 className="font-bold mb-4">Core Architecture</h4>
                  <p className="text-sm text-slate-400 leading-relaxed">Decoupled architecture using WebExtensions API for atomic capture and React 19 for real-time dashboard management.</p>
                </div>
                <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 group hover:border-purple-500/30 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6"><Shield className="w-5 h-5 text-purple-400" /></div>
                  <h4 className="font-bold mb-4">Security Audited</h4>
                  <p className="text-sm text-slate-400 leading-relaxed">Strict ABAC (Attribute-Based Access Control) defined in Firestore rules ensure your data stays isolated and secure.</p>
                </div>
                <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 group hover:border-emerald-500/30 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6"><Zap className="w-5 h-5 text-emerald-400" /></div>
                  <h4 className="font-bold mb-4">Performance First</h4>
                  <p className="text-sm text-slate-400 leading-relaxed">Built with Vite and optimized for zero-latency interactions even with thousands of archived tab sessions.</p>
                </div>
              </div>

              <div className="mt-12 flex flex-col md:flex-row items-center justify-center gap-6">
                <a href="https://github.com/Maijied/Lorapok-TabMan" target="_blank" rel="noopener noreferrer" className="w-full md:w-auto px-8 py-4 bg-white text-black rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-200 transition-colors shadow-xl">
                  <Logo size={24} /> View Repository
                </a>
                <button
                  onClick={() => window.print()}
                  className="w-full md:w-auto px-8 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-white/10 transition-colors"
                >
                  Download Specs (PDF)
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 px-6 text-center border-t border-white/5 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-500/5 blur-[150px] rounded-full" />
        <div className="max-w-3xl mx-auto relative z-10">
          <h2 className="text-4xl md:text-5xl font-black mb-6">Ready to regain your focus?</h2>
          <p className="text-slate-400 text-lg mb-10">Join thousands of users who trust Lorapok TabMan to manage their digital clutter.</p>
          <div className="flex justify-center gap-4">
            <Link to="/dashboard">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(56,189,248,0.4)' }}
                whileTap={{ scale: 0.97 }}
                className="group relative px-10 py-4 rounded-2xl font-black text-lg text-white overflow-hidden focus:outline-none focus:ring-4 focus:ring-sky-500/40"
                style={{ background: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 50%, #0284c7 100%)' }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <div className="absolute inset-0 rounded-2xl shadow-[0_0_30px_rgba(56,189,248,0.35)] group-hover:shadow-[0_0_50px_rgba(56,189,248,0.55)] transition-shadow duration-300" />
                <span className="relative flex items-center gap-2.5">
                  <Layout className="w-5 h-5" />
                  Go to Dashboard
                </span>
              </motion.button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="border-t border-white/10 bg-black/30 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 shrink-0">
            <Logo size={32} />
            <div>
              <span className="text-base font-bold text-slate-200 block">Lorapok Labs &middot; Bangladesh</span>
              <span className="text-sm text-slate-500">&copy; {new Date().getFullYear()} Lorapok Labs. All rights reserved.</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {[
              { href: 'https://github.com/lorapok', icon: <Github className="w-5 h-5" />, label: 'GitHub' },
              { href: 'https://x.com/lorapoklabs', icon: <Twitter className="w-5 h-5" />, label: 'X / Twitter' },
              { href: 'mailto:lorapokdev@gmail.com', icon: <Mail className="w-5 h-5" />, label: 'Email' },
              { href: 'https://www.linkedin.com/showcase/lorapok/', icon: <Linkedin className="w-5 h-5" />, label: 'LinkedIn' },
              { href: 'https://www.reddit.com/r/LorapokLabs/', icon: <MessageSquare className="w-5 h-5" />, label: 'Reddit' },
              { href: 'https://gravatar.com/lorapok', icon: <UserCheck className="w-5 h-5" />, label: 'Gravatar' },
              { href: 'https://www.instagram.com/lorapoklabs/', icon: <Instagram className="w-5 h-5" />, label: 'Instagram' },
              { href: 'https://www.facebook.com/lorapoklabs', icon: <Facebook className="w-5 h-5" />, label: 'Facebook' },
              { href: 'https://lorapok.com/contact', icon: <ExternalLink className="w-5 h-5" />, label: 'Contact' },
            ].map(({ href, icon, label }) => (
              <a key={label} href={href} target={href.startsWith('mailto') ? undefined : '_blank'} rel="noopener noreferrer"
                className="p-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 hover:border-sky-500/30 transition-all"
                title={label}>{icon}</a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="p-8 rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-sm group hover:border-sky-500/30 transition-all"
    >
      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-slate-400 leading-relaxed text-sm md:text-base">{description}</p>
    </motion.div>
  );
}
