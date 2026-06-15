import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import common from './locales/es-CO/common.json'
import animals from './locales/es-CO/animals.json'
import repro from './locales/es-CO/repro.json'
import milk from './locales/es-CO/milk.json'
import health from './locales/es-CO/health.json'

i18n.use(initReactI18next).init({
  resources: {
    'es-CO': { common, animals, repro, milk, health },
  },
  lng: 'es-CO',
  fallbackLng: 'es-CO',
  defaultNS: 'common',
  interpolation: { escapeValue: false },
})

export default i18n
