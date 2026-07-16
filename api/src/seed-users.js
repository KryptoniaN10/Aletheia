import Database from 'better-sqlite3';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, '../../aletheia.db'));

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

// Ensure table exists
db.exec(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('investor','exporter','admin')),
  full_name TEXT,
  company_name TEXT,
  wallet_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`);

const users = [
  {
    username: 'rajesh', email: 'rajesh@aletheia.io', password: 'demo1234',
    role: 'investor', full_name: 'Rajesh Kumar Menon', company_name: null,
    wallet_address: 'GDEMO3INVESTOR1DIASPORA1NRI1DUBAI111111111111111111111111'
  },
  {
    username: 'priya', email: 'priya@aletheia.io', password: 'demo1234',
    role: 'investor', full_name: 'Priya Nair', company_name: null,
    wallet_address: 'GDEMO4INVESTOR2LOCAL1CALICUT1ANGEL1111111111111111111111'
  },
  {
    username: 'malabar_spice', email: 'exports@malabarspice.in', password: 'demo1234',
    role: 'exporter', full_name: null, company_name: 'Malabar Spice Exports Pvt Ltd',
    wallet_address: 'GDEMO1EXPORTER1KERALA1SPICES1KOZHIKODE1111111111111111111'
  },
  {
    username: 'kerala_seafood', email: 'info@keralafish.coop', password: 'demo1234',
    role: 'exporter', full_name: null, company_name: 'Kerala Seafood Cooperative',
    wallet_address: 'GDEMO2EXPORTER2KERALA2SEAFOOD2THRISSUR2222222222222222222'
  }
];

const insert = db.prepare(
  'INSERT OR IGNORE INTO users (username, email, password_hash, role, full_name, company_name, wallet_address) VALUES (?, ?, ?, ?, ?, ?, ?)'
);

for (const u of users) {
  const result = insert.run(
    u.username, u.email, hashPassword(u.password),
    u.role, u.full_name, u.company_name, u.wallet_address
  );
  if (result.changes > 0) {
    console.log(`✓ Seeded: ${u.username} (${u.role})`);
  } else {
    console.log(`⏭  Already exists: ${u.username}`);
  }
}

console.log('\nAll demo accounts ready. Password for all: demo1234');
console.log('Admin login: admin / admin (works from any portal tab)');
