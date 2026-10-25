import React from 'react';

/**
 * Pastel architectural illustration of City District Hospital
 * matching the soft serene hero banner in the reference design.
 */
export function HospitalHeroSvg({ hospitalLabel = 'CITY DISTRICT HOSPITAL', label }) {
  return (
    <svg
      viewBox="0 0 420 156"
      role="img"
      aria-label={label || hospitalLabel}
      className="w-full h-auto rounded-2xl border border-paper-border overflow-hidden select-none block"
    >
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#DDEAF4" />
          <stop offset="68%" stopColor="#EDF3F6" />
          <stop offset="100%" stopColor="#E4ECE6" />
        </linearGradient>
        <linearGradient id="lawnGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C8DDD1" />
          <stop offset="100%" stopColor="#B5CFC1" />
        </linearGradient>
        <linearGradient id="pathGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8E4DA" />
          <stop offset="100%" stopColor="#D8D2C5" />
        </linearGradient>
      </defs>

      {/* Soft morning sky */}
      <rect width="420" height="156" fill="url(#skyGrad)" />

      {/* Gentle soft clouds */}
      <g fill="#FFFFFF" opacity="0.82">
        <ellipse cx="68" cy="30" rx="28" ry="9" />
        <ellipse cx="84" cy="26" rx="18" ry="8" />
        <ellipse cx="52" cy="28" rx="14" ry="6" />

        <ellipse cx="344" cy="26" rx="30" ry="9" />
        <ellipse cx="328" cy="22" rx="18" ry="7" />
        <ellipse cx="362" cy="24" rx="15" ry="6" />
      </g>

      {/* Distant soft hills / foliage silhouette */}
      <path
        d="M0 116 Q70 96 150 112 T310 108 T420 114 L420 156 L0 156 Z"
        fill="#CFE0D6"
      />

      {/* Foreground lawn */}
      <rect x="0" y="118" width="420" height="38" fill="url(#lawnGrad)" />

      {/* Left & Right Wing Buildings */}
      <rect x="74" y="64" width="68" height="56" rx="2" fill="#F2EFE6" stroke="#C9C5B8" strokeWidth="1" />
      <rect x="278" y="64" width="68" height="56" rx="2" fill="#F2EFE6" stroke="#C9C5B8" strokeWidth="1" />
      <rect x="70" y="60" width="76" height="5" rx="1.5" fill="#7D98A6" />
      <rect x="274" y="60" width="76" height="5" rx="1.5" fill="#7D98A6" />

      {/* Left Wing Windows */}
      {[84, 102, 120].map((wx) => (
        <g key={`lw-${wx}`}>
          <rect x={wx} y="73" width="11" height="14" rx="1.5" fill="#9BBAD3" />
          <rect x={wx} y="94" width="11" height="14" rx="1.5" fill="#9BBAD3" />
        </g>
      ))}

      {/* Right Wing Windows */}
      {[289, 307, 325].map((wx) => (
        <g key={`rw-${wx}`}>
          <rect x={wx} y="73" width="11" height="14" rx="1.5" fill="#9BBAD3" />
          <rect x={wx} y="94" width="11" height="14" rx="1.5" fill="#9BBAD3" />
        </g>
      ))}

      {/* Center Main Hospital Pavilion */}
      <rect x="136" y="42" width="148" height="78" rx="2" fill="#FAF8F2" stroke="#C4BFB2" strokeWidth="1.2" />
      <rect x="131" y="37" width="158" height="6" rx="2" fill="#5D7D8D" />

      {/* Roofline Emblem Pediment + Red Medical Cross */}
      <rect x="192" y="21" width="36" height="20" rx="3" fill="#FAF8F2" stroke="#C4BFB2" strokeWidth="1.1" />
      <rect x="207.5" y="25" width="5" height="12" rx="1" fill="#C83E37" />
      <rect x="204" y="28.5" width="12" height="5" rx="1" fill="#C83E37" />

      {/* Upper Floor Windows on Center Block */}
      {[148, 168, 188, 220, 240, 260].map((wx) => (
        <rect key={`cw-${wx}`} x={wx} y="50" width="12" height="15" rx="1.5" fill="#90B4D0" />
      ))}

      {/* Hospital Fascia Signboard */}
      <rect x="148" y="71" width="124" height="13" rx="2" fill="#E9EEF2" stroke="#BCC8D1" strokeWidth="0.8" />
      <text
        x="210"
        y="80"
        textAnchor="middle"
        fill="#1E3F38"
        fontSize="6.7"
        fontWeight="800"
        letterSpacing="0.5"
      >
        {hospitalLabel.slice(0, 28)}
      </text>

      {/* Entrance Canopy & Glass Double Doors */}
      <rect x="172" y="88" width="76" height="5" rx="1.5" fill="#4E7368" />
      <rect x="180" y="93" width="60" height="27" fill="#DCE9F2" stroke="#9EB4C4" strokeWidth="1" />
      <line x1="210" y1="93" x2="210" y2="120" stroke="#7E99AC" strokeWidth="1.4" />
      <rect x="150" y="94" width="18" height="15" rx="1.5" fill="#9BBAD3" />
      <rect x="252" y="94" width="18" height="15" rx="1.5" fill="#9BBAD3" />

      {/* Welcoming Curved Walkway */}
      <polygon points="184,120 236,120 264,156 156,156" fill="url(#pathGrad)" />
      <line x1="210" y1="124" x2="210" y2="152" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.7" />

      {/* Left & Right Soft Sage Trees & Shrubs */}
      <g>
        {/* Left tree */}
        <rect x="35" y="102" width="5" height="22" rx="2" fill="#7D6B5D" />
        <circle cx="37" cy="92" r="18" fill="#8FB39E" />
        <circle cx="26" cy="98" r="12" fill="#9EC0AC" />
        <circle cx="48" cy="97" r="13" fill="#7CA28C" />
        {/* Left shrubs */}
        <ellipse cx="68" cy="120" rx="14" ry="7" fill="#7FA48E" />
        <ellipse cx="140" cy="121" rx="11" ry="5.5" fill="#88AC97" />

        {/* Right tree */}
        <rect x="378" y="100" width="5" height="24" rx="2" fill="#7D6B5D" />
        <circle cx="380" cy="90" r="19" fill="#8FB39E" />
        <circle cx="368" cy="96" r="13" fill="#9EC0AC" />
        <circle cx="392" cy="96" r="12" fill="#7CA28C" />
        {/* Right shrubs */}
        <ellipse cx="352" cy="120" rx="14" ry="7" fill="#7FA48E" />
        <ellipse cx="280" cy="121" rx="11" ry="5.5" fill="#88AC97" />
      </g>
    </svg>
  );
}

