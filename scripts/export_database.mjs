import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://xilavhopbmjhsovvybza.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpbGF2aG9wYm1qaHNvdnZ5YnphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDE0MDYxOCwiZXhwIjoyMDg5NzE2NjE4fQ.bWbPrMN8FNAHUNV5WKApBa-B5_x1FOJzUy1hOWINU74';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const tables = [
  'adoption_pets',
  'agendamento_banhotosa',
  'appointments',
  'clients',
  'controle_bloqueio_chat',
  'daycare_diary_entries',
  'daycare_enrollments',
  'disabled_dates',
  'feedbacks',
  'feriados',
  'financeiro_gastos',
  'fiscal_notes',
  'hotel_registrations',
  'monthly_clients',
  'notifications',
  'pet_album_photos',
  'pet_movel_appointments',
  'pets',
  'service_prices'
];

async function fetchAllRows(tableName) {
  let allRows = [];
  let page = 0;
  const pageSize = 1000;
  
  while (true) {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .range(from, to);
      
    if (error) {
      console.error(`Erro ao buscar ${tableName}:`, error.message);
      throw error;
    }
    
    if (!data || data.length === 0) break;
    allRows = allRows.concat(data);
    if (data.length < pageSize) break;
    page++;
  }
  return allRows;
}

export async function exportDatabase() {
  console.log('Iniciando exportação completa do banco de dados...');
  const exportData = {
    metadata: {
      exported_at: new Date().toISOString(),
      database_url: SUPABASE_URL,
      tables_count: tables.length,
      counts: {}
    },
    tables: {},
    auth_users: [],
    storage_buckets: []
  };

  let totalRecords = 0;

  for (const table of tables) {
    process.stdout.write(`Exportando ${table}... `);
    const rows = await fetchAllRows(table);
    exportData.tables[table] = rows;
    exportData.metadata.counts[table] = rows.length;
    totalRecords += rows.length;
    console.log(`${rows.length} registros`);
  }

  // Usuários de Autenticação
  try {
    const { data: usersData, error: usersErr } = await supabase.auth.admin.listUsers();
    if (!usersErr && usersData?.users) {
      exportData.auth_users = usersData.users.map(u => ({
        id: u.id,
        email: u.email,
        phone: u.phone,
        role: u.role,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        app_metadata: u.app_metadata,
        user_metadata: u.user_metadata
      }));
      exportData.metadata.counts['auth_users'] = exportData.auth_users.length;
      console.log(`Usuários Auth: ${exportData.auth_users.length} usuários`);
    }
  } catch (e) {
    console.error('Erro ao buscar auth_users:', e.message);
  }

  // Buckets de Storage
  try {
    const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
    if (!bErr && buckets) {
      exportData.storage_buckets = buckets;
      console.log(`Storage buckets: ${buckets.length} buckets`);
    }
  } catch (e) {
    console.error('Erro ao buscar buckets:', e.message);
  }

  exportData.metadata.total_records = totalRecords;

  const outputPath = path.resolve(__dirname, '../database_backup_full.json');
  fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2), 'utf-8');
  const stats = fs.statSync(outputPath);
  console.log(`Exportação salva com sucesso em: ${outputPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  exportDatabase();
}
