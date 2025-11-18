import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'app.db');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

export const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  -- Users
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    cpf TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('Tutor','Veterinário')) DEFAULT 'Tutor',
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT,
    passwordHash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin','user')) DEFAULT 'user',
    crmv TEXT,
    clinicAddress TEXT,
    professionalIdDocPath TEXT,
    diplomaDocPath TEXT,
    createdAt TEXT NOT NULL DEFAULT (DATETIME('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_users_cpf ON users(cpf);
  
  -- Pets
  CREATE TABLE IF NOT EXISTS pets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ownerId INTEGER NOT NULL,
    name TEXT NOT NULL,
    species TEXT NOT NULL CHECK (species IN ('Cachorro','Cavalo','Gato','Outros')),
    breed TEXT,
    sex TEXT CHECK (sex IN ('Macho','Fêmea','Irrelevante')),
    age INTEGER,
    weight REAL,
    height REAL,
    notes TEXT,
    photoPath TEXT,
    createdAt TEXT NOT NULL DEFAULT (DATETIME('now')),
    FOREIGN KEY(ownerId) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_pets_owner ON pets(ownerId);
  CREATE INDEX IF NOT EXISTS idx_pets_created ON pets(createdAt DESC);

  -- Agenda
  CREATE TABLE IF NOT EXISTS agenda (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    petId INTEGER NOT NULL,
    procedimento TEXT NOT NULL CHECK (procedimento IN ('Banho/Tosa','Vacina','Vermifugo','Antipulgas','Consulta','Outros')),
    data TEXT NOT NULL,
    horario TEXT NOT NULL,
    profissional TEXT,
    observacoes TEXT,
    createdAt TEXT NOT NULL DEFAULT (DATETIME('now')),
    FOREIGN KEY(petId) REFERENCES pets(id) ON DELETE CASCADE
  );

  -- Registros de Saúde
  CREATE TABLE IF NOT EXISTS registros_saude (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    petId INTEGER NOT NULL,
    userId INTEGER NOT NULL, -- Quem criou o registro (Tutor ou Veterinário)
    tipoRegistro TEXT NOT NULL CHECK (tipoRegistro IN ('Vacina', 'Cirurgia', 'Exame', 'Observação')),
    data TEXT NOT NULL,
    horario TEXT NOT NULL,
    profissional TEXT NOT NULL, -- Obrigatório pelo RFS13
    filePath TEXT, -- Caminho do arquivo (PDF/PNG/JPG), pode ser NULL
    createdAt TEXT NOT NULL DEFAULT (DATETIME('now')),
    
    FOREIGN KEY(petId) REFERENCES pets(id) ON DELETE CASCADE,
    FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_registros_pet ON registros_saude(petId);
  CREATE INDEX IF NOT EXISTS idx_registros_data ON registros_saude(data DESC, horario DESC);

  -- Despesas Financeiras
  CREATE TABLE IF NOT EXISTS despesas_financeiras (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    petId INTEGER NOT NULL,
    categoria TEXT NOT NULL CHECK (categoria IN ('Alimentação','Saúde','Higiene','Acessórios','Hospedagem','Transporte','Outros')),
    descricao TEXT NOT NULL,
    valor REAL NOT NULL CHECK (valor > 0),
    data TEXT NOT NULL,
    observacoes TEXT,
    createdAt TEXT NOT NULL DEFAULT (DATETIME('now')),
    FOREIGN KEY(petId) REFERENCES pets(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_despesas_pet ON despesas_financeiras(petId);
  CREATE INDEX IF NOT EXISTS idx_despesas_data ON despesas_financeiras(data DESC);
  CREATE INDEX IF NOT EXISTS idx_despesas_categoria ON despesas_financeiras(categoria);
`);