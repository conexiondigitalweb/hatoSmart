import Dexie from 'dexie'

export const db = new Dexie('hatosmart')

db.version(1).stores({
  accounts: 'id, email',
  farms: 'id, account_id, name, deleted_at',
  animals: 'id, account_id, farm_id, tag, category, deleted_at',
  milk_records: 'id, account_id, farm_id, animal_id, date, session, deleted_at',
  weight_records: 'id, account_id, farm_id, animal_id, date, deleted_at',
  repro_events: 'id, account_id, farm_id, animal_id, event_type, event_date, deleted_at',
  health_events: 'id, account_id, farm_id, animal_id, event_type, date, deleted_at',
  sync_queue: '++local_id, table_name, record_id, operation, created_at',
})

export default db
