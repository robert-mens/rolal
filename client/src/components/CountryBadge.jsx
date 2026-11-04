import React, { useState } from 'react';
import MaterialIcon from './MaterialIcon';

const COUNTRY_MAP = {
  brazil: 'br',
  br: 'br',
  australia: 'au',
  au: 'au',
  germany: 'de',
  de: 'de',
  'south africa': 'za',
  'south-africa': 'za',
  za: 'za',
  england: 'gb-eng',
  'gb-eng': 'gb-eng',
  gb: 'gb',
  japan: 'jp',
  jp: 'jp',
};

/**
 * Materialistic Country Flag / League Badge using CDN Flag Provider & Google Material Icons.
 * 100% emoji-free: uses FlagCDN high-res vector/PNG or Material Symbols fallback.
 */
export default function CountryBadge({ country = '', countryCode = '', className = '', size = 16 }) {
  const [imgError, setImgError] = useState(false);

  const cleanCountry = String(country || '').trim().toLowerCase();
  const cleanCode = String(countryCode || '').trim().toLowerCase();

  const iso = cleanCode ? (COUNTRY_MAP[cleanCode] || cleanCode) : (COUNTRY_MAP[cleanCountry] || null);

  if (!iso || iso === 'global' || cleanCountry === 'global' || cleanCountry === 'all' || imgError) {
    return (
      <MaterialIcon
        name={cleanCountry === 'global' || cleanCountry === 'all' ? 'public' : 'sports_soccer'}
        size={size}
        className={`text-[#00E676] ${className}`}
      />
    );
  }

  return (
    <img
      src={`https://flagcdn.com/w40/${iso}.png`}
      alt={country || 'Country'}
      loading="lazy"
      onError={() => setImgError(true)}
      className={`inline-block object-cover rounded-[1px] border border-white/10 shrink-0 ${className}`}
      style={{
        width: `${Math.round(size * 1.33)}px`,
        height: `${size}px`,
      }}
    />
  );
}
