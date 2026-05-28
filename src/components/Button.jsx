import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({ 
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) => {
  
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";
  
  const variants = {
    primary: "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.23)] hover:-translate-y-0.5 border border-emerald-400/50 focus:ring-emerald-500",
    secondary: "bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 focus:ring-slate-500",
    outline: "border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 active:bg-emerald-100 focus:ring-emerald-500",
    ghost: "text-emerald-600 hover:bg-emerald-50 active:bg-emerald-100 focus:ring-emerald-500",
    ghostDanger: "text-red-500 hover:bg-red-50 hover:text-red-600 active:bg-red-100 focus:ring-red-500",
    danger: "bg-red-500 hover:bg-red-600 active:bg-red-700 text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 focus:ring-red-500",
    success: "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm hover:shadow focus:ring-emerald-600"
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-4 py-2.5 text-base gap-2",
    lg: "px-6 py-3 text-lg gap-2.5"
  };
  
  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6"
  };

  const buttonClasses = `
    ${baseStyles}
    ${variants[variant]}
    ${sizes[size]}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  const IconComponent = icon;
  const iconClass = iconSizes[size];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={buttonClasses}
      {...props}
    >
      {loading && <Loader2 className={`${iconClass} animate-spin`} />}
      {!loading && icon && iconPosition === 'left' && <IconComponent className={iconClass} />}
      {children}
      {!loading && icon && iconPosition === 'right' && <IconComponent className={iconClass} />}
    </button>
  );
};

export default Button;