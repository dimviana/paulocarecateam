
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-red-600/30 rounded-lg shadow-lg shadow-gray-300/30 dark:shadow-red-900/20 p-6 ${className}`}>
      {children}
    </div>
  );
};

export default Card;