import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'lg' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm" onClick={onClose}>
        <div 
            className={`bg-white rounded-xl shadow-xl w-full ${sizeClasses[size]} m-4 text-slate-800 transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale`} 
            onClick={(e) => e.stopPropagation()}
            style={{animation: 'fade-in-scale 0.3s forwards'}}
        >
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
                <h3 className="text-xl font-bold text-amber-600">{title}</h3>
                <button
                    onClick={onClose}
                    className="text-slate-500 hover:text-slate-800 transition"
                    aria-label="Close modal"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div className="p-6">
                {children}
            </div>
        </div>
        <style>{`
          @keyframes fade-in-scale {
            to {
              transform: scale(1);
              opacity: 1;
            }
          }
        `}</style>
    </div>
  );
};

export default Modal;