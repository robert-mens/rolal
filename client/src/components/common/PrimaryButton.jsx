import React from 'react';

/**
 * Reusable Primary Action Button
 * Modern rounded pill geometry, subtle tactile press (120-180ms), high contrast.
 */
export default function PrimaryButton({
  children,
  onClick,
  disabled = false,
  loading = false,
  className = '',
  size = 'md', // 'sm' | 'md' | 'lg'
  type = 'button',
}) {
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-xs sm:text-sm',
    lg: 'px-6 py-3 text-sm font-black',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={[
        'rounded-full font-black uppercase tracking-wider text-[#051A0E] bg-[#00E676] hover:bg-[#00C853]',
        'transition-all duration-150 active:scale-[0.98] select-none shadow-odds-active',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none',
        'inline-flex items-center justify-center gap-2',
        sizeStyles[size] || sizeStyles.md,
        className,
      ].filter(Boolean).join(' ')}
    >
      {loading ? (
        <>
          <div className="w-3.5 h-3.5 border-2 border-[#051A0E] border-t-transparent rounded-full animate-spin" />
          <span>Processing…</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
