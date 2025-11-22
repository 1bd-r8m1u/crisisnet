import React from 'react';

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'outline' }> = ({ 
  children, 
  className = '', 
  variant = 'primary', 
  ...props 
}) => {
  const baseStyle = "px-4 py-2 rounded-md font-medium transition-all duration-200 active:scale-95 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-medical-600 hover:bg-medical-500 text-white shadow-lg shadow-medical-900/50",
    secondary: "bg-slate-700 hover:bg-slate-600 text-white",
    danger: "bg-alert-600 hover:bg-alert-500 text-white",
    outline: "border-2 border-slate-600 text-slate-300 hover:border-medical-500 hover:text-medical-500 bg-transparent"
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
  <div className={`bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-xl ${className}`}>
    {(title || action) && (
      <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
        {title && <h3 className="text-lg font-semibold text-medical-100 tracking-tight">{title}</h3>}
        {action && <div>{action}</div>}
      </div>
    )}
    {children}
  </div>
);

export const Badge: React.FC<{ children: React.ReactNode; color?: 'blue' | 'red' | 'green' | 'yellow' | 'orange' | 'teal' | 'gray' }> = ({ children, color = 'blue' }) => {
  const colors = {
    blue: 'bg-blue-900/50 text-blue-200 border-blue-700',
    red: 'bg-red-900/50 text-red-200 border-red-700',
    green: 'bg-green-900/50 text-green-200 border-green-700',
    yellow: 'bg-yellow-900/50 text-yellow-200 border-yellow-700',
    orange: 'bg-orange-900/50 text-orange-200 border-orange-700',
    teal: 'bg-teal-900/50 text-teal-200 border-teal-700',
    gray: 'bg-slate-700 text-slate-300 border-slate-600'
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs border ${colors[color]} font-mono uppercase`}>
      {children}
    </span>
  );
};