import React from 'react';

const iconPaths = {
  menu: 'M4 7h16M4 12h16M4 17h16',
  close: 'M6 6l12 12M18 6L6 18',
  shield: 'M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z',
  crown: 'M3 17h18l-1.5-8-4.5 3-3-5-3 5-4.5-3L3 17z',
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8zm-7 8a7 7 0 0114 0',
  home: 'M3 11l9-7 9 7M6 10v10h12V10',
  education: 'M3 9l9-4 9 4-9 4-9-4zm3 3.5v4.2c0 1.1 2.7 2.3 6 2.3s6-1.2 6-2.3v-4.2',
  rumor: 'M12 4l8 14H4l8-14zm0 5v4m0 3h.01',
  verify: 'M4 11l4 4L20 6',
  chat: 'M5 5h14v10H9l-4 4V5z',
  report: 'M5 4h10l4 4v12H5V4zm10 0v4h4',
  video: 'M4 6h12v12H4zM16 10l4-2v8l-4-2',
  ministry: 'M4 20h16M6 8h12M8 20V8m8 12V8M3 8l9-5 9 5',
  media: 'M4 6h16v10H4zM8 20h8M10 16v4m4-4v4',
  broadcast: 'M12 9a3 3 0 013 3m-6 0a3 3 0 013-3m0-4a7 7 0 017 7m-14 0a7 7 0 017-7',
  globe: 'M12 3a9 9 0 100 18 9 9 0 000-18zm-7.5 9h15M12 3c2.5 2.3 2.5 14.7 0 18M12 3c-2.5 2.3-2.5 14.7 0 18',
  brain: 'M9 5a3 3 0 00-3 3v1a2.5 2.5 0 00-2 2.5A2.5 2.5 0 006 14v1a3 3 0 003 3h1v-5H9m6-8a3 3 0 013 3v1a2.5 2.5 0 012 2.5A2.5 2.5 0 0118 14v1a3 3 0 01-3 3h-1v-5h1',
  phone: 'M8 3h8a2 2 0 012 2v14a2 2 0 01-2 2H8a2 2 0 01-2-2V5a2 2 0 012-2zm4 15h.01',
  search: 'M11 4a7 7 0 105.1 11.8L20 20',
  trusted: 'M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3zm-3.5 8.5l2.2 2.2 4.8-4.8',
  spark: 'M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3z',
  camera: 'M4 8h4l1.2-2h5.6L16 8h4v10H4V8zm8 2.8a3.2 3.2 0 100 6.4 3.2 3.2 0 000-6.4z',
  admin: 'M4 13h16M12 4v16M5.5 5.5l13 13M18.5 5.5l-13 13',
  users: 'M9 12a3 3 0 100-6 3 3 0 000 6zm6 1a2.5 2.5 0 10-1.5-4.5M3 20a6 6 0 0112 0m2.5 0a4.5 4.5 0 00-2.2-3.9',
  articles: 'M5 6h14M5 10h14M5 14h10M5 18h8',
  chevronDown: 'M7 10l5 5 5-5',
  chevronUp: 'M7 14l5-5 5 5',
};

export default function AppIcon({ name, className = '', size = 18, strokeWidth = 1.9 }) {
  const path = iconPaths[name] || iconPaths.shield;
  return (
    <span className={`ui-icon ${className}`.trim()} aria-hidden="true">
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d={path} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
