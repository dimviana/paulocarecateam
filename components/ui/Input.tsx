
import React from 'react';

// FIX: Update component to forward refs to the underlying input element.
// This allows parent components to get a direct reference to the input DOM node.
const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label?: string }
>(({ label, id, ...props }, ref) => {
  return (
    <div>
      {label && <label htmlFor={id} className="block text-sm font-medium text-[var(--theme-text-primary)]/80 mb-1">{label}</label>}
      <input
        id={id}
        ref={ref}
        className="w-full bg-[var(--theme-bg)] border border-[var(--theme-text-primary)]/20 text-[var(--theme-text-primary)] rounded-md px-3 py-2 focus:ring-[var(--theme-accent)] focus:border-[var(--theme-accent)] transition duration-150 ease-in-out placeholder:text-[var(--theme-text-primary)]/40"
        {...props}
      />
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
