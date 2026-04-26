import { useEffect, useState } from 'react';
import { articlesData, categories as baseCategories } from './ArticlesData';

const STORAGE_KEY = 'rumor-shield-content-settings';
const SETTINGS_EVENT = 'rumor-shield-content-settings-updated';

const defaultCategories = [
  ...baseCategories,
  { id: 'توعية', name: 'التوعية', icon: '🛡️' },
];

const defaultExternalLinks = [
  {
    name: 'الموقع الرسمي لوزارة الداخلية المصرية',
    url: 'https://www.moig.gov.eg',
    description: 'البوابة الرسمية لوزارة الداخلية في جمهورية مصر العربية.',
    icon: '🏛️',
    category: 'حكومي مصري',
  },
  {
    name: 'الصفحة الرسمية لوزارة الداخلية المصرية على فيسبوك',
    url: 'https://www.facebook.com/moiegy',
    description: 'الصفحة الرسمية للأخبار والتنويهات الصادرة عن وزارة الداخلية المصرية.',
    icon: '📘',
    category: 'حكومي مصري',
  },
  {
    name: 'وزارة الصحة والسكان المصرية',
    url: 'https://www.mohp.gov.eg',
    description: 'الموقع الرسمي لوزارة الصحة والسكان في مصر - للتحقق من المعلومات الصحية.',
    icon: '⚕️',
    category: 'صحة مصرية',
  },
  {
    name: 'منظمة الصحة العالمية (WHO)',
    url: 'https://www.who.int/ar',
    description: 'الموقع الرسمي لمنظمة الصحة العالمية باللغة العربية - للمعلومات الصحية الدولية.',
    icon: '🌍',
    category: 'صحة عالمية',
  },
  {
    name: 'جريدة الوطن المصرية',
    url: 'https://www.elwatannews.com',
    description: 'الموقع الرسمي لجريدة الوطن المصرية - وسيلة إعلام رسمية موثوقة.',
    icon: '📰',
    category: 'إعلام مصري',
  },
  {
    name: 'وكالة الأنباء الرسمية المصرية (MENA)',
    url: 'https://www.mena.org.eg',
    description: 'الوكالة الرسمية للأنباء المصرية - مصدر موثوق للأخبار الرسمية.',
    icon: '📡',
    category: 'إعلام مصري',
  },
  {
    name: 'الصفحة الرسمية للمتحدث العسكري المصري',
    url: 'https://www.facebook.com/EgyArmySpox',
    description: 'منصة رسمية لنشر البيانات والتحديثات الصادرة عن المتحدث العسكري المصري.',
    icon: '🎙️',
    category: 'بيانات رسمية مصرية',
  },
  {
    name: 'البوابة الرسمية للحكومة المصرية',
    url: 'https://www.egypt.gov.eg',
    description: 'البوابة الإلكترونية الرسمية للحكومة المصرية - للتحقق من المعلومات الحكومية.',
    icon: '🇪🇬',
    category: 'حكومي مصري',
  },
  {
    name: 'شبكة الأنباء الإسلامية - INA',
    url: 'https://www.ina.ps',
    description: 'وكالة أنباء عربية موثوقة للمعلومات الإقليمية.',
    icon: '📰',
    category: 'إعلام عربي',
  },
  {
    name: 'منظمة العفو الدولية',
    url: 'https://www.amnesty.org/ar',
    description: 'منظمة دولية متخصصة في حقوق الإنسان والتحقق من المعلومات.',
    icon: '🤝',
    category: 'منظمات دولية',
  },
];

const defaultPlatform = {
  brandName: 'مواجهة الشائعات وحروب الجيل الباردة',
  heroKicker: 'منصة مصرية لمواجهة الشائعات وحروب الجيل الباردة',
  heroTitle: 'لوحة إحصائية مباشرة + سير عمل تحقق احترافي',
  heroDescription: 'تتبع البلاغات، راجع المصادر، وانشر محتوى توعويا وروابط رسمية موثوقة من خلال لوحة تحكم موحدة.',
};

const DEFAULT_SETTINGS = {
  platform: defaultPlatform,
  categories: defaultCategories,
  externalLinks: defaultExternalLinks,
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeCategory(category, index) {
  return {
    id: String(category?.id || `category-${index + 1}`).trim(),
    name: String(category?.name || category?.id || `فئة ${index + 1}`).trim(),
    icon: String(category?.icon || '📁').trim(),
  };
}

function normalizeLink(link, index) {
  return {
    name: String(link?.name || `رابط ${index + 1}`).trim(),
    url: String(link?.url || 'https://').trim(),
    description: String(link?.description || '').trim(),
    icon: String(link?.icon || '🔗').trim(),
    category: String(link?.category || 'مصدر').trim(),
  };
}

function normalizeSettings(input) {
  const platform = {
    ...defaultPlatform,
    ...(input?.platform || {}),
  };

  const categories = Array.isArray(input?.categories) && input.categories.length > 0
    ? input.categories.map(normalizeCategory)
    : clone(defaultCategories);

  const withAllCategory = categories.some((category) => category.id === 'all')
    ? categories
    : [normalizeCategory({ id: 'all', name: 'الكل', icon: '📚' }, 0), ...categories];

  const externalLinks = Array.isArray(input?.externalLinks) && input.externalLinks.length > 0
    ? input.externalLinks.map(normalizeLink)
    : clone(defaultExternalLinks);

  return {
    platform: {
      brandName: String(platform.brandName || defaultPlatform.brandName).trim(),
      heroKicker: String(platform.heroKicker || defaultPlatform.heroKicker).trim(),
      heroTitle: String(platform.heroTitle || defaultPlatform.heroTitle).trim(),
      heroDescription: String(platform.heroDescription || defaultPlatform.heroDescription).trim(),
    },
    categories: withAllCategory,
    externalLinks,
  };
}

export function getDefaultContentSettings() {
  return normalizeSettings(DEFAULT_SETTINGS);
}

export function getDefaultArticles() {
  return articlesData;
}

export function getContentSettings() {
  if (typeof window === 'undefined') {
    return getDefaultContentSettings();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return getDefaultContentSettings();
  }

  try {
    return normalizeSettings(JSON.parse(raw));
  } catch {
    return getDefaultContentSettings();
  }
}

export function saveContentSettings(nextSettings) {
  const normalized = normalizeSettings(nextSettings);

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    window.dispatchEvent(new Event(SETTINGS_EVENT));
  }

  return normalized;
}

export function resetContentSettings() {
  const defaults = getDefaultContentSettings();

  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event(SETTINGS_EVENT));
  }

  return defaults;
}

export function useContentSettings() {
  const [settings, setSettings] = useState(() => getContentSettings());

  useEffect(() => {
    const syncSettings = () => setSettings(getContentSettings());

    window.addEventListener('storage', syncSettings);
    window.addEventListener(SETTINGS_EVENT, syncSettings);

    return () => {
      window.removeEventListener('storage', syncSettings);
      window.removeEventListener(SETTINGS_EVENT, syncSettings);
    };
  }, []);

  const updateSettings = (nextSettings) => {
    const resolved = typeof nextSettings === 'function'
      ? nextSettings(getContentSettings())
      : nextSettings;
    const saved = saveContentSettings(resolved);
    setSettings(saved);
    return saved;
  };

  return {
    settings,
    updateSettings,
    restoreDefaults: resetContentSettings,
    defaultSettings: getDefaultContentSettings(),
  };
}