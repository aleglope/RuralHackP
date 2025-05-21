import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import gl from './locales/gl.json';
import es from './locales/es.json';
import en from './locales/en.json';

i18n
  .use(initReactI18next)
  .use(LanguageDetector)
  .init({
    resources: {
      gl: { translation: gl },
      es: { translation: es },
      en: { translation: en }
    },
    fallbackLng: 'gl',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;