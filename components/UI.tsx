
import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
  variant?: 'default' | 'glass' | 'solid' | 'active';
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick, style, variant = 'default' }) => {
  const baseStyles = "relative overflow-hidden rounded-[2rem] transition-all duration-500 border";
  
  const variants = {
    default: "bg-[#0F1210]/60 backdrop-blur-2xl border-white/5 shadow-2xl shadow-black/50 hover:border-white/10 hover:shadow-[0_0_30px_-10px_rgba(16,185,129,0.1)]",
    glass: "bg-white/[0.02] backdrop-blur-lg border-white/5 hover:bg-white/[0.04] hover:border-emerald-500/20",
    solid: "bg-[#101412] border-white/5 hover:border-emerald-500/30",
    active: "bg-emerald-900/10 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
  };

  return (
    <motion.div
      style={style}
      whileHover={onClick ? { y: -4 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${onClick ? 'cursor-pointer group' : ''} ${className}`}
    >
      {/* Noise Texture Overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay" />
      
      {/* Top Gradient Highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50" />
      
      {/* Content */}
      <div className="relative z-10 h-full">{children}</div>
      
      {/* Interactive Glow (Only if clickable) */}
      {onClick && (
        <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent rotate-45 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none" />
      )}
    </motion.div>
  );
};

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', onClick, className = '', disabled }) => {
  const styles = {
    primary: 'bg-emerald-500 text-black shadow-[0_0_25px_rgba(16,185,129,0.35)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] border-emerald-400',
    secondary: 'bg-white/5 text-white border-white/10 hover:bg-white/10 hover:border-white/20',
    ghost: 'bg-transparent text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/5 hover:border-emerald-500/40',
    danger: 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40'
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      disabled={disabled}
      onClick={onClick}
      className={`px-8 py-4 rounded-2xl border font-black uppercase tracking-[0.2em] text-[10px] transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-20 disabled:grayscale font-heading ${styles[variant]} ${className}`}
    >
      {children}
    </motion.button>
  );
};

export const Badge: React.FC<{ children: React.ReactNode; color?: string; className?: string; style?: React.CSSProperties }> = ({ children, color = 'emerald', className = '', style }) => (
  <span 
    style={style}
    className={`px-3 py-1 rounded-md text-[9px] uppercase font-black tracking-[0.2em] font-tech border backdrop-blur-md ${
      color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
      color === 'blue' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
      color === 'zinc' ? 'bg-zinc-800/50 text-zinc-400 border-zinc-700/50' :
      'bg-white/5 text-zinc-500 border-white/10'
    } ${className}`}
  >
    {children}
  </span>
);

export const StatCard: React.FC<{ label: string; value: string; subValue?: string; icon: React.ReactNode }> = ({ label, value, subValue, icon }) => (
  <Card variant="glass" className="flex flex-col gap-2 p-6 group h-full justify-between">
    <div className="flex justify-between items-start mb-2">
      <span className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.3em] font-tech group-hover:text-emerald-500 transition-colors">{label}</span>
      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 border border-white/5 group-hover:bg-emerald-500 group-hover:text-black group-hover:border-emerald-400 transition-all duration-300 shadow-lg shadow-black/20">
        {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-4 h-4" })}
      </div>
    </div>
    
    <div>
      <h3 className="text-4xl lg:text-5xl font-black text-white italic tracking-tighter font-heading leading-none mb-1 group-hover:scale-105 transition-transform origin-left duration-500">{value}</h3>
      {subValue && (
        <div className="flex items-center gap-2">
           <div className="h-px w-4 bg-emerald-500/50" />
           <p className="text-emerald-500/60 text-[9px] font-black uppercase tracking-[0.2em] font-tech">{subValue}</p>
        </div>
      )}
    </div>
    
    {/* Decorative corner */}
    <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-emerald-500/20 rounded-br-[2rem] opacity-0 group-hover:opacity-100 transition-opacity" />
  </Card>
);

export const AchievementCard: React.FC<{ title: string; description: string; icon: React.ReactNode }> = ({ title, description, icon }) => (
  <Card variant="glass" className="relative p-6 flex flex-col items-center text-center overflow-hidden border-emerald-500/20 group hover:border-emerald-500/40 transition-colors">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/10 transition-colors duration-500" />
      
      {/* Icon with Rotating Rings */}
      <div className="relative mb-6 mt-2">
          <div className="w-20 h-20 rounded-full bg-black/40 border border-emerald-500/30 flex items-center justify-center relative z-10 backdrop-blur-md shadow-[0_0_20px_rgba(16,185,129,0.1)] group-hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all duration-500">
              <div className="text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)] transform group-hover:scale-110 transition-transform duration-300">
                  {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-10 h-10" })}
              </div>
          </div>
          {/* Rings */}
          <motion.div 
             animate={{ rotate: 360 }}
             transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
             className="absolute inset-[-6px] border border-dashed border-emerald-500/20 rounded-full group-hover:border-emerald-500/40 transition-colors"
          />
          <motion.div 
             animate={{ rotate: -360 }}
             transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
             className="absolute inset-[-12px] border border-dotted border-emerald-500/10 rounded-full group-hover:border-emerald-500/30 transition-colors"
          />
      </div>

      <h3 className="text-xl font-black italic uppercase text-white tracking-tighter mb-2 group-hover:text-emerald-400 transition-colors">{title}</h3>
      <p className="text-xs text-zinc-400 font-medium leading-relaxed max-w-[220px]">{description}</p>
      
      {/* Bottom Shine */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent group-hover:via-emerald-500/60 transition-all duration-500" />
  </Card>
);
