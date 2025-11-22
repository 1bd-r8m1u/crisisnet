import React from 'react';

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'outline' }> = ({ 
  children, 
  className = '', 
  variant = 'primary', 
  ...props 
}) => {
  // Clinical: Square corners, Uppercase, Tracking
  const baseStyle = "px-4 py-2 rounded-sm font-display font-bold tracking-wider transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 uppercase text-sm";
  
  const variants = {
    primary: "bg-medical-600 hover:bg-medical-700 text-white shadow-sm",
    secondary: "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200",
    danger: "bg-red-600 hover:bg-red-700 text-white shadow-sm",
    outline: "border-2 border-slate-300 text-slate-600 hover:border-medical-600 hover:text-medical-600 bg-transparent"
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Card: React.FC<{ children: React.ReactNode; title?: string; className?: string; action?: React.ReactNode }> = ({ 
  children, 
  title, 
  className = '',
  action
}) => (
  // Card: White bg, Slate-200 border, shadow-sm
  <div className={`bg-white border border-slate-200 rounded-lg shadow-sm p-5 ${className}`}>
    {(title || action) && (
      <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
        {title && <h3 className="text-lg font-display font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span className="w-1 h-4 bg-medical-500 inline-block"></span>
            {title}
        </h3>}
        {action && <div>{action}</div>}
      </div>
    )}
    {children}
  </div>
);

export const Badge: React.FC<{ children: React.ReactNode; color?: 'blue' | 'red' | 'green' | 'yellow' | 'orange' | 'teal' | 'gray' }> = ({ children, color = 'blue' }) => {
  // Badge: Light backgrounds, dark text
  const colors = {
    blue: 'bg-medical-50 text-medical-700 border-medical-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    orange: 'bg-orange-50 text-orange-800 border-orange-200',
    teal: 'bg-teal-50 text-teal-700 border-teal-200',
    gray: 'bg-slate-100 text-slate-600 border-slate-200'
  };
  return (
    <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold border ${colors[color]} font-mono uppercase tracking-wider`}>
      {children}
    </span>
  );
};