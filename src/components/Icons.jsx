import React from 'react';

export function Icon({ name, className = 'w-7 h-7', label }) {
  const a11yProps = label
    ? { role: 'img', 'aria-label': label }
    : { 'aria-hidden': 'true', focusable: 'false' };

  const baseProps = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '2.1',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className: `shrink-0 ${className}`,
    ...a11yProps,
  };

  switch (name) {
    case 'emergency':
      return (
        <svg {...baseProps}>
          <rect x="3" y="3" width="18" height="18" rx="4" />
          <path d="M12 7v10M7 12h10" strokeWidth="2.8" />
        </svg>
      );
    case 'heartHands':
      return (
        <svg {...baseProps}>
          <path d="M12 18.5s-6.5-4.1-6.5-8.6A3.7 3.7 0 0 1 12 7.3a3.7 3.7 0 0 1 6.5 2.6c0 4.5-6.5 8.6-6.5 8.6z" />
          <path d="M3.5 14.5c1.5 3.6 4.7 6 8.5 6.8 3.8-.8 7-3.2 8.5-6.8" />
        </svg>
      );
    case 'pin':
      return (
        <svg {...baseProps}>
          <path d="M20 10c0 5.5-8 11.5-8 11.5S4 15.5 4 10a8 8 0 1 1 16 0z" />
          <circle cx="12" cy="10" r="2.8" />
        </svg>
      );
    case 'search':
      return (
        <svg {...baseProps}>
          <circle cx="11" cy="11" r="7.5" />
          <line x1="20.5" y1="20.5" x2="16.3" y2="16.3" strokeWidth="2.4" />
        </svg>
      );
    case 'flag':
      return (
        <svg {...baseProps}>
          <path d="M5 3v18" />
          <path d="M5 4h12l-2.5 4L17 12H5" />
        </svg>
      );
    case 'building':
      return (
        <svg {...baseProps}>
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M9 21v-4h6v4" />
          <path d="M8 7h2M14 7h2M8 11h2M14 11h2M12 5.5v3M10.5 7h3" />
        </svg>
      );
    case 'door':
      return (
        <svg {...baseProps}>
          <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
          <line x1="3" y1="21" x2="21" y2="21" />
          <circle cx="15" cy="12" r="1" fill="currentColor" />
        </svg>
      );
    case 'globe':
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="12" r="9.5" />
          <line x1="2.8" y1="12" x2="21.2" y2="12" />
          <path d="M12 2.5a14.5 14.5 0 0 1 0 19 14.5 14.5 0 0 1 0-19" />
        </svg>
      );
    case 'textSize':
      return (
        <svg {...baseProps}>
          <polyline points="4 7 4 4 16 4 16 7" />
          <line x1="10" y1="4" x2="10" y2="20" />
          <line x1="7" y1="20" x2="13" y2="20" />
          <path d="M15 12h6M18 12v8" />
        </svg>
      );
    case 'contrast':
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="12" r="9.5" />
          <path d="M12 2.5v19a9.5 9.5 0 0 0 0-19z" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'person':
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="7.5" r="4" />
          <path d="M5 20.5a7 7 0 0 1 14 0" />
        </svg>
      );
    case 'ticket':
      return (
        <svg {...baseProps}>
          <path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1.5a2 2 0 0 0 0 3V15a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1.5a2 2 0 0 0 0-3V9z" />
          <line x1="9" y1="7" x2="9" y2="17" strokeDasharray="2 2" />
        </svg>
      );
    case 'urgent':
      return (
        <svg {...baseProps}>
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" strokeWidth="2.5" />
          <circle cx="12" cy="17" r="0.8" fill="currentColor" />
        </svg>
      );
    case 'register':
      return (
        <svg {...baseProps}>
          <path d="M9 4h6a2 2 0 0 1 2 2v14l-5-2.5L7 20V6a2 2 0 0 1 2-2z" />
          <path d="M12 8v5M9.5 10.5h5" />
        </svg>
      );
    case 'slip':
      return (
        <svg {...baseProps}>
          <path d="M6 3h12a1 1 0 0 1 1 1v16l-2.5-1.5L14 20l-2-1.5L10 20l-2.5-1.5L5 20V4a1 1 0 0 1 1-1z" />
          <line x1="9" y1="8" x2="15" y2="8" />
          <line x1="9" y1="12" x2="15" y2="12" />
          <line x1="9" y1="15.5" x2="12.5" y2="15.5" />
        </svg>
      );
    case 'map':
      return (
        <svg {...baseProps}>
          <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
          <line x1="9" y1="3" x2="9" y2="18" />
          <line x1="15" y1="6" x2="15" y2="21" />
        </svg>
      );
    case 'speaker':
      return (
        <svg {...baseProps}>
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      );
    case 'mic':
      return (
        <svg {...baseProps}>
          <rect x="9" y="2" width="6" height="11" rx="3" />
          <path d="M19 10a7 7 0 0 1-14 0" />
          <line x1="12" y1="17" x2="12" y2="22" />
          <line x1="8" y1="22" x2="16" y2="22" />
        </svg>
      );
    case 'settings':
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="12" r="3.2" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.08a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.08a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
    case 'home':
      return (
        <svg {...baseProps}>
          <path d="M3 10.5L12 3l9 7.5" />
          <path d="M5 9.5V20h14V9.5" />
          <path d="M10 20v-6h4v6" />
        </svg>
      );
    case 'back':
      return (
        <svg {...baseProps}>
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
      );
    case 'next':
      return (
        <svg {...baseProps}>
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      );
    case 'phone':
      return (
        <svg {...baseProps}>
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.58 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      );
    case 'ambulance':
      return (
        <svg {...baseProps}>
          <path d="M3 7h11v10H3z" />
          <path d="M14 10h4l3 3v4h-7z" />
          <circle cx="7.5" cy="18" r="2" />
          <circle cx="17.5" cy="18" r="2" />
          <path d="M8.5 9.5v4M6.5 11.5h4" />
        </svg>
      );
    case 'med':
      return (
        <svg {...baseProps}>
          <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
          <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
          <circle cx="20" cy="10" r="2" />
        </svg>
      );
    case 'children':
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="8" r="4.5" />
          <path d="M9.5 7.5h.01M14.5 7.5h.01" strokeWidth="2.8" />
          <path d="M10 10a2.5 2.5 0 0 0 4 0" />
          <path d="M6 21v-2a6 6 0 0 1 12 0v2" />
        </svg>
      );
    case 'women':
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="6.5" r="3.5" />
          <path d="M7.5 21l1.5-6h6l1.5 6" />
          <path d="M9 15l-1.5-3.5a3.5 3.5 0 0 1 7 0L13 15" />
        </svg>
      );
    case 'bones':
      return (
        <svg {...baseProps}>
          <path d="M17 4a2.5 2.5 0 0 1 3 3 2.5 2.5 0 0 1-1 4.5l-7.5 7.5A2.5 2.5 0 0 1 7 20a2.5 2.5 0 0 1-3-3 2.5 2.5 0 0 1 1-4.5l7.5-7.5A2.5 2.5 0 0 1 17 4z" />
        </svg>
      );
    case 'ent':
      return (
        <svg {...baseProps}>
          <path d="M6 9.5a6 6 0 1 1 10.8 3.6c-.9 1.2-1.8 2.4-2.1 3.9a3 3 0 0 1-5.7.5" />
          <path d="M10 9.5a2.5 2.5 0 0 1 4.5 1.5c-.4.7-1.2 1.2-1.5 2" />
        </svg>
      );
    case 'eyes':
      return (
        <svg {...baseProps}>
          <path d="M2 12s3.8-7 10-7 10 7 10 7-3.8 7-10 7-10-7-10-7z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case 'skin':
      return (
        <svg {...baseProps}>
          <path d="M18 11V6a1.5 1.5 0 0 0-3 0v4" />
          <path d="M15 10V4.5a1.5 1.5 0 0 0-3 0V10" />
          <path d="M12 10V5.5a1.5 1.5 0 0 0-3 0V12" />
          <path d="M9 11a1.5 1.5 0 0 0-3 0v4a6 6 0 0 0 12 0v-4" />
        </svg>
      );
    case 'lift':
      return (
        <svg {...baseProps}>
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <line x1="12" y1="3" x2="12" y2="21" />
          <polyline points="7.5 9 9.5 7 11.5 9" />
          <polyline points="12.5 15 14.5 17 16.5 15" />
        </svg>
      );
    case 'stairs':
      return (
        <svg {...baseProps}>
          <polyline points="4 19 9 19 9 14 14 14 14 9 19 9 19 5" />
        </svg>
      );
    case 'ramp':
      return (
        <svg {...baseProps}>
          <polygon points="3 19 21 19 21 9" />
          <line x1="3" y1="15" x2="19" y2="6" />
        </svg>
      );
    case 'wheelchair':
      return (
        <svg {...baseProps}>
          <circle cx="10" cy="5" r="2" />
          <path d="M10 8v6h6l2 5" />
          <path d="M13 11h3" />
          <path d="M13.5 17.5a4.5 4.5 0 1 1-5-6" />
        </svg>
      );
    case 'water':
      return (
        <svg {...baseProps}>
          <path d="M12 2.5c0 0-6.5 7-6.5 11.5a6.5 6.5 0 0 0 13 0C18.5 9.5 12 2.5 12 2.5z" />
        </svg>
      );
    case 'toilet':
      return (
        <svg {...baseProps}>
          <circle cx="8" cy="5.5" r="2" />
          <path d="M6 10h4v5H9v5H7v-5H6z" />
          <circle cx="16.5" cy="5.5" r="2" />
          <path d="M14 10h5l1 6h-2v4h-3v-4h-2z" />
        </svg>
      );
    case 'pharmacy':
      return (
        <svg {...baseProps}>
          <rect x="4" y="6" width="16" height="14" rx="2" />
          <path d="M9 6V4h6v2" />
          <path d="M12 10v6M9 13h6" />
        </svg>
      );
    case 'lab':
      return (
        <svg {...baseProps}>
          <path d="M9 3h6" />
          <path d="M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3" />
          <line x1="7.5" y1="15" x2="16.5" y2="15" />
        </svg>
      );
    case 'xray':
      return (
        <svg {...baseProps}>
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <line x1="12" y1="6" x2="12" y2="18" />
          <path d="M8 8.5h8M7.5 11.5h9M8.5 14.5h7" />
        </svg>
      );
    case 'help':
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="12" r="9.5" />
          <path d="M9.5 9a2.5 2.5 0 0 1 4.8.8c0 1.7-2.3 2.2-2.3 3.7" />
          <circle cx="12" cy="17.2" r="0.8" fill="currentColor" />
        </svg>
      );
    case 'gate':
      return (
        <svg {...baseProps}>
          <path d="M3 20V8l9-5 9 5v12" />
          <path d="M9 20v-7h6v7" />
          <path d="M12 6.5v3M10.5 8h3" />
        </svg>
      );
    case 'seats':
      return (
        <svg {...baseProps}>
          <path d="M5 10v5h14v-5" />
          <path d="M7 6h4v4H7zM13 6h4v4h-4z" />
          <line x1="6" y1="15" x2="6" y2="19" />
          <line x1="18" y1="15" x2="18" y2="19" />
        </svg>
      );
    case 'ward':
      return (
        <svg {...baseProps}>
          <path d="M3 7v11M21 11v7M3 14h18" />
          <path d="M6 14v-3a2 2 0 0 1 2-2h3v5" />
          <path d="M11 10h8a2 2 0 0 1 2 2v2" />
        </svg>
      );
    case 'nurse':
      return (
        <svg {...baseProps}>
          <path d="M5 9l2-5h10l2 5H5z" />
          <circle cx="12" cy="13.5" r="4" />
          <path d="M6 21a6 6 0 0 1 12 0" />
          <path d="M12 5.2v2.4M10.8 6.4h2.4" strokeWidth="1.8" />
        </svg>
      );
    case 'qr':
      return (
        <svg {...baseProps}>
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <path d="M14 14h3v3h-3zM18 18h3v3h-3zM18 14h3M14 18v3" />
        </svg>
      );
    case 'camera':
      return (
        <svg {...baseProps}>
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      );
    case 'print':
      return (
        <svg {...baseProps}>
          <polyline points="6 9 6 2 18 2 18 9" />
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <rect x="6" y="14" width="12" height="8" />
        </svg>
      );
    case 'download':
      return (
        <svg {...baseProps}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      );
    case 'expand':
      return (
        <svg {...baseProps}>
          <polyline points="15 3 21 3 21 9" />
          <polyline points="9 21 3 21 3 15" />
          <line x1="21" y1="3" x2="14" y2="10" />
          <line x1="3" y1="21" x2="10" y2="14" />
        </svg>
      );
    case 'lost':
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="12" r="9.5" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      );
    case 'check':
      return (
        <svg {...baseProps}>
          <polyline points="20 6 9 17 4 12" strokeWidth="2.6" />
        </svg>
      );
    case 'close':
      return (
        <svg {...baseProps}>
          <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2.5" />
          <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2.5" />
        </svg>
      );
    case 'clock':
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="12" r="9.5" />
          <polyline points="12 6.5 12 12 15.8 14.2" />
        </svg>
      );
    case 'bolt':
      return (
        <svg {...baseProps}>
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );
    case 'refresh':
      return (
        <svg {...baseProps}>
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
      );
    case 'users':
      return (
        <svg {...baseProps}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    default:
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="3" fill="currentColor" />
        </svg>
      );
  }
}
