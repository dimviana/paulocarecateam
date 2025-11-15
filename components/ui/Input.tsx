
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Input: React.FC<InputProps> = ({ label, id, ...props }) => {
  return (
    <div>
      {label && <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>}
      <input
        id={id}
        className="w-full bg-gray-900/50 border border-gray-600 text-white rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500 transition duration-150 ease-in-out"
        {...props}
      />
    </div>
  );
};

export default Input;
