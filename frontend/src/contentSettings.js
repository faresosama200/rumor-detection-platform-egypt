import { useState, useCallback } from 'react';

const DEFAULT = {
  platform: { brandName: 'منصة مكافحة الشائعات', tagline: 'حروب الجيل الرابع - مصر' },
  categories: [
    { id: 'all', name: 'الكل', icon: '📋' },
    { id: 'health', name: 'الصحة', icon: '🏥' },
    { id: 'politics', name: 'السياسة', icon: '🏛️' },
    { id: 'security', name: 'الأمن', icon: '🛡️' },
  ],
  externalLinks: [
    { name: 'وزارة الصحة', url: 'https://www.mohp.gov.eg', icon: '🏥', category: 'صحة' },
    { name: 'وزارة الداخلية', url: 'https://www.moiegypt.gov.eg', icon: '🏛️', category: 'أمن' },
    { name: 'وكالة أنباء الشرق الأوسط', url: 'https://www.mena.org.eg', icon: '📰', category: 'إعلام' },
  ],
};

export function useContentSettings() {
  const [settings, setSettings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('contentSettings')) || DEFAULT; }
    catch { return DEFAULT; }
  });

  const updateSettings = useCallback(next => {
    localStorage.setItem('contentSettings', JSON.stringify(next));
    setSettings(next);
    return next;
  }, []);

  const restoreDefaults = useCallback(() => {
    localStorage.setItem('contentSettings', JSON.stringify(DEFAULT));
    setSettings(DEFAULT);
    return DEFAULT;
  }, []);

  return { settings, updateSettings, restoreDefaults, defaultSettings: DEFAULT };
}
