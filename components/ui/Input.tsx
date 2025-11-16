
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Input: React.FC<InputProps> = ({ label, id, ...props }) => {
  return (
    <div>
      {label && <label htmlFor={id} className="block text-sm font-medium text-[var(--theme-text-primary)]/80 mb-1">{label}</label>}
      <input
        id={id}
        className="w-full bg-[var(--theme-bg)] border border-[var(--theme-text-primary)]/20 text-[var(--theme-text-primary)] rounded-md px-3 py-2 focus:ring-[var(--theme-accent)] focus:border-[var(--theme-accent)] transition duration-150 ease-in-out placeholder:text-[var(--theme-text-primary)]/40"
        {...props}
      />
    </div>
  );
};

export default Input;