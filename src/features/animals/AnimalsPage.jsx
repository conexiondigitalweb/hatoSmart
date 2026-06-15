import { useTranslation } from 'react-i18next'
import EmptyState from '../../components/ui/EmptyState'
import Button from '../../components/ui/Button'

export default function AnimalsPage() {
  const { t } = useTranslation('animals')

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#2b3240]">{t('title')}</h1>
        <Button className="px-3 text-xs">{t('add')}</Button>
      </div>
      <EmptyState
        icon="🐄"
        title={t('empty.title')}
        description={t('empty.description')}
        action={t('add')}
        onAction={() => {}}
      />
    </div>
  )
}
