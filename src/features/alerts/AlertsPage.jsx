import { useTranslation } from 'react-i18next'
import EmptyState from '../../components/ui/EmptyState'

export default function AlertsPage() {
  const { t } = useTranslation()

  return (
    <div className="p-4 flex flex-col gap-4">
      <h1 className="text-xl font-bold text-[#2b3240]">{t('modules.alerts')}</h1>
      <EmptyState
        icon="🔔"
        title="Sin alertas activas"
        description="Las alertas de celo, partos próximos y secados aparecerán aquí."
      />
    </div>
  )
}
