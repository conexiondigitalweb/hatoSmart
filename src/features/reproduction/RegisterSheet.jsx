import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import Card from '../../components/ui/Card'

const options = [
  { key: 'milk', emoji: '🥛', to: '/ordeño' },
  { key: 'weight', emoji: '⚖️', to: '/registrar/peso' },
  { key: 'repro', emoji: '🐄', to: '/registrar/repro' },
  { key: 'health', emoji: '💉', to: '/registrar/salud' },
]

export default function RegisterSheet() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="fixed inset-0 z-[100]" onClick={() => navigate(-1)}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl p-6 shadow-2xl"
        style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
        <h2 className="text-lg font-bold text-foreground mb-4">{t('register.title')}</h2>
        <div className="grid grid-cols-2 gap-3">
          {options.map(({ key, emoji, to }) => (
            <Card
              key={key}
              className="flex flex-col gap-2 p-5 min-h-[110px] border border-border"
              onClick={() => navigate(to)}
            >
              <span className="text-3xl">{emoji}</span>
              <p className="font-semibold text-foreground text-sm">{t(`register.${key}`)}</p>
              <p className="text-xs text-muted-foreground">{t(`register.${key}_desc`)}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
