import React from 'react';

/**
 * Google Material Symbols CDN Icon Component.
 * Renders crisp, scalable materialistic vector icons from Google CDN.
 */
export default function MaterialIcon({
  name,
  className = '',
  filled = false,
  size = 18,
}) {
  return (
    <span
      className={`material-symbols-outlined select-none align-middle inline-flex items-center justify-center shrink-0 ${className}`}
      style={{
        fontSize: `${size}px`,
        width: `${size}px`,
        height: `${size}px`,
        fontVariationSettings: filled ? "'FILL' 1, 'wght' 600" : "'FILL' 0, 'wght' 400",
        lineHeight: 1,
      }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}
