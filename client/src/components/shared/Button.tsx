import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  children: ReactNode;
  isLoading?: boolean;
}

export function Button({
  variant = 'primary',
  children,
  isLoading,
  disabled,
  className = '',
  ...rest
}: ButtonProps) {
  const base = 'btn';
  const variantClass = `btn-${variant}`;

  return (
    <button
      className={`${base} ${variantClass} ${className}`}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading ? <span className="btn-spinner" /> : children}
    </button>
  );
}
