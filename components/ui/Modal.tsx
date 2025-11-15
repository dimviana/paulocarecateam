
import React, { Fragment } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm" onClick={onClose}>
        <div 
            className="bg-gray-900 border border-red-600/50 rounded-xl shadow-lg shadow-red-900/30 w-full max-w-lg m-4 text-white transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale" 
            onClick={(e) => e.stopPropagation()}
            style={{animation: 'fade-in-scale 0.3s forwards'}}
        >
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <h3 className="text-xl font-bold text-red-500">{title}</h3>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white transition"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
