import Database from 'better-sqlite3';
import { join } from 'path';
import fs from 'fs';

const databases = [
  join(process.cwd(), 'database.sqlite'),
  join(process.cwd(), 'server/db/database.db')
];

const tablesToClear = [
  'deliveries',
  'yms_deliveries',
  'address_book',
  'pallet_transactions',
  'audit_logs',
  'logs',
  'documents',
  'yms_slots'
];

console.log('--- DEEP CLEANUP START ---');

for (const dbPath of databases) {
  if (!fs.existsSync(dbPath)) {
    console.log(`[CLEANUP] Overslaan: ${dbPath} bestaat niet.`);
    continue;
  }

  console.log(`[CLEANUP] Opschonen van: ${dbPath}`);
  const db = new Database(dbPath);

  try {
    db.transaction(() => {
      for (const table of tablesToClear) {
        try {
          db.prepare(`DELETE FROM ${table}`).run();
          console.log(`  - Tabel '${table}' leeggemaakt.`);
        } catch (e) {
          console.log(`  - Tabel '${table}' overgeslagen (${e.message})`);
        }
      }

      // Initialize default settings if cleared or missing
      const defaultSettings = {
        featureFlags: { enableFinance: true },
        role_permissions: {
          'admin': ['LOGISTICS_DELIVERY_CRUD', 'YMS_STATUS_UPDATE', 'YMS_PRIORITY_OVERRIDE', 'YMS_DOCK_MANAGE', 'FINANCE_LEDGER_VIEW', 'FINANCE_SETTLE_TRANSACTION', 'ADDR_BOOK_CRUD', 'SYSTEM_SETTINGS_EDIT', 'SYSTEM_USER_MANAGE'],
          'manager': ['LOGISTICS_DELIVERY_CRUD', 'YMS_STATUS_UPDATE', 'YMS_DOCK_MANAGE', 'FINANCE_LEDGER_VIEW', 'ADDR_BOOK_CRUD'],
          'staff': ['LOGISTICS_DELIVERY_CRUD', 'YMS_STATUS_UPDATE'],
          'lead_operator': ['YMS_STATUS_UPDATE', 'YMS_PRIORITY_OVERRIDE'],
          'operator': ['YMS_STATUS_UPDATE'],
          'gate_guard': ['YMS_STATUS_UPDATE', 'YMS_PRIORITY_OVERRIDE'],
          'finance_auditor': ['FINANCE_LEDGER_VIEW', 'FINANCE_SETTLE_TRANSACTION'],
          'viewer': []
        }
      };

      try {
        db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('settings', ?)").run(JSON.stringify(defaultSettings));
        console.log(`  - Standaardinstellingen hersteld.`);
      } catch (e) {
        console.log(`  - Kon instellingen niet herstellen: ${e.message}`);
      }
    })();
    db.close();
  } catch (error) {
    console.error(`[CLEANUP] FOUT bij ${dbPath}:`, error);
  }
}

console.log('--- DEEP CLEANUP VOLTOOID ---');
