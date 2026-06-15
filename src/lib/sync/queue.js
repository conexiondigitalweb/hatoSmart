import db from '../db'

export async function enqueue(tableName, recordId, operation, payload) {
  await db.sync_queue.add({
    table_name: tableName,
    record_id: recordId,
    operation,
    payload: JSON.stringify(payload),
    created_at: new Date().toISOString(),
  })
}

export async function getPendingCount() {
  return db.sync_queue.count()
}

export async function dequeue(localId) {
  await db.sync_queue.delete(localId)
}

export async function getPendingItems() {
  return db.sync_queue.orderBy('created_at').toArray()
}
