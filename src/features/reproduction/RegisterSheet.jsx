import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import Card from '../../components/ui/Card'

const options = [
  { key: 'milk', emoji: '🥛' },
  { key: 'weight', emoji: '⚖️' },
  { key: 'repro', emoji: '🐄' },
  { key: 'health', emoji: '💉' },
]

export default function RegisterSheet() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="fixed inset-0 z-[100]" onClick={() => navigate(-1)}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="absolute bottom-0 left-0 right-0 bg-[#f5f5f5] rounded-t-3xl p-6"
        style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-5" />
        <h2 className="text-lg font-bold text-[#2b3240] mb-4">{t('register.title')}</h2>
        <div className="grid grid-cols-2 gap-3">
          {options.map(({ key, emoji }) => (
            <Card
              key={key}
              className="flex flex-col gap-2 p-5 min-h-[110px]"
              onClick={() => navigate(`/registrar/${key}`)}
            >
              <span className="text-3xl">{emoji}</span>
              <p className="font-semibold text-[#2b3240] text-sm">{t(`register.${key}`)}</p>
              <p className="text-xs text-gray-400">{t(`register.${key}_desc`)}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
