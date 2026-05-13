import { cn } from '../lib/utils';

interface LogoProps {
  className?: string;
  size?: number | string;
}

export default function Logo({ className, size = 32 }: LogoProps) {
  return (
    <div 
      className={cn("relative group flex items-center justify-center transition-all duration-300", className)}
      style={{ width: size, height: size }}
    >
      {/* Dynamic Glow Effect */}
      <div className="absolute inset-0 bg-accent/30 blur-[15px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      <div className="relative w-full h-full rounded-full bg-gradient-to-br from-white/10 to-transparent border border-white/20 p-0 overflow-hidden shadow-lg shadow-accent/20">
        <img 
          src="/logo.png" 
          alt="Lorapok TabMan Logo" 
          className="w-full h-full object-cover relative z-10 group-hover:scale-110 transition-transform duration-700"
          onError={(e) => {
            // Fallback to SVG if image fails to load
            e.currentTarget.style.display = 'none';
            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
            if (fallback) {
              fallback.classList.remove('hidden');
              fallback.classList.add('block');
            }
          }}
        />
        <svg 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full hidden p-2 font-accent"
        >
          <circle cx="50" cy="50" r="45" fill="var(--background-main)" stroke="var(--accent-color)" strokeWidth="4" />
          <path 
            d="M35 35V65H55" 
            stroke="var(--accent-color)" 
            strokeWidth="8" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        </svg>
      </div>
    </div>
  );
}