/**
 * Warm editorial companion illustration (older woman calmly checking her OPD slip on phone
 * with soft sage leaves), matching the bottom-right card of the reference board.
 */
export function CompanionPortraitSvg() {
  return (
    <svg
      viewBox="0 0 132 116"
      aria-hidden="true"
      focusable="false"
      className="w-28 sm:w-32 h-auto shrink-0 select-none"
    >
      {/* Soft sage halo */}
      <circle cx="62" cy="64" r="46" fill="#E2EDE7" />
      {/* Botanical leaves */}
      <path d="M18 88 C10 68, 22 46, 36 52 C28 66, 26 78, 18 88 Z" fill="#9BB9A8" />
      <path d="M104 42 C116 32, 124 46, 112 58 C106 52, 106 46, 104 42 Z" fill="#A9C4B4" />

      {/* Warm shawl / saree drape */}
      <path d="M24 114 C28 82, 46 72, 66 74 C86 76, 98 90, 102 114 Z" fill="#7D9B8C" />
      <path d="M34 114 C38 88, 52 78, 70 80 C80 82, 88 94, 92 114 Z" fill="#D8C3A5" />

      {/* Silver-grey hair bun & head */}
      <circle cx="44" cy="48" r="11" fill="#6F7779" />
      <circle cx="62" cy="46" r="16" fill="#C99673" />
      <path
        d="M46 44 C46 30, 76 28, 78 44 C72 38, 56 38, 46 44 Z"
        fill="#7B8385"
      />
      {/* Gentle smile & bindi */}
      <circle cx="69" cy="41" r="1.3" fill="#B93832" />
      <circle cx="67" cy="45" r="1.4" fill="#2A2421" />
      <path d="M65 52 Q69 55 72 52" fill="none" stroke="#6E4432" strokeWidth="1.4" strokeLinecap="round" />

      {/* Hand holding smartphone */}
      <rect x="86" y="68" width="16" height="26" rx="3" transform="rotate(-12 86 68)" fill="#1C443D" />
      <rect x="88.5" y="71" width="11" height="19" rx="1.5" transform="rotate(-12 88.5 71)" fill="#E5F2EC" />
      <path d="M74 96 Q84 88 92 84" fill="none" stroke="#C99673" strokeWidth="7" strokeLinecap="round" />
    </svg>
  );
}
