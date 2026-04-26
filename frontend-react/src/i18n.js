import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationEN from './locales/en/translation.json';
import translationZH from './locales/zh/translation.json';

const resources = {
  en: {
    translation: translationEN,
  },
  zh: {
    translation: translationZH,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'zh', // 默认兜底使用中文
    interpolation: {
      escapeValue: false, // react 自带 xss 防护
    },
  });

export default i18n;
