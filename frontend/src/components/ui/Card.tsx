import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, className = '' }, ref) => {
    return (
      <div
        ref={ref}
        className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}
      >
        {children}
      </div>
    );
  }
);

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ children, className = '' }, ref) => {
    return (
      <div
        ref={ref}
        className={`px-6 py-4 border-b border-gray-200 ${className}`}
      >
        {children}
      </div>
    );
  }
);

const CardBody = React.forwardRef<HTMLDivElement, CardBodyProps>(
  ({ children, className = '' }, ref) => {
    return (
      <div
        ref={ref}
        className={`px-6 py-4 ${className}`}
      >
        {children}
      </div>
    );
  }
);

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ children, className = '' }, ref) => {
    return (
      <div
        ref={ref}
        className={`px-6 py-4 border-t border-gray-200 bg-gray-50 ${className}`}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
CardHeader.displayName = 'CardHeader';
CardBody.displayName = 'CardBody';
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardBody, CardFooter }; 