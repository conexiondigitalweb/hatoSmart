import { supabase } from '../supabase'
import { getPendingItems, dequeue } from './queue'
import { useSyncStore } from '../../stores/syncStore'

export async function runSync() {
  if (!navigator.onLine) return

  const items = await getPendingItems()
  if (items.length === 0) {
    useSyncStore.getState().setSynced()
    return
  }

  for (const item of items) {
    try {
      const payload = JSON.parse(item.payload)

      if (item.operation === 'upsert') {
        const { error } = await supabase.from(item.table_name).upsert(payload)
        if (error) throw error
      } else if (item.operation === 'delete') {
        const { error } = await supabase
          .from(item.table_name)
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', item.record_id)
        if (error) throw error
      }

      await dequeue(item.local_id)
    } catch {
      useSyncStore.getState().setError()
      return
    }
  }

  useSyncStore.getState().setSynced()
}
