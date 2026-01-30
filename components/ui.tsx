import React, { ReactNode, forwardRef } from 'react';

// --- Card ---
interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', onClick }) => (
  <div 
    onClick={onClick} 
    className={`glass-panel shadow-glass rounded-3xl p-6 transition-all duration-300 ${onClick ? 'cursor-pointer hover:shadow-glass-hover hover:-translate-y-0.5' : ''} ${className}`}
  >
    {children}
  </div>
);

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ children, variant = 'primary', size = 'md', className = '', ...props }, ref) => {
  const base = "inline-flex items-center justify-center rounded-xl font-semibold tracking-wide transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed select-none focus:outline-none focus:ring-2 focus:ring-offset-1";
  
  const variants = {
    primary: "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/25 border border-transparent hover:shadow-emerald-500/40 focus:ring-emerald-500",
    secondary: "bg-white text-stone-700 shadow-sm border border-stone-200 hover:bg-stone-50 hover:border-stone-300 focus:ring-stone-200",
    danger: "bg-white text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300 shadow-sm focus:ring-red-200",
    ghost: "bg-transparent text-stone-500 hover:bg-stone-100 hover:text-stone-800 focus:ring-stone-200",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs h-8",
    md: "px-5 py-2.5 text-sm h-10",
    lg: "px-8 py-3.5 text-base h-12",
  };

  return (
    <button ref={ref} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
});

// --- Input ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, className = '', ...props }, ref) => (
  <div className="w-full">
    {label && <label className="block text-sm font-semibold text-stone-700 mb-2 ml-1">{label}</label>}
    <input
      ref={ref}
      className={`w-full bg-white/60 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-800 placeholder-stone-400 transition-all focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${className}`}
      {...props}
    />
    {error && <p className="mt-1.5 text-xs text-red-500 ml-1 font-medium">{error}</p>}
  </div>
));

// --- Select ---
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ label, error, children, className = '', ...props }, ref) => (
  <div className="w-full">
    {label && <label className="block text-sm font-semibold text-stone-700 mb-2 ml-1">{label}</label>}
    <div className="relative">
      <select
        ref={ref}
        className={`w-full bg-white/60 border border-stone-200 rounded-xl px-4 py-2.5 text-stone-800 appearance-none transition-all focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${className}`}
        {...props}
      >
        {children}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-stone-500">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </div>
    </div>
    {error && <p className="mt-1.5 text-xs text-red-500 ml-1 font-medium">{error}</p>}
  </div>
));

// --- Badge ---
interface BadgeProps {
  children: ReactNode;
  color?: 'stone' | 'primary' | 'red' | 'green' | 'amber';
}

export const Badge: React.FC<BadgeProps> = ({ children, color = 'stone' }) => {
  const colors = {
    stone: "bg-stone-100 text-stone-600 border border-stone-200",
    primary: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    green: "bg-green-50 text-green-700 border border-green-200",
    red: "bg-red-50 text-red-700 border border-red-200",
    amber: "bg-amber-50 text-amber-700 border border-amber-200",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${colors[color]}`}>
      {children}
    </span>
  );
};

// --- Modal ---
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-stone-900/10 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="relative w-full max-w-lg glass-panel rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-stone-100/50">
          <h3 className="text-xl font-bold text-stone-800 tracking-tight">{title}</h3>
          <button onClick={onClose} className="p-2 -mr-2 hover:bg-stone-100/50 rounded-full text-stone-400 hover:text-stone-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {children}
        </div>
        {footer && (
          <div className="p-6 border-t border-stone-100/50 bg-stone-50/30 rounded-b-3xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};