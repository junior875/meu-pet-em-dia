# Guia de Implementação - Meu Pet em Dia

## Índice
1. [Visão Geral do Projeto](#visão-geral-do-projeto)
2. [Requisitos e Pré-requisitos](#requisitos-e-pré-requisitos)
3. [Estrutura do Projeto](#estrutura-do-projeto)
4. [Instalação e Configuração](#instalação-e-configuração)
5. [Execução em Ambiente de Desenvolvimento](#execução-em-ambiente-de-desenvolvimento)
6. [Banco de Dados e Migrações](#banco-de-dados-e-migrações)
7. [Autenticação e Autorização](#autenticação-e-autorização)
8. [Gestão de Usuários](#gestão-de-usuários)
9. [Gestão de Pets](#gestão-de-pets)
10. [Agenda de Consultas e Procedimentos](#agenda-de-consultas-e-procedimentos)
11. [Registros de Saúde](#registros-de-saúde)
12. [Upload de Arquivos](#upload-de-arquivos)
13. [Testes End-to-End com Selenium](#testes-end-to-end-com-selenium)
14. [Docker e Ambientes Isolados](#docker-e-ambientes-isolados)
15. [Deploy e Produção](#deploy-e-produção)
16. [Troubleshooting](#troubleshooting)

---

## Visão Geral do Projeto

**Meu Pet em Dia** é uma aplicação web full-stack para gestão de pets, consultas veterinárias e administração de usuários. O sistema possui três perfis de usuário:

- **Tutor**: Cadastra e gerencia seus pets, consultas e histórico de saúde.
- **Veterinário**: Acessa informações de pacientes e gerencia atendimentos (funcionalidade em desenvolvimento).
- **Administrador**: Possui controle total sobre usuários do sistema (CRUD completo).

### Tecnologias Utilizadas

**Backend:**
- Node.js 18+ com TypeScript
- Express.js (servidor HTTP)
- SQLite3 com `better-sqlite3` (banco de dados local)
- JWT (JSON Web Tokens) para autenticação
- Bcrypt para hash de senhas
- Multer para upload de arquivos

**Frontend:**
- React 18+ com TypeScript
- Vite (bundler)
- React Router (navegação)
- Context API (gerenciamento de estado de autenticação)
- CSS Modules e CSS Variables (estilização)

**Testes:**
- Selenium WebDriver (Python) para testes E2E

**Infraestrutura:**
- Docker e Docker Compose (containers)
- Nginx (servidor de arquivos estáticos e proxy reverso)

---

## Requisitos e Pré-requisitos

### Desenvolvimento Local
- Node.js 18+ e npm
- PowerShell (Windows) ou Bash (Linux/Mac)
- Git

### Testes E2E
- Python 3.8+
- Selenium WebDriver
- Google Chrome (ou outro navegador compatível)

### Deploy
- Docker Desktop (opcional, para ambiente isolado)
- Conta Vercel (para deploy do frontend)
- Servidor com Node.js (para deploy do backend)

---

## Estrutura do Projeto

```
meu_pet/
├── backend/
│   ├── src/
│   │   ├── domain/           # Entidades (User, Pet)
│   │   ├── application/      # Casos de uso e validações
│   │   ├── infrastructure/   # Repositórios e DB
│   │   ├── presentation/     # Rotas, controllers, middleware
│   │   ├── scripts/          # Scripts auxiliares (seed, etc.)
│   │   └── index.ts          # Entry point do servidor
│   ├── data/                 # SQLite DB (app.db)
│   ├── uploads/              # Arquivos enviados (fotos, docs)
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── .env                  # Variáveis de ambiente
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/   # Componentes React
│   │   │   ├── providers/    # Context providers
│   │   │   └── routes/       # Configuração de rotas
│   │   ├── lib/              # Configuração de API
│   │   ├── utils/            # Utilitários (validação, máscaras)
│   │   ├── styles/           # CSS global
│   │   ├── types/            # Tipos TypeScript
│   │   ├── main.tsx          # Entry point React
│   │   └── vite-env.d.ts     # Tipos de ambiente Vite
│   ├── public/               # Arquivos públicos
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── nginx.conf            # Configuração Nginx (Docker)
│   ├── Dockerfile
│   └── .env.local            # Variáveis de ambiente local
│
├── testes/
│   ├── e2e_store.db          # DB para armazenar credenciais de teste
│   ├── test_register_login.py
│   ├── test_pets_flow.py
│   ├── test_admin_users_flow.py
│   └── run.ps1               # Script para executar todos os testes
│
├── docker-compose.yml
└── README.md
```

---

## Instalação e Configuração

### Backend

1. **Instalar dependências:**
```powershell
cd .\backend
npm install
```

2. **Configurar variáveis de ambiente (.env):**
```env
PORT=3001
JWT_SECRET=dev-secret-123
ADMIN_KEY=changeme
```

- `PORT`: Porta onde o servidor Express irá rodar.
- `JWT_SECRET`: Segredo usado para assinar tokens JWT (use uma string aleatória longa em produção).
- `ADMIN_KEY`: Chave secreta para proteger rotas administrativas (header `x-admin-key`).

3. **Criar um usuário administrador:**
```powershell
cd .\backend
npm run seed:admin
```

Credenciais do admin criado:
- **Email:** `admin@gmail.com`
- **Senha:** `Modejudu@33`

### Frontend

1. **Instalar dependências:**
```powershell
cd .\frontend
npm install
```

2. **Configurar variáveis de ambiente (.env.local):**
```env
VITE_API_URL=http://localhost:3001
```

- `VITE_API_URL`: URL base da API backend.

---

## Execução em Ambiente de Desenvolvimento

### 1. Iniciar o Backend
```powershell
cd .\backend
npm run dev
```

O servidor será iniciado em `http://localhost:3001`.

**Logs esperados:**
```
Backend running on http://localhost:3001
ADMIN_KEY set: yes
```

### 2. Iniciar o Frontend
```powershell
cd .\frontend
npm run dev
```

O servidor de desenvolvimento Vite será iniciado (geralmente em `http://localhost:5173`).

**Acesse a aplicação:**
- Abra `http://localhost:5173` no navegador.
- Use a conta de administrador para fazer login: `admin@gmail.com` / `Modejudu@33`.

---

## Banco de Dados e Migrações

### Inicialização Automática

O backend utiliza **SQLite** como banco de dados local. Ao iniciar o servidor (`npm run dev`), o arquivo `backend/src/infrastructure/db.ts` é executado, criando automaticamente:

1. O diretório `backend/data/` (se não existir).
2. O arquivo `backend/data/app.db` (banco SQLite).
3. As tabelas `users` e `pets` com suas respectivas colunas e índices.

### Estrutura das Tabelas

#### Tabela `users`
```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  cpf TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('Tutor','Veterinário')),
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
```

#### Tabela `pets`
```sql
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
```

#### Tabela `agenda`
```sql
CREATE TABLE IF NOT EXISTS agenda (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  petId INTEGER NOT NULL,
  procedimento TEXT NOT NULL,
  data TEXT NOT NULL,
  horario TEXT NOT NULL,
  profissional TEXT NOT NULL,
  observacoes TEXT,
  createdAt TEXT NOT NULL DEFAULT (DATETIME('now')),
  FOREIGN KEY(petId) REFERENCES pets(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_agenda_pet ON agenda(petId);
CREATE INDEX IF NOT EXISTS idx_agenda_data ON agenda(data);
```

#### Tabela `registros_saude`
```sql
CREATE TABLE IF NOT EXISTS registros_saude (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  petId INTEGER NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('Vacina','Consulta','Cirurgia','Exame','Medicamento','Outros')),
  data TEXT NOT NULL,
  horario TEXT NOT NULL,
  profissional TEXT NOT NULL,
  observacoes TEXT,
  arquivoPath TEXT,
  createdAt TEXT NOT NULL DEFAULT (DATETIME('now')),
  FOREIGN KEY(petId) REFERENCES pets(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_registros_pet ON registros_saude(petId);
CREATE INDEX IF NOT EXISTS idx_registros_data ON registros_saude(data DESC);
CREATE INDEX IF NOT EXISTS idx_registros_tipo ON registros_saude(tipo);
```

### Acessar o Banco Diretamente

Para inspecionar ou modificar o banco de dados manualmente:

```powershell
cd .\backend\data
sqlite3 app.db
```

Comandos úteis do SQLite:
```sql
.tables                  -- Listar tabelas
.schema users            -- Ver estrutura da tabela users
SELECT * FROM users;     -- Listar todos os usuários
.exit                    -- Sair
```

---

## Autenticação e Autorização

### Fluxo de Autenticação

#### 1. Registro de Usuário

**Endpoint:** `POST /auth/register`

**Tipo de Requisição:** `multipart/form-data` (para suportar uploads de arquivos)

**Campos obrigatórios:**
- `name`: Nome completo (3-100 caracteres)
- `cpf`: CPF no formato `000.000.000-00` (11 dígitos numéricos)
- `type`: `Tutor` ou `Veterinário`
- `email`: E-mail válido (10-256 caracteres)
- `phone`: Telefone no formato `(00) 00000-0000`
- `password`: Senha (8-12 caracteres, incluindo maiúscula, número e caractere especial)

**Campos adicionais para Veterinário:**
- `crmv`: Número do CRMV (obrigatório)
- `clinicAddress`: Endereço da clínica (opcional)
- `professionalIdDoc`: Upload do documento profissional (obrigatório, arquivo)
- `diplomaDoc`: Upload do diploma/certificado (obrigatório, arquivo)

**Resposta de sucesso (201):**
```json
{
  "user": {
    "id": 1,
    "name": "João Silva",
    "email": "joao@example.com",
    "type": "Tutor",
    "role": "user",
    ...
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

O token JWT retornado deve ser armazenado no `localStorage` do navegador e enviado em todas as requisições autenticadas.

#### 2. Login de Usuário

**Endpoint:** `POST /auth/login`

**Tipo de Requisição:** `application/json`

**Corpo:**
```json
{
  "email": "admin@gmail.com",
  "password": "Modejudu@33"
}
```

**Resposta de sucesso (200):**
```json
{
  "user": { ... },
  "token": "..."
}
```

#### 3. Validação de Sessão

**Endpoint:** `GET /auth/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Resposta (200):**
```json
{
  "user": { ... }
}
```

### Middleware de Autenticação

O middleware `requireAuth` (em `backend/src/presentation/middleware/auth.ts`) é aplicado a todas as rotas que exigem autenticação:

```typescript
export function requireAuth(req: Request & { user?: any }, res: Response, next: NextFunction) {
  try {
    const auth = req.header('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    const secret = process.env.JWT_SECRET || 'dev-secret';
    const payload = jwt.verify(token, secret) as any;
    const repo = new SqliteUserRepository();
    const u = repo.findById(Number(payload.id));
    if (!u) return res.status(401).json({ message: 'Unauthorized' });
    req.user = { id: u.id, role: u.role, type: u.type };
    next();
  } catch {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}
```

### Proteção de Rotas no Frontend

O componente `Protected` em `AppRoutes.tsx` redireciona usuários não autenticados para a página de login:

```typescript
function Protected({ children }: { children: JSX.Element }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}
```

Componentes adicionais:
- `AdminOnly`: Apenas usuários com `role === 'admin'`
- `TutorOnly`: Apenas usuários com `type === 'Tutor'`

---

## Gestão de Usuários

### Rotas Administrativas (CRUD de Usuários)

Todas as rotas administrativas requerem o header `x-admin-key` com o valor definido em `.env` (`ADMIN_KEY`).

#### 1. Listar Usuários

**Endpoint:** `GET /admin/users?type=&q=`

**Query Parameters:**
- `type` (opcional): Filtrar por tipo (`Tutor` ou `Veterinário`)
- `q` (opcional): Buscar por nome ou CPF (substring)

**Resposta (200):**
```json
[
  {
    "id": 1,
    "name": "João Silva",
    "cpf": "123.456.789-00",
    "type": "Tutor",
    "email": "joao@example.com",
    "phone": "(11) 98765-4321",
    "role": "user",
    ...
  },
  ...
]
```

**Nota:** O campo `passwordHash` é removido da resposta para segurança.

#### 2. Criar Usuário (Admin)

**Endpoint:** `POST /admin/users`

**Headers:**
```
x-admin-key: changeme
```

**Tipo de Requisição:** `multipart/form-data`

**Campos:** Os mesmos do endpoint `/auth/register`, com a adição opcional de:
- `role`: `admin` ou `user` (padrão: `user`)

#### 3. Atualizar Usuário

**Endpoint:** `PUT /admin/users/:id`

**Headers:**
```
x-admin-key: changeme
```

**Tipo de Requisição:** `multipart/form-data`

**Campos:** Todos os campos de `POST /admin/users` são opcionais. Campos não enviados mantêm seus valores atuais.

**Observação sobre senha:**
- Se o campo `password` estiver vazio ou não for enviado, a senha atual do usuário será mantida.

#### 4. Deletar Usuário

**Endpoint:** `DELETE /admin/users/:id`

**Headers:**
```
x-admin-key: changeme
```

**Resposta (204):** Sem conteúdo.

**Atenção:** A exclusão de um usuário também remove:
- Todos os pets associados (via `ON DELETE CASCADE`)
- Arquivos de upload (documentos profissionais, se houver)

### Validações de Usuário

As validações são realizadas pelo caso de uso `CreateUser` e `UpdateUser` (em `backend/src/application/`):

- **Nome:** 3-100 caracteres
- **CPF:** 11 dígitos numéricos (aceita com ou sem máscara)
- **E-mail:** 10-256 caracteres, formato válido
- **Telefone:** Formato `(00) 00000-0000`
- **Senha:** 8-12 caracteres, incluindo:
  - Pelo menos 1 letra maiúscula
  - Pelo menos 1 número
  - Pelo menos 1 caractere especial (!@#$%^&*)

**Veterinários adicionalmente:**
- CRMV obrigatório
- Upload de documento profissional (obrigatório)
- Upload de diploma/certificado (obrigatório)

---

## Gestão de Pets

### Rotas de Pets (Requer Autenticação)

Todas as rotas de pets exigem autenticação via JWT e estão restritas a usuários do tipo `Tutor`.

#### 1. Listar Pets do Tutor (RFS08)

**Endpoint:** `GET /pets?name=&species=`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `name` (opcional): Filtrar por nome (substring)
- `species` (opcional): Filtrar por espécie (`Cachorro`, `Cavalo`, `Gato`, `Outros`)

**Resposta (200):**
```json
[
  {
    "id": 1,
    "ownerId": 2,
    "name": "Rex",
    "species": "Cachorro",
    "breed": "Labrador",
    "sex": "Macho",
    "age": 5,
    "weight": 30.5,
    "height": 60,
    "notes": "Muito brincalhão",
    "photoPath": "/uploads/pet-1699999999999-123456789.jpg",
    "createdAt": "2023-11-15 10:30:00"
  },
  ...
]
```

**Ordenação padrão:** Por data de criação decrescente (mais recentes primeiro).

#### 2. Criar Pet (RFS05)

**Endpoint:** `POST /pets`

**Headers:**
```
Authorization: Bearer <token>
```

**Tipo de Requisição:** `multipart/form-data`

**Campos obrigatórios:**
- `name`: Nome do pet (3-100 caracteres)
- `species`: `Cachorro`, `Cavalo`, `Gato` ou `Outros`

**Campos opcionais:**
- `breed`: Raça (3-100 caracteres)
- `sex`: `Macho`, `Fêmea` ou `Irrelevante`
- `age`: Idade (número)
- `weight`: Peso em kg (número)
- `height`: Altura em cm (número)
- `notes`: Observações adicionais (3-100 caracteres)
- `photo`: Upload da foto do pet (arquivo de imagem, até 5MB)

**Resposta (201):**
```json
{
  "id": 1,
  "ownerId": 2,
  "name": "Rex",
  ...
}
```

#### 3. Atualizar Pet (RFS06)

**Endpoint:** `PUT /pets/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Tipo de Requisição:** `multipart/form-data`

**Campos:** Todos os campos de `POST /pets` são opcionais. Campos não enviados mantêm seus valores atuais.

**Resposta (200):**
```json
{
  "id": 1,
  ...
}
```

#### 4. Deletar Pet (RFS07)

**Endpoint:** `DELETE /pets/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Resposta (204):** Sem conteúdo.

**Atenção:** A exclusão de um pet remove também:
- Arquivo de foto (se existir)
- Todos os agendamentos associados (`ON DELETE CASCADE`)
- Todos os registros de saúde associados (`ON DELETE CASCADE`)

### Validações de Pet

- **Nome:** Obrigatório, 3-100 caracteres
- **Espécie:** Obrigatório, um dos valores: `Cachorro`, `Cavalo`, `Gato`, `Outros`
- **Foto:** Opcional, formatos aceitos: PNG, JPG, JPEG, WEBP, GIF (até 5MB)

---

## Agenda de Consultas e Procedimentos

### Rotas de Agenda (Requer Autenticação)

Todas as rotas de agenda exigem autenticação via JWT e estão restritas a usuários do tipo `Tutor`.

#### 1. Listar Agendamentos (RFS09)

**Endpoint:** `GET /agenda?petId=`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `petId` (opcional): Filtrar por pet específico

**Resposta (200):**
```json
[
  {
    "id": 1,
    "petId": 2,
    "procedimento": "Consulta",
    "data": "2025-12-31",
    "horario": "15:30",
    "profissional": "Dr. João Silva",
    "observacoes": "Consulta de rotina",
    "createdAt": "2025-11-12 10:30:00"
  },
  ...
]
```

**Ordenação padrão:** Por data de agendamento (crescente - próximos primeiro).

#### 2. Criar Agendamento (RFS10)

**Endpoint:** `POST /agenda`

**Headers:**
```
Authorization: Bearer <token>
```

**Tipo de Requisição:** `application/json`

**Campos obrigatórios:**
- `petId`: ID do pet (número)
- `procedimento`: Tipo do procedimento (ex: `Consulta`, `Vacina`, `Cirurgia`, `Exame`)
- `data`: Data do agendamento (formato: `YYYY-MM-DD`)
- `horario`: Horário (formato: `HH:MM`)
- `profissional`: Nome do profissional/clínica

**Campos opcionais:**
- `observacoes`: Observações adicionais

**Resposta (201):**
```json
{
  "id": 1,
  "petId": 2,
  "procedimento": "Consulta",
  ...
}
```

#### 3. Atualizar Agendamento (RFS11)

**Endpoint:** `PUT /agenda/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Tipo de Requisição:** `application/json`

**Campos:** Todos os campos de `POST /agenda` são opcionais. Campos não enviados mantêm seus valores atuais.

**Resposta (200):**
```json
{
  "id": 1,
  ...
}
```

#### 4. Deletar Agendamento (RFS12)

**Endpoint:** `DELETE /agenda/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Resposta (204):** Sem conteúdo.

### Validações de Agenda

- **Pet:** Obrigatório, deve pertencer ao tutor autenticado
- **Procedimento:** Obrigatório
- **Data:** Obrigatório, formato `YYYY-MM-DD`
- **Horário:** Obrigatório, formato `HH:MM`
- **Profissional:** Obrigatório

---

## Registros de Saúde

### Rotas de Registros de Saúde (Requer Autenticação)

Todas as rotas de registros de saúde exigem autenticação via JWT e estão restritas a usuários do tipo `Tutor`.

#### 1. Listar Registros de Saúde (RFS13)

**Endpoint:** `GET /registros-saude?petId=&tipo=`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `petId` (opcional): Filtrar por pet específico
- `tipo` (opcional): Filtrar por tipo de registro (ex: `Vacina`, `Consulta`, `Cirurgia`, `Exame`)

**Resposta (200):**
```json
[
  {
    "id": 1,
    "petId": 2,
    "tipo": "Vacina",
    "data": "2025-12-25",
    "horario": "15:30",
    "profissional": "Dr. Maria Santos",
    "observacoes": "V10 - Primeira dose",
    "arquivoPath": "/uploads/registros/registro-1234567890.pdf",
    "createdAt": "2025-11-12 10:30:00"
  },
  ...
]
```

**Ordenação padrão:** Por data decrescente (mais recentes primeiro).

#### 2. Criar Registro de Saúde (RFS14)

**Endpoint:** `POST /registros-saude`

**Headers:**
```
Authorization: Bearer <token>
```

**Tipo de Requisição:** `multipart/form-data`

**Campos obrigatórios:**
- `petId`: ID do pet (número)
- `tipo`: Tipo do registro (`Vacina`, `Consulta`, `Cirurgia`, `Exame`, `Medicamento`, `Outros`)
- `data`: Data do registro (formato: `YYYY-MM-DD` ou `DD/MM/YYYY`)
- `horario`: Horário (formato: `HH:MM`)
- `profissional`: Nome do profissional/clínica

**Campos opcionais:**
- `observacoes`: Observações detalhadas
- `arquivo`: Upload do documento (receita, exame, certificado de vacina, etc.)

**Resposta (201):**
```json
{
  "id": 1,
  "petId": 2,
  "tipo": "Vacina",
  "arquivoPath": "/uploads/registros/registro-1234567890.pdf",
  ...
}
```

#### 3. Atualizar Registro de Saúde (RFS15)

**Endpoint:** `PUT /registros-saude/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Tipo de Requisição:** `multipart/form-data`

**Campos:** Todos os campos de `POST /registros-saude` são opcionais. Campos não enviados mantêm seus valores atuais.

**Resposta (200):**
```json
{
  "id": 1,
  ...
}
```

#### 4. Deletar Registro de Saúde (RFS16)

**Endpoint:** `DELETE /registros-saude/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Resposta (204):** Sem conteúdo.

**Observação:** Apenas registros do tipo `Vacina` podem ser deletados. Outros tipos retornam erro 403 para preservar histórico médico.

**Atenção:** A exclusão de um registro remove também:
- Arquivo anexo (se existir)

### Validações de Registro de Saúde

- **Pet:** Obrigatório, deve pertencer ao tutor autenticado
- **Tipo:** Obrigatório, um dos valores: `Vacina`, `Consulta`, `Cirurgia`, `Exame`, `Medicamento`, `Outros`
- **Data:** Obrigatório, formato `YYYY-MM-DD` ou `DD/MM/YYYY`
- **Horário:** Obrigatório, formato `HH:MM`
- **Profissional:** Obrigatório
- **Arquivo:** Opcional, formatos aceitos: PDF, PNG, JPG, JPEG (até 10MB)

---

## Upload de Arquivos

### Configuração do Multer

O backend utiliza o middleware `multer` para processar uploads de arquivos. Os arquivos são salvos no diretório `backend/uploads/`.

**Tipos de arquivos aceitos:**
- **Documentos:** Qualquer arquivo (para documentos de veterinários)
- **Fotos de pets:** PNG, JPG, JPEG, WEBP, GIF (até 5MB)

**Exemplo de configuração (pets):**
```typescript
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    let ext = path.extname(file.originalname);
    if (!ext) {
      switch (file.mimetype) {
        case 'image/png': ext = '.png'; break;
        case 'image/jpeg':
        case 'image/jpg': ext = '.jpg'; break;
        case 'image/webp': ext = '.webp'; break;
        case 'image/gif': ext = '.gif'; break;
        default: ext = '.png';
      }
    }
    cb(null, `pet-${unique}${ext}`);
  },
});
```

### Acesso aos Arquivos

Os arquivos enviados ficam disponíveis publicamente em:
```
http://localhost:3001/uploads/<nome-do-arquivo>
```

Exemplo:
```
http://localhost:3001/uploads/pet-1699999999999-123456789.jpg
```

---

## Testes End-to-End com Selenium

### Estrutura dos Testes

Os testes E2E estão localizados no diretório `testes/` e cobrem cinco fluxos principais:

1. **test_register_login.py**: Registro e login/logout de usuários
2. **test_pets_flow.py**: Gestão de pets (criar, editar, deletar)
3. **test_agenda_flow.py**: Gestão de agenda (criar, editar, deletar agendamentos)
4. **test_registrosaude_flow.py**: Gestão de registros de saúde (criar, editar, deletar)
5. **test_admin_users_flow.py**: Gestão de usuários pelo administrador

### Configuração do Ambiente de Testes

#### 1. Instalar Python e Dependências

```powershell
python --version  # Verificar instalação (Python 3.8+)
pip install selenium
```

#### 2. Instalar WebDriver

O Selenium Manager (incluído no Selenium 4.6+) baixa automaticamente o driver compatível com o navegador. Se preferir, você pode baixar manualmente:

- ChromeDriver: https://chromedriver.chromium.org/
- GeckoDriver (Firefox): https://github.com/mozilla/geckodriver/releases

#### 3. Configurar Variáveis de Ambiente

**Modo headless (sem janela visível) - padrão:**
```powershell
$env:MEUPET_HEADLESS = '1'
```

**Modo visível (para debug):**
```powershell
$env:MEUPET_HEADLESS = '0'
```

**Delay entre ações (em segundos):**
```powershell
$env:MEUPET_E2E_DELAY = '1'
```

### Executar Testes

#### Executar todos os testes
```powershell
cd .\testes
.\run.ps1
```

#### Executar testes individuais
```powershell
cd .\testes

# Registro e login
$env:MEUPET_HEADLESS='0'; $env:MEUPET_E2E_DELAY='1'; python .\test_register_login.py

# Gestão de pets
$env:MEUPET_HEADLESS='0'; $env:MEUPET_E2E_DELAY='1'; python .\test_pets_flow.py

# Gestão de agenda
$env:MEUPET_HEADLESS='0'; $env:MEUPET_E2E_DELAY='1'; python .\test_agenda_flow.py

# Gestão de registros de saúde
$env:MEUPET_HEADLESS='0'; $env:MEUPET_E2E_DELAY='1'; python .\test_registrosaude_flow.py

# Gestão de usuários (admin)
$env:MEUPET_HEADLESS='0'; $env:MEUPET_E2E_DELAY='1'; python .\test_admin_users_flow.py
```

### Descrição dos Testes

#### 1. test_register_login.py

**Objetivo:** Validar o fluxo completo de registro e autenticação.

**Ações:**
1. Acessa a página de registro (`/register`)
2. Cria 3 contas de **Tutor** com dados aleatórios (CPF, telefone, email)
3. Cria 2 contas de **Veterinário** com dados aleatórios e upload de documentos
4. Para cada conta criada:
   - Faz login
   - Verifica se o redirecionamento para o dashboard foi bem-sucedido
   - Faz logout
5. Armazena as credenciais dos usuários criados em `e2e_store.db`

**Resultado esperado:**
- 5 usuários criados (3 Tutores, 2 Veterinários)
- Login e logout bem-sucedidos para todos
- Credenciais armazenadas para testes subsequentes

#### 2. test_pets_flow.py

**Objetivo:** Validar a gestão completa de pets por um tutor.

**Ações:**
1. Carrega as credenciais dos 2 últimos tutores criados em `e2e_store.db`
2. Para cada tutor:
   - Faz login
   - Acessa a aba "Meus Pets"
   - Cria 3 pets com dados aleatórios e foto
   - Para cada pet criado:
     - Edita um atributo (ex: nome, idade)
     - Salva as alterações
   - Deleta todos os 3 pets (com confirmação)
   - Faz logout

**Resultado esperado:**
- 6 pets criados (3 por tutor)
- Todas as edições e exclusões bem-sucedidas
- Modais e confirmações funcionando corretamente

#### 3. test_agenda_flow.py

**Objetivo:** Validar a gestão completa de agendamentos por um tutor.

**Ações:**
1. Carrega as credenciais dos 2 últimos tutores criados em `e2e_store.db`
2. Para cada tutor:
   - Faz login
   - Cria 3 pets
   - Acessa a aba "Agenda"
   - Cria 3 agendamentos com dados aleatórios
   - Edita os 3 agendamentos (alterando horário)
   - Deleta todos os agendamentos (com confirmação)
   - Deleta todos os pets
   - Faz logout

**Resultado esperado:**
- 6 agendamentos criados (3 por tutor)
- Todas as edições e exclusões bem-sucedidas
- Validação de campos de data e hora funcionando

#### 4. test_registrosaude_flow.py

**Objetivo:** Validar a gestão completa de registros de saúde por um tutor.

**Ações:**
1. Carrega as credenciais dos 2 últimos tutores criados em `e2e_store.db`
2. Para cada tutor:
   - Faz login
   - Cria 2 pets
   - Acessa a aba "Registros de Saúde"
   - Cria 2 registros do tipo "Vacina" com upload de arquivo
   - Edita o primeiro registro (alterando profissional e data)
   - Deleta todos os registros (com confirmação)
   - Deleta todos os pets
   - Faz logout

**Resultado esperado:**
- 4 registros de saúde criados (2 por tutor)
- Upload de arquivos funcionando
- Todas as edições e exclusões bem-sucedidas
- Validação de campos de data e hora funcionando

#### 5. test_admin_users_flow.py

**Objetivo:** Validar a gestão de usuários pelo administrador.

**Ações:**
1. Faz login com a conta de administrador (`admin@gmail.com` / `Modejudu@33`)
2. Acessa a aba "Gerenciar usuários"
3. Clica em "Cadastrar Usuário" (modal)
4. Cria 5 novos usuários do tipo Tutor com dados aleatórios
5. Para cada usuário criado:
   - Clica no botão "Editar"
   - Altera um atributo (ex: endereço)
   - Salva as alterações
6. Para cada usuário criado:
   - Clica no botão "Deletar"
   - Confirma a exclusão no pop-up

**Resultado esperado:**
- 5 usuários criados pelo admin
- Todas as edições e exclusões bem-sucedidas
- Confirmações de exclusão funcionando

### Seletores e data-testid

Para garantir a estabilidade dos testes, os componentes do frontend utilizam atributos `data-testid`:

**Exemplos:**
- `data-testid="btn-open-admin-user-modal"`: Botão para abrir o modal de cadastro de usuário
- `data-testid="admin-user-name"`: Input do nome do usuário
- `data-testid="admin-edit-{id}"`: Botão de editar usuário
- `data-testid="admin-delete-{id}"`: Botão de deletar usuário
- `data-testid="btn-open-pet-modal"`: Botão para abrir o modal de cadastro de pet
- `data-testid="pet-edit-{id}"`: Botão de editar pet
- `data-testid="pet-delete-{id}"`: Botão de deletar pet
- `data-testid="btn-open-agenda-modal"`: Botão para abrir o modal de agendamento
- `data-testid="agenda-modal"`: Modal de agendamento
- `data-testid="registro-pet"`: Select de pet no formulário de registro de saúde
- `data-testid="registro-tipo"`: Select de tipo de registro
- `data-testid="registro-data"`: Input de data do registro
- `data-testid="registro-horario"`: Input de horário do registro
- `data-testid="registro-profissional"`: Input do profissional
- `data-testid="registro-submit"`: Botão de submissão do formulário de registro

**Exemplo de uso no teste:**
```python
driver.find_element(By.CSS_SELECTOR, '[data-testid="btn-open-admin-user-modal"]').click()
```

### Banco de Dados de Testes (e2e_store.db)

Os testes utilizam um banco SQLite local (`testes/e2e_store.db`) para armazenar credenciais de usuários criados durante os testes. Isso permite que testes subsequentes utilizem essas credenciais sem precisar recriar usuários.

**Estrutura da tabela:**
```sql
CREATE TABLE IF NOT EXISTS test_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  type TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

---

## Docker e Ambientes Isolados

### Estrutura de Containers

A aplicação é composta por 2 serviços Docker:

1. **backend**: Servidor Express.js
2. **frontend**: Nginx servindo a build estática do Vite + proxy reverso para o backend

### Arquivos de Configuração

#### docker-compose.yml

```yaml
version: "3.9"

services:
  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    environment:
      - PORT=3001
      - JWT_SECRET=${JWT_SECRET:-dev-secret-123}
      - ADMIN_KEY=${ADMIN_KEY:-changeme}
    volumes:
      - ./backend/data:/usr/src/app/backend/data
      - ./backend/uploads:/usr/src/app/uploads
    ports:
      - "3001:3001"
    restart: unless-stopped

  frontend:
    build:
      context: .
      dockerfile: frontend/Dockerfile
      args:
        VITE_API_URL: ${VITE_API_URL:-/api}
    ports:
      - "8088:8080"
    depends_on:
      - backend
    restart: unless-stopped
```

#### backend/Dockerfile

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /usr/src/app
COPY backend/package*.json ./backend/
RUN cd backend && npm ci
COPY backend ./backend
RUN cd backend && npm run build

FROM node:18-alpine
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev
COPY --from=builder /usr/src/app/backend/dist ./backend/dist
COPY --from=builder /usr/src/app/backend/src ./backend/src
RUN mkdir -p /usr/src/app/backend/data /usr/src/app/uploads
EXPOSE 3001
CMD ["node", "backend/dist/index.js"]
```

#### frontend/Dockerfile

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend ./
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
```

#### frontend/nginx.conf

```nginx
server {
  listen 8080;
  server_name _;

  root /usr/share/nginx/html;
  index index.html;

  # Serve static files and fallback to index.html for SPA routes
  location / {
    try_files $uri $uri/ /index.html;
  }

  # API proxy to backend container
  location /api/ {
    proxy_pass http://backend:3001/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  client_max_body_size 10m;
}
```

### Executar com Docker

#### 1. Build das Imagens

```powershell
cd C:\meu_pet
docker compose build
```

#### 2. Iniciar os Containers

```powershell
docker compose up -d
```

**Verificar logs:**
```powershell
docker compose logs -f
```

#### 3. Acessar a Aplicação

- **Frontend:** http://localhost:8088
- **Backend (direto):** http://localhost:3001

#### 4. Parar os Containers

```powershell
docker compose down
```

### Troubleshooting Docker

#### Problema: Porta já em uso (8080 ou 3001)

**Erro:**
```
Error response from daemon: Ports are not available: exposing port TCP 0.0.0.0:8080 -> 0.0.0.0:0: listen tcp 0.0.0.0:8080: bind: Only one usage of each socket address (protocol/network address/port) is normally permitted.
```

**Solução:**
1. Verificar processos usando a porta:
```powershell
netstat -ano | findstr :8080
netstat -ano | findstr :3001
```

2. Matar o processo:
```powershell
taskkill /PID <PID> /F
```

3. Ou alterar a porta no `docker-compose.yml`:
```yaml
ports:
  - "8088:8080"  # Porta 8088 no host, 8080 no container
```

#### Problema: Docker Desktop não está rodando

**Erro:**
```
open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.
```

**Solução:**
1. Abrir o Docker Desktop
2. Aguardar inicialização completa
3. Verificar status:
```powershell
docker version
```

#### Problema: Frontend mostra página em branco

**Causa:** Build do Vite com `VITE_API_URL` incorreta ou Nginx não configurado corretamente.

**Solução:**
1. Rebuild do frontend sem cache:
```powershell
docker compose down
docker compose build --no-cache frontend
docker compose up -d
```

2. Verificar logs do Nginx:
```powershell
docker compose logs -f frontend
```

3. Verificar se o Nginx está servindo os arquivos:
```powershell
docker compose exec frontend ls -la /usr/share/nginx/html
```

---

## Deploy e Produção

### Deploy do Frontend na Vercel

#### 1. Importar o Repositório

1. Acesse [vercel.com](https://vercel.com) e faça login
2. Clique em "Add New Project"
3. Importe o repositório do GitHub: `https://github.com/junior875/meu-pet-em-dia`

#### 2. Configurar o Projeto

- **Framework Preset:** Vite
- **Root Directory:** `frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

#### 3. Configurar Variáveis de Ambiente

Na aba "Environment Variables", adicione:

```
VITE_API_URL=https://api.seu-dominio.com
```

**Importante:** A URL deve apontar para o backend em produção.

#### 4. Deploy

Clique em "Deploy". A Vercel irá automaticamente:
- Instalar dependências (`npm install`)
- Executar o build (`npm run build`)
- Servir os arquivos estáticos do diretório `dist`

#### 5. Configurar Rotas SPA (se necessário)

Se o React Router não funcionar corretamente (erro 404 ao recarregar páginas), crie um arquivo `frontend/vercel.json`:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Deploy do Backend

O backend pode ser hospedado em qualquer provedor que suporte Node.js:

- **Heroku**
- **Railway**
- **Render**
- **AWS EC2**
- **Google Cloud Run**
- **DigitalOcean App Platform**

#### Exemplo: Deploy no Railway

1. Acesse [railway.app](https://railway.app) e faça login
2. Crie um novo projeto e conecte ao repositório do GitHub
3. Configure o serviço:
   - **Root Directory:** `backend`
   - **Build Command:** `npm run build`
   - **Start Command:** `node dist/index.js`
4. Configure variáveis de ambiente:
   ```
   PORT=3001
   JWT_SECRET=<uma-string-aleatória-longa>
   ADMIN_KEY=<uma-chave-secreta>
   ```
5. Deploy

A Railway irá gerar uma URL pública para o backend, que deve ser usada como `VITE_API_URL` no frontend.

### Banco de Dados em Produção

**SQLite** é adequado para desenvolvimento e testes, mas **não é recomendado para produção** em ambientes com múltiplas instâncias ou alto tráfego.

**Alternativas recomendadas:**
- **PostgreSQL** (Supabase, Heroku Postgres, Railway)
- **MySQL**
- **MongoDB** (para dados não-relacionais)

**Migração para PostgreSQL:**
1. Instalar dependências:
```bash
npm install pg
```

2. Adaptar o `db.ts` para usar `pg` ou `Prisma`
3. Criar schema SQL equivalente no PostgreSQL
4. Migrar dados do SQLite para PostgreSQL (se necessário)

---

## Troubleshooting

### Backend não inicia

**Erro:** `Cannot find module 'dotenv/config'`

**Solução:**
```powershell
cd .\backend
npm install dotenv
```

---

**Erro:** `Port 3001 is already in use`

**Solução:**
1. Verificar processos usando a porta:
```powershell
netstat -ano | findstr :3001
```

2. Matar o processo:
```powershell
taskkill /PID <PID> /F
```

3. Ou alterar a porta no `.env`:
```env
PORT=3002
```

---

### Frontend não conecta ao backend

**Erro no console:** `net::ERR_CONNECTION_REFUSED`

**Solução:**
1. Verificar se o backend está rodando (`http://localhost:3001/health` deve retornar `{"ok":true}`)
2. Verificar se `VITE_API_URL` está correto no `.env.local`
3. Reiniciar o servidor Vite após alterar `.env.local`

---

### CPF inválido ao registrar

**Erro:** `CPF inválido (use 000.000.000-00)`

**Causa:** CPF com formato incorreto ou menos de 11 dígitos.

**Solução:**
- Use CPF com 11 dígitos numéricos (com ou sem máscara)
- Exemplos válidos: `12345678901`, `123.456.789-01`

---

### Selenium não abre o navegador

**Causa:** Variável de ambiente `MEUPET_HEADLESS` não configurada ou ChromeDriver incompatível.

**Solução:**
1. Configurar modo visível:
```powershell
$env:MEUPET_HEADLESS = '0'
```

2. Verificar instalação do Chrome:
```powershell
google-chrome --version  # Linux/Mac
# Windows: verificar em C:\Program Files\Google\Chrome\Application\chrome.exe
```

3. Atualizar Selenium:
```powershell
pip install --upgrade selenium
```

---

### Selenium não encontra elementos

**Erro:** `NoSuchElementException` ou `TimeoutException`

**Causa:** Seletores desatualizados ou elementos não carregados.

**Solução:**
1. Verificar se os `data-testid` estão corretos nos componentes
2. Aumentar o tempo de espera:
```python
WebDriverWait(driver, 20).until(...)  # De 10 para 20 segundos
```

3. Adicionar delay explícito:
```powershell
$env:MEUPET_E2E_DELAY = '2'  # 2 segundos entre ações
```

---

### Imagens de pets não aparecem

**Causa:** Caminho da imagem incorreto ou CORS.

**Solução:**
1. Verificar se o backend está servindo `/uploads`:
   - Abrir `http://localhost:3001/uploads/<nome-do-arquivo>` no navegador
2. No frontend, verificar se `API_BASE_URL` está correto:
```typescript
const src = pet.photoPath?.startsWith('/uploads') 
  ? `${API_BASE_URL}${pet.photoPath}` 
  : pet.photoPath;
```

---

### Docker: imagem não builda

**Erro:** `failed to solve with frontend dockerfile.v0`

**Solução:**
1. Verificar sintaxe do Dockerfile
2. Limpar cache do Docker:
```powershell
docker system prune -a
```

3. Rebuild sem cache:
```powershell
docker compose build --no-cache
```

---

### Git: erro ao criar branch com espaço

**Erro:** `fatal: 'release 1' is not a valid branch name`

**Causa:** Nomes de branch não podem conter espaços.

**Solução:**
```powershell
git switch -c release-1  # Use hífen ou underscore
```

---

## Conclusão

Este guia fornece uma visão completa sobre a implementação, configuração e operação do sistema **Meu Pet em Dia**. Para dúvidas ou problemas não cobertos aqui, consulte:

- **README.md:** Visão geral do projeto
- **GUIA_ARQUITETURAL.md:** Arquitetura detalhada do sistema
- **Issues no GitHub:** Reportar bugs ou solicitar recursos

---

**Última atualização:** 2025-11-05

