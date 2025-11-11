import { createClient } from '@supabase/supabase-js'

// Supabase credentials from supabaseClient.ts
const supabaseUrl = 'https://phfzqvmofnqwxszdgjch.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoZnpxdm1vZm5xd3hzemRnamNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2ODE1MzIsImV4cCI6MjA3NzI1NzUzMn0.bWL2t6XGQJ5OmNxAB8mLjAzY5uF1fVzheMNksVJ2Dkk'

const supabase = createClient(supabaseUrl, supabaseKey)

async function fetchTable(table, filters) {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .or(filters)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error(`[ERROR] ${table}:`, error.message)
    return []
  }
  return data || []
}

async function main() {
  console.log('Checking records for identifier "testeSprite"...')

  const appointments = await fetchTable('appointments', 'owner_name.ilike.%testeSprite%,pet_name.ilike.%testeSprite%')
  const petMovel = await fetchTable('pet_movel_appointments', 'owner_name.ilike.%testeSprite%,pet_name.ilike.%testeSprite%')
  const hotel = await fetchTable('hotel_registrations', 'tutor_name.ilike.%testeSprite%,pet_name.ilike.%testeSprite%')
  const daycare = await fetchTable('daycare_enrollments', 'tutor_name.ilike.%testeSprite%,pet_name.ilike.%testeSprite%')

  const summarize = (rows, fields) => rows.map(r => fields.map(f => `${f}: ${r[f]}`).join(' | '))

  console.log('\nAppointments (appointments):')
  console.log(appointments.length ? summarize(appointments, ['id', 'owner_name', 'pet_name', 'service', 'status']).join('\n') : 'No records found')

  console.log('\nPet Móvel (pet_movel_appointments):')
  console.log(petMovel.length ? summarize(petMovel, ['id', 'owner_name', 'pet_name', 'service', 'status']).join('\n') : 'No records found')

  console.log('\nHotel Pet (hotel_registrations):')
  console.log(hotel.length ? summarize(hotel, ['id', 'tutor_name', 'pet_name', 'check_in_date', 'check_out_date']).join('\n') : 'No records found')

  console.log('\nCreche Pet (daycare_enrollments):')
  console.log(daycare.length ? summarize(daycare, ['id', 'tutor_name', 'pet_name', 'contracted_plan', 'status']).join('\n') : 'No records found')
}

main().catch(err => {
  console.error('Unexpected error:', err)
  process.exit(1)
})