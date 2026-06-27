import Dexie from 'dexie'

export const db = new Dexie('hatosmart')

// Version 2: mirrors Supabase schema, adds sync_status and last_synced_at to every table
db.version(2).stores({
  // Core
  accounts:    'id, owner_user_id, sync_status',
  profiles:    'id, sync_status',

  // Farm
  farms:       'id, account_id, deleted_at, sync_status',
  memberships: 'id, account_id, farm_id, user_id, sync_status',

  // Animals
  animals:     'id, account_id, farm_id, status, category, repro_status, deleted_at, sync_status',

  // Reproduction
  repro_events: 'id, account_id, farm_id, animal_id, type, date, deleted_at, sync_status',

  // Milk
  milk_records:     'id, account_id, farm_id, date, session, deleted_at, sync_status',
  milk_individual:  'id, account_id, farm_id, animal_id, date, session, deleted_at, sync_status',

  // Weights
  weighings: 'id, account_id, farm_id, animal_id, date, deleted_at, sync_status',

  // Health
  health_events:        'id, account_id, farm_id, animal_id, date, deleted_at, sync_status',
  health_event_animals: '[health_event_id+animal_id], health_event_id, animal_id',

  // Alerts
  alerts: 'id, account_id, farm_id, animal_id, type, status, due_date, sync_status',

  // Sync infrastructure
  sync_queue: '++local_id, table_name, record_id, operation, created_at',
})

export default db
