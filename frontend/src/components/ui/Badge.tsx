import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ children, variant = 'primary', size = 'md', className = '' }, ref) => {
    const sizeClasses = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
      lg: 'px-3 py-1.5 text-base',
    };

    const variantClasses = {
      primary: 'bg-blue-100 text-blue-800',
      secondary: 'bg-gray-100 text-gray-800',
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
      info: 'bg-indigo-100 text-indigo-800',
    };

    const classes = [
      'inline-flex items-center font-medium rounded-full',
      sizeClasses[size],
      variantClasses[variant],
      className,
    ].join(' ');

    return (
      <span ref={ref} className={classes}>
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge; 