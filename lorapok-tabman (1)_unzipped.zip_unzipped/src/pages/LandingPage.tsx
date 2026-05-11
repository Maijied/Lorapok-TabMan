import { ReactNode } from 'react';
import { motion } from 'motion/react';
import { Download, Zap, Shield, Globe, MousePointer2, Layout, Layers, RefreshCw } from 'lucide-react';
import Navbar from '../components/Navbar';
import Logo from '../components/Logo';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden bg-[#030711]">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-sky-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-3/4 h-[400px] bg-sky-500/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold uppercase tracking-widest mb-6">
              <Logo size={12} className="hover:scale-100" /> A Product of Lorapok
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
            Lorapok Tabman instantly converts all your open tabs into a single, beautiful list. 
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
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto px-8 py-4 bg-sky-500 hover:bg-sky-400 text-white rounded-2xl font-bold text-lg shadow-xl shadow-sky-500/20 transition-all"
              >
                Launch Dashboard
              </motion.button>
            </Link>
            <a href="/extension/tabman-v1.0.0.zip" download>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-bold text-lg backdrop-blur-md transition-all flex items-center gap-2"
              >
                <Download className="w-5 h-5" /> Download Addon
              </motion.button>
            </a>
          </motion.div>
        </div>
      </section>

      {/* App Preview / Dashboard Mockup */}
      <section className="px-6 py-20 relative overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative rounded-3xl border border-white/10 bg-slate-900/50 backdrop-blur-xl overflow-hidden shadow-2xl"
          >
            <div className="h-10 bg-white/5 border-b border-white/10 flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
              <div className="w-3 h-3 rounded-full bg-green-500/50" />
              <div className="ml-4 h-6 w-1/2 bg-white/5 rounded-md" />
            </div>
            <div className="p-8 aspect-video flex flex-col gap-6 overflow-hidden">
              <div className="flex justify-between items-center bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/5">
                <div className="flex flex-col gap-2">
                  <div className="h-4 w-32 bg-sky-400/50 rounded-sm" />
                  <div className="h-3 w-48 bg-slate-500/20 rounded-sm" />
                </div>
                <div className="px-4 py-2 bg-sky-500/20 text-sky-400 rounded-lg text-sm font-bold uppercase tracking-wider">
                  Restore All
                </div>
              </div>
              <div className="space-y-4 opacity-50 select-none">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-white/5">
                    <div className="w-5 h-5 rounded-md bg-white/10" />
                    <div className="h-3 w-full max-w-md bg-white/5 rounded-sm" />
                    <div className="ml-auto w-4 h-4 rounded bg-white/5" />
                  </div>
                ))}
              </div>
            </div>
            {/* Glossy overlay */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-sky-500/5 via-transparent to-white/5" />
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
          <FeatureCard 
            icon={<Zap className="w-6 h-6 text-yellow-400" />}
            title="Instant Collapse"
            description="One click to save all open tabs into a single list and free up system memory immediately."
          />
          <FeatureCard 
            icon={<RefreshCw className="w-6 h-6 text-sky-400" />}
            title="Hybrid Storage"
            description="Use local JSON storage for quick use, or sync with Firebase for cross-device backup."
          />
          <FeatureCard 
            icon={<Shield className="w-6 h-6 text-emerald-400" />}
            title="Privacy First"
            description="Your tab data is yours. We don't track your browsing or sell your data. Open source and secure."
          />
          <FeatureCard 
            icon={<Layout className="w-6 h-6 text-purple-400" />}
            title="Group Organization"
            description="Organize tabs into groups, name them, star them, and lock them to prevent accidental deletion."
          />
          <FeatureCard 
            icon={<Layers className="w-6 h-6 text-blue-400" />}
            title="Memory Master"
            description="Reduces tab memory usage by up to 95%. Perfect for power users and developers."
          />
          <FeatureCard 
            icon={<Globe className="w-6 h-6 text-pink-400" />}
            title="Cloud Sync"
            description="Access your saved tab groups from any device with Lorapok Tabman installed."
          />
        </div>
      </section>

      {/* Inside the Lab / Architecture Section */}
      <section className="py-24 px-6 border-t border-white/5 bg-white/[0.01]">
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
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-sky-500/20 to-purple-500/20 border border-white/10 p-8 flex items-center justify-center overflow-hidden">
                <div className="relative w-full h-full flex items-center justify-center">
                  {/* Decorative Elements */}
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border-2 border-dashed border-sky-500/20 rounded-full"
                  />
                  <motion.div 
                    animate={{ rotate: -360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-8 border-2 border-dashed border-purple-500/20 rounded-full"
                  />
                  <div className="relative z-10 bg-slate-900 p-8 rounded-3xl border border-white/10 shadow-2xl">
                    <Logo size={80} />
                  </div>
                  
                  {/* Logic Nodes */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-sky-500 shadow-[0_0_20px_rgba(56,189,248,0.5)]" />
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.5)]" />
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]" />
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-pink-500 shadow-[0_0_20px_rgba(236,72,153,0.5)]" />
                </div>
              </div>
              {/* Floating Tech Badges */}
              <div className="absolute -top-4 -right-4 px-4 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs font-mono text-sky-400">React 19</div>
              <div className="absolute -bottom-4 -left-4 px-4 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs font-mono text-purple-400">Firestore</div>
              <div className="absolute top-1/2 -right-8 px-4 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs font-mono text-emerald-400">Vite</div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 px-6 text-center border-t border-white/5 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-500/5 blur-[150px] rounded-full" />
        <div className="max-w-3xl mx-auto relative z-10">
          <h2 className="text-4xl md:text-5xl font-black mb-6">Ready to regain your focus?</h2>
          <p className="text-slate-400 text-lg mb-10">Join thousands of users who trust Lorapok Tabman to manage their digital clutter.</p>
          <div className="flex justify-center gap-4">
            <Link to="/dashboard">
              <button className="px-8 py-4 bg-sky-500 hover:bg-sky-400 text-white rounded-2xl font-bold transition-all shadow-xl shadow-sky-500/20">
                Go to Dashboard
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5 text-center text-slate-500 text-sm">
        <div className="flex justify-center mb-6">
          <Logo size={40} className="opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all" />
        </div>
        <p>&copy; {new Date().getFullYear()} Lorapok Labs. Developed by Mohammad Maizied Hasan Majumder.</p>
        <div className="flex justify-center gap-6 mt-4">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          <a href="https://github.com/lorapok" className="hover:text-white transition-colors">GitHub</a>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: ReactNode, title: string, description: string }) {
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
