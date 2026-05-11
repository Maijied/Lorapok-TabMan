import { cn } from '../lib/utils';

interface LogoProps {
  className?: string;
  size?: number | string;
}

export default function Logo({ className, size = 32 }: LogoProps) {
  return (
    <div 
      className={cn("relative transition-transform hover:scale-110 flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <img 
        src={`${import.meta.env.BASE_URL}logo.png`} 
        alt="Lorapok Tabman Logo" 
        className="w-full h-full object-contain"
        onError={(e) => {
          // Fallback to SVG if image fails to load
          e.currentTarget.style.display = 'none';
          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
          if (fallback) fallback.style.display = 'block';
        }}
      />
      <svg 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full hidden"
      >
        {/* Background Tab Shape */}
        <path 
          d="M10 30C10 24.4772 14.4772 20 20 20H80C85.5228 20 90 24.4772 90 30V80C90 85.5228 85.5228 90 80 90H20C14.4772 90 10 85.5228 10 80V30Z" 
          fill="#030711" 
          stroke="#38bdf8" 
          strokeWidth="4"
        />
        {/* Stylized 'L' */}
        <path 
          d="M40 40V70H60" 
          stroke="#38bdf8" 
          strokeWidth="8" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
      </svg>
    </div>
  );
}
