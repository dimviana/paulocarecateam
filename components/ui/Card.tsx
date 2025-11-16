
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-[var(--theme-card-bg)] rounded-2xl p-6 border border-[var(--theme-text-primary)]/10 shadow-sm ${className}`}>
      {children}
    </div>
  );
};

export default Card;