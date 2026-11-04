import React from 'react';

/**
 * Reusable Secondary Action Button
 * Modern rounded pill geometry, subtle tactile hover, high contrast outline/surface.
 */
export default function SecondaryButton({
  children,
  onClick,
  disabled = false,
  className = '',
  size = 'md', // 'sm' | 'md' | 'lg'
  type = 'button',
}) {
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-xs',
    lg: 'px-5 py-2.5 text-sm',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={[
        'rounded-full font-bold text-slate-200 bg-[#182235] hover:bg-[#202C45] hover:text-white',
        'border border-[#25344D] hover:border-slate-500',
        'transition-all duration-150 active:scale-[0.98] select-none',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none',
        'inline-flex items-center justify-center gap-1.5',
        sizeStyles[size] || sizeStyles.md,
        className,
      ].filter(Boolean).join(' ')}
    >
      {children}
    </button>
  );
}
