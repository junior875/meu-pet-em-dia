# Guia Arquitetural - Meu Pet em Dia

## Índice

1. [Visão Geral da Arquitetura](#visão-geral-da-arquitetura)
2. [Arquitetura do Backend](#arquitetura-do-backend)
3. [Arquitetura do Frontend](#arquitetura-do-frontend)
4. [Comunicação Frontend-Backend](#comunicação-frontend-backend)
5. [Fluxos de Dados Principais](#fluxos-de-dados-principais)
6. [Padrões de Design Utilizados](#padrões-de-design-utilizados)
7. [Segurança e Autenticação](#segurança-e-autenticação)
8. [Banco de Dados e Persistência](#banco-de-dados-e-persistência)
9. [Deploy e Infraestrutura](#deploy-e-infraestrutura)
10. [Testes e Qualidade](#testes-e-qualidade)
11. [Escalabilidade e Evolução](#escalabilidade-e-evolução)

---

## Visão Geral da Arquitetura

O sistema **Meu Pet em Dia** segue uma arquitetura **cliente-servidor** clássica, com separação clara entre frontend (cliente) e backend (servidor). A comunicação entre as camadas é feita via **API REST** sobre HTTP/HTTPS.

### Diagrama de Alto Nível

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTE (Navegador)                       │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              Frontend (React + Vite)                    │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │    │
│  │  │Components│  │ Context  │  │  Router  │             │    │
│  │  │  (UI)    │  │(Auth)    │  │          │             │    │
│  │  └──────────┘  └──────────┘  └──────────┘             │    │
│  │       │              │              │                   │    │
│  │       └──────────────┴──────────────┘                   │    │
│  │                      │                                   │    │
│  │                 [API Client]                             │    │
│  └──────────────────────┼────────────────────────────────┘    │
└─────────────────────────┼──────────────────────────────────────┘
                          │
                    HTTP/HTTPS (REST API)
                    Authorization: Bearer <JWT>
                          │
┌─────────────────────────┼──────────────────────────────────────┐
│                 SERVIDOR (Node.js)                              │
│  ┌──────────────────────┼────────────────────────────────┐    │
│  │              Backend (Express.js)                      │    │
│  │       ┌──────────────┴────────────────┐               │    │
│  │       │  Presentation Layer (Routes)  │               │    │
│  │       │  ┌──────┐ ┌──────┐ ┌──────┐  │               │    │
│  │       │  │ Auth │ │Admin │ │ Pets │  │               │    │
│  │       │  └──────┘ └──────┘ └──────┘  │               │    │
│  │       └──────────────┬────────────────┘               │    │
│  │                      │                                 │    │
│  │       ┌──────────────┴────────────────┐               │    │
│  │       │  Application Layer (Use Cases)│               │    │
│  │       │  ┌──────────┐ ┌──────────┐   │               │    │
│  │       │  │CreateUser│ │CreatePet │   │               │    │
│  │       │  └──────────┘ └──────────┘   │               │    │
│  │       └──────────────┬────────────────┘               │    │
│  │                      │                                 │    │
│  │       ┌──────────────┴────────────────┐               │    │
│  │       │  Infrastructure Layer          │               │    │
│  │       │  ┌────────────┐ ┌──────────┐  │               │    │
│  │       │  │Repositories│ │   DB     │  │               │    │
│  │       │  └────────────┘ └──────────┘  │               │    │
│  │       └──────────────┬────────────────┘               │    │
│  └──────────────────────┼────────────────────────────────┘    │
└─────────────────────────┼──────────────────────────────────────┘
                          │
                    ┌─────┴─────┐
                    │  SQLite   │
                    │  (app.db) │
                    └───────────┘
```

### Componentes Principais

| Componente                   | Tecnologia                        | Responsabilidade                                                         |
| ---------------------------- | --------------------------------- | ------------------------------------------------------------------------ |
| **Frontend**           | React 18 + TypeScript + Vite      | Interface do usuário, validações client-side, gerenciamento de estado |
| **Backend**            | Node.js + Express.js + TypeScript | Lógica de negócios, validações, autenticação, persistência        |
| **Banco de Dados**     | SQLite (better-sqlite3)           | Armazenamento persistente de usuários e pets                            |
| **Autenticação**     | JWT (jsonwebtoken) + Bcrypt       | Geração de tokens, verificação de identidade, hash de senhas         |
| **Upload de Arquivos** | Multer                            | Processamento de fotos de pets e documentos de veterinários             |
| **Proxy Reverso**      | Nginx (Docker)                    | Servir arquivos estáticos do frontend e proxy para API                  |
| **Testes E2E**         | Selenium WebDriver (Python)       | Testes automatizados de fluxos completos                                 |

---

## Arquitetura do Backend

O backend segue princípios de **Clean Architecture** e **Domain-Driven Design (DDD)**, organizando o código em camadas bem definidas com responsabilidades claras.

### Estrutura de Camadas

```
backend/src/
│
├── domain/                    # Camada de Domínio
│   ├── User.ts                # Entidade User + tipos UserType, UserRole
│   └── Pet.ts                 # Entidade Pet + tipos PetSpecies, PetSex
│
├── application/               # Camada de Aplicação (Use Cases)
│   ├── CreateUser.ts          # [RFS01] Cadastrar Usuário
│   ├── UpdateUser.ts          # [RFS02] Alterar Usuário
│   ├── password.ts            # Hash e verificação de senha
│   ├── validators.ts          # Validações de nome, CPF, email, etc.
│   ├── pets/
│   │   ├── CreatePet.ts       # [RFS05] Cadastrar Pet
│   │   ├── UpdatePet.ts       # [RFS06] Alterar Pet
│   │   ├── DeletePet.ts       # [RFS07] Deletar Pet
│   │   └── ListPets.ts        # [RFS08] Listar Pets
│   ├── agenda/
│   │   ├── CreateAgenda.ts    # [RFS10] Criar Agendamento
│   │   ├── UpdateAgenda.ts    # [RFS11] Alterar Agendamento
│   │   ├── DeleteAgenda.ts    # [RFS12] Deletar Agendamento
│   │   └── ListAgendaByPet.ts # [RFS09] Listar Agendamentos
│   └── registroSaude/
│       ├── CreateRegistroSaude.ts  # [RFS14] Criar Registro de Saúde
│       ├── UpdateRegistroSaude.ts  # [RFS15] Alterar Registro de Saúde
│       ├── DeleteRegistroSaude.ts  # [RFS16] Deletar Registro de Saúde
│       └── ListRegistroSaude.ts    # [RFS13] Listar Registros de Saúde
│
├── infrastructure/            # Camada de Infraestrutura
│   ├── db.ts                  # Configuração e inicialização do SQLite
│   └── repositories/
│       ├── UserRepository.ts              # Interface do repositório de usuários
│       ├── SqliteUserRepository.ts        # Implementação SQLite
│       ├── PetRepository.ts               # Interface do repositório de pets
│       ├── SqlitePetRepository.ts         # Implementação SQLite
│       ├── AgendaRepository.ts            # Interface do repositório de agenda
│       ├── SqliteAgendaRepository.ts      # Implementação SQLite
│       ├── RegistroSaudeRepository.ts     # Interface do repositório de registros
│       └── SqliteRegistroSaudeRepository.ts # Implementação SQLite
│
├── presentation/              # Camada de Apresentação (API)
│   ├── routes/
│   │   ├── auth.ts            # Rotas públicas: /auth/register, /auth/login
│   │   ├── admin.ts           # Rotas admin: /admin/users (CRUD)
│   │   ├── pets.ts            # Rotas pets: /pets (CRUD)
│   │   ├── agenda.ts          # Rotas agenda: /agenda (CRUD)
│   │   └── registroSaude.ts   # Rotas registros: /registros-saude (CRUD)
│   └── middleware/
│       └── auth.ts            # Middleware de autenticação JWT
│
├── scripts/
│   └── seedAdmin.ts           # Script para criar usuário admin
│
└── index.ts                   # Entry point do servidor Express
```

### Fluxo de Requisição (Backend)

```
1. [Client]
   │
   └─> POST /auth/register (email, password, ...)
       │
2. [Presentation Layer] auth.ts
   │ - Recebe requisição
   │ - Extrai dados do body/files (Multer)
   │ - Delega para Use Case
   │
   └─> CreateUser.execute({ name, cpf, ... })
       │
3. [Application Layer] CreateUser.ts
   │ - Valida todos os campos (validators.ts)
   │ - Verifica duplicidade (CPF, email)
   │ - Hash da senha (password.ts)
   │ - Chama repositório
   │
   └─> UserRepository.create({ ... })
       │
4. [Infrastructure Layer] SqliteUserRepository.ts
   │ - Executa INSERT no SQLite
   │ - Retorna User com ID gerado
   │
   └─> Retorna User
       │
5. [Presentation Layer] auth.ts
   │ - Gera JWT (signToken)
   │ - Remove passwordHash (toSafeUser)
   │ - Retorna JSON: { user, token }
   │
   └─> [Client] 201 Created
```

### Responsabilidades das Camadas

#### 1. Domain (Domínio)

- **Responsabilidade:** Definir as entidades e regras de negócio fundamentais.
- **Independência:** Não depende de nenhuma outra camada.
- **Exemplos:**
  - `User`: Entidade representando um usuário (Tutor, Veterinário, Admin)
  - `Pet`: Entidade representando um pet
  - `UserType`, `UserRole`, `PetSpecies`, `PetSex`: Tipos e enums

#### 2. Application (Aplicação)

- **Responsabilidade:** Orquestrar casos de uso (use cases), validações e lógica de negócios.
- **Independência:** Depende apenas da camada de Domain.
- **Exemplos:**
  - `CreateUser`: Valida dados, verifica duplicidade, cria usuário
  - `CreatePet`: Valida dados, cria pet vinculado a um tutor
  - `validators.ts`: Funções de validação reutilizáveis

#### 3. Infrastructure (Infraestrutura)

- **Responsabilidade:** Lidar com detalhes técnicos (banco de dados, arquivos, APIs externas).
- **Independência:** Depende de Domain e Application.
- **Exemplos:**
  - `db.ts`: Conexão e inicialização do SQLite
  - `SqliteUserRepository`: Implementação do padrão Repository para usuários
  - `SqlitePetRepository`: Implementação do padrão Repository para pets

#### 4. Presentation (Apresentação)

- **Responsabilidade:** Expor a API REST, lidar com requisições HTTP, autenticação e autorização.
- **Independência:** Depende de todas as outras camadas.
- **Exemplos:**
  - `auth.ts`: Rotas de autenticação (registro, login)
  - `admin.ts`: Rotas administrativas (CRUD de usuários)
  - `pets.ts`: Rotas de gestão de pets
  - `auth.ts` (middleware): Verificação de JWT

---

## Arquitetura do Frontend

O frontend é construído com **React** e segue uma arquitetura baseada em **componentes**, **Context API** para gerenciamento de estado global (autenticação) e **React Router** para navegação.

### Estrutura de Diretórios

```
frontend/src/
│
├── app/
│   ├── components/            # Componentes React
│   │   ├── LoginForm.tsx      # Formulário de login
│   │   ├── RegisterForm.tsx   # Formulário de registro
│   │   ├── Navbar.tsx         # Barra de navegação
│   │   ├── AdminUsersPage.tsx # Página de gestão de usuários (admin)
│   │   ├── AdminUserList.tsx  # Lista de usuários (admin)
│   │   ├── UserModal.tsx      # Modal de cadastro/edição de usuário
│   │   ├── PetsPage.tsx       # Página de gestão de pets (tutor)
│   │   ├── PetList.tsx        # Lista de pets
│   │   ├── PetModal.tsx       # Modal de cadastro/edição de pet
│   │   ├── PetForm.tsx        # Formulário de pet
│   │   └── Toast.tsx          # Componente de notificação
│   │
│   ├── providers/
│   │   └── AuthProvider.tsx   # Context de autenticação
│   │
│   └── routes/
│       └── AppRoutes.tsx      # Configuração de rotas
│
├── lib/
│   └── api.ts                 # Configuração de API (base URL, headers)
│
├── utils/
│   ├── brCPF.ts               # Validação e máscara de CPF
│   └── brPhone.ts             # Validação e máscara de telefone
│
├── styles/
│   └── global.css             # Estilos globais, variáveis CSS
│
├── types/
│   └── Pet.ts                 # Tipos TypeScript do domínio
│
├── main.tsx                   # Entry point da aplicação
└── vite-env.d.ts              # Tipos de ambiente Vite
```

### Fluxo de Autenticação (Frontend)

```
1. [User] Acessa /login
   │
2. [LoginForm.tsx]
   │ - Renderiza formulário
   │ - User digita email e senha
   │ - Clica em "Entrar"
   │
   └─> authContext.login(email, password)
       │
3. [AuthProvider.tsx]
   │ - POST /auth/login { email, password }
   │ - Recebe { user, token }
   │ - Salva token no localStorage
   │ - Atualiza estado: setUser(user), setToken(token)
   │
   └─> [React Router]
       │ - Detecta mudança de estado (user !== null)
       │ - Redireciona para "/"
       │
4. [AppRoutes.tsx]
   │ - Verifica autenticação (Protected)
   │ - User autenticado? Sim → renderiza Dashboard
   │ - User não autenticado? Não → redireciona para /login
   │
5. [Navbar.tsx]
   │ - Renderiza menu baseado em user.role e user.type
   │ - Admin: Mostra "Gerenciar usuários"
   │ - Tutor: Mostra "Meus Pets"
```

### Componentes Principais

#### 1. AuthProvider (Context API)

**Responsabilidade:** Gerenciar estado de autenticação global.

**Estado:**

- `user`: Dados do usuário autenticado (ou `null`)
- `token`: JWT armazenado no localStorage

**Métodos:**

- `login(email, password)`: Faz login e armazena token
- `register(formData)`: Registra novo usuário e faz login automático
- `logout()`: Remove token e limpa estado

**Uso:**

```typescript
const { user, token, login, logout } = useAuth();
```

#### 2. React Router (Navegação)

**Rotas Públicas:**

- `/login`: LoginForm
- `/register`: RegisterForm

**Rotas Protegidas:**

- `/`: Dashboard (Protected)
- `/pets`: PetsPage (TutorOnly)
- `/agenda`: Em desenvolvimento (Protected)
- `/financeiro`: Em desenvolvimento (Protected)
- `/admin/users`: AdminUsersPage (AdminOnly)

**Guardas de Rota:**

- `Protected`: Verifica se `user !== null`
- `AdminOnly`: Verifica se `user.role === 'admin'`
- `TutorOnly`: Verifica se `user.type === 'Tutor'`

#### 3. Toast (Notificações)

**Responsabilidade:** Exibir mensagens de sucesso, erro, aviso e informação.

**Tipos:**

- `success`: Operação bem-sucedida (verde)
- `error`: Erro (vermelho)
- `warning`: Aviso (amarelo)
- `info`: Informação (azul)

**Uso:**

```typescript
const toast = useToast();
toast.show('Usuário criado com sucesso!', 'success');
toast.show('CPF inválido', 'error');
```

---

## Comunicação Frontend-Backend

### Protocolo de Comunicação

- **Protocolo:** HTTP/HTTPS
- **Formato:** JSON (application/json) ou multipart/form-data (para uploads)
- **Autenticação:** JWT via header `Authorization: Bearer <token>`
- **Admin Key:** Header `x-admin-key: <secret>` para rotas administrativas

### Diagrama de Comunicação

```
┌─────────────┐                                    ┌─────────────┐
│  Frontend   │                                    │   Backend   │
│  (React)    │                                    │  (Express)  │
└──────┬──────┘                                    └──────┬──────┘
       │                                                  │
       │  1. POST /auth/register                         │
       │  Content-Type: multipart/form-data              │
       │  Body: { name, cpf, email, password, ... }      │
       ├────────────────────────────────────────────────>│
       │                                                  │
       │                    2. Valida dados              │
       │                    3. Hash de senha             │
       │                    4. Salva no SQLite           │
       │                    5. Gera JWT                  │
       │                                                  │
       │  6. 201 Created                                 │
       │  { user: {...}, token: "eyJ..." }               │
       │<────────────────────────────────────────────────┤
       │                                                  │
       │  7. Salva token no localStorage                 │
       │  8. Atualiza Context (setUser, setToken)        │
       │                                                  │
       │  9. GET /auth/me                                │
       │  Authorization: Bearer eyJ...                   │
       ├────────────────────────────────────────────────>│
       │                                                  │
       │                    10. Verifica JWT             │
       │                    11. Busca usuário no DB      │
       │                                                  │
       │  12. 200 OK                                     │
       │  { user: {...} }                                │
       │<────────────────────────────────────────────────┤
       │                                                  │
       │  13. GET /pets?name=&species=                   │
       │  Authorization: Bearer eyJ...                   │
       ├────────────────────────────────────────────────>│
       │                                                  │
       │                    14. Verifica JWT             │
       │                    15. Verifica role (Tutor)    │
       │                    16. Busca pets no DB         │
       │                                                  │
       │  17. 200 OK                                     │
       │  [ { id: 1, name: "Rex", ... }, ... ]           │
       │<────────────────────────────────────────────────┤
```

### Endpoints da API

#### Rotas Públicas (auth.ts)

| Método | Endpoint           | Descrição                         | Autenticação |
| ------- | ------------------ | ----------------------------------- | -------------- |
| POST    | `/auth/register` | Registrar novo usuário             | Não           |
| POST    | `/auth/login`    | Fazer login                         | Não           |
| GET     | `/auth/me`       | Obter dados do usuário autenticado | JWT            |

#### Rotas Administrativas (admin.ts)

| Método | Endpoint                  | Descrição                    | Autenticação |
| ------- | ------------------------- | ------------------------------ | -------------- |
| GET     | `/admin/users?type=&q=` | Listar usuários (com filtros) | Admin Key      |
| POST    | `/admin/users`          | Criar usuário                 | Admin Key      |
| PUT     | `/admin/users/:id`      | Atualizar usuário             | Admin Key      |
| DELETE  | `/admin/users/:id`      | Deletar usuário               | Admin Key      |

#### Rotas de Pets (pets.ts)

| Método | Endpoint                 | Descrição          | Autenticação |
| ------- | ------------------------ | -------------------- | -------------- |
| GET     | `/pets?name=&species=` | Listar pets do tutor | JWT (Tutor)    |
| POST    | `/pets`                | Criar pet            | JWT (Tutor)    |
| PUT     | `/pets/:id`            | Atualizar pet        | JWT (Tutor)    |
| DELETE  | `/pets/:id`            | Deletar pet          | JWT (Tutor)    |

#### Rotas de Agenda (agenda.ts)

| Método | Endpoint          | Descrição              | Autenticação |
| ------- | ----------------- | ------------------------ | -------------- |
| GET     | `/agenda?petId=` | Listar agendamentos     | JWT (Tutor)    |
| POST    | `/agenda`        | Criar agendamento       | JWT (Tuor)    |
| PUT     | `/agenda/:id`    | Atualizar agendamento   | JWT (Tutor)    |
| DELETE  | `/agenda/:id`    | Deletar agendamento     | JWT (Tutor)    |

#### Rotas de Registros de Saúde (registroSaude.ts)

| Método | Endpoint                        | Descrição                 | Autenticação |
| ------- | ------------------------------- | --------------------------- | -------------- |
| GET     | `/registros-saude?petId=&tipo=` | Listar registros de saúde | JWT (Tutor)    |
| POST    | `/registros-saude`             | Criar registro            | JWT (Tutor)    |
| PUT     | `/registros-saude/:id`         | Atualizar registro        | JWT (Tutor)    |
| DELETE  | `/registros-saude/:id`         | Deletar registro          | JWT (Tutor)    |

### Tratamento de Erros

#### Backend

```typescript
// Erro de validação (400)
if (errors) {
  const errorMessages = Object.entries(errors)
    .map(([field, msg]) => `${field}: ${msg}`)
    .join('; ');
  return res.status(400).json({ 
    message: errorMessages,
    errors 
  });
}

// Erro de autenticação (401)
if (!token) {
  return res.status(401).json({ message: 'Unauthorized' });
}

// Erro de autorização (403)
if (req.user.type !== 'Tutor') {
  return res.status(403).json({ message: 'Apenas tutor pode acessar pets' });
}

// Erro interno (500)
catch (e) {
  console.error('[ERROR]', e);
  return res.status(500).json({ message: 'InternalError' });
}
```

#### Frontend

```typescript
try {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  if (!res.ok) {
    const data = await res.json().catch(() => ({ message: 'Erro desconhecido' }));
    throw new Error(data.message || 'Falha ao fazer login');
  }
  
  const data = await res.json();
  // Sucesso...
} catch (e: any) {
  toast.show(e.message, 'error');
}
```

---

## Fluxos de Dados Principais

### Fluxo 1: Registro de Novo Usuário

```
[User] → [RegisterForm] → [AuthProvider] → [Backend /auth/register]
   ↓          ↓                ↓                      ↓
Preenche   Valida     Envia FormData      Valida + Hash + Salva
formulário  campos    + arquivos           no SQLite
   ↓          ↓                ↓                      ↓
Clica      Máscara    Recebe resposta     Gera JWT
"Criar     CPF/Phone  { user, token }
Conta"         ↓                ↓                      ↓
           Todos OK?   Salva no        Retorna 201 Created
           Não → Toast localStorage    ou 400/500 com erro
           Sim → POST      ↓                      ↓
                      setUser(user)        [RegisterForm]
                      setToken(token)      Recebe resposta
                           ↓                      ↓
                      Redireciona para "/"   Sucesso → Redireciona
                                             Erro → Toast
```

### Fluxo 2: Login de Usuário

```
[User] → [LoginForm] → [AuthProvider] → [Backend /auth/login]
   ↓          ↓              ↓                    ↓
Digita    Valida      POST { email,      Busca usuário
email +   campos      password }         no SQLite
senha         ↓              ↓                    ↓
   ↓      Todos OK?   Aguarda resposta  Verifica senha
Clica    Não → Toast      ↓              (bcrypt.compare)
"Entrar" Sim → POST   Recebe { user,         ↓
                      token }            Senha correta?
                           ↓              Não → 401
                      Salva no           Sim → Gera JWT
                      localStorage            ↓
                           ↓              Retorna 200 OK
                      setUser(user)      { user, token }
                      setToken(token)         ↓
                           ↓              [LoginForm]
                      Redireciona        Recebe resposta
                      para "/"                ↓
                                         Sucesso → Redireciona
                                         Erro → Toast
```

### Fluxo 3: Criação de Pet pelo Tutor

```
[Tutor] → [PetsPage] → [PetModal] → [PetForm] → [Backend /pets]
   ↓          ↓            ↓            ↓              ↓
Clica     Abre modal  Renderiza    Preenche     POST /pets
"Cadastrar              formulário  dados +      Authorization: Bearer <JWT>
Pet"                        ↓        foto              ↓
                       Upload de         ↓        Middleware requireAuth
                       foto (preview)    ↓        verifica JWT + Tutor
                            ↓        Clica             ↓
                       Valida campos "Salvar"    CreatePet.execute()
                       obrigatórios      ↓              ↓
                            ↓        FormData     Valida campos
                       Todos OK?    enviado           ↓
                       Não → Desabilita         Salva pet no SQLite
                             botão              (ownerId = user.id)
                       Sim → Habilita           ↓
                             botão         Salva foto em /uploads
                                                 ↓
                                           Retorna 201 Created
                                           { id, name, ... }
                                                 ↓
                                           [PetForm]
                                           Recebe resposta
                                                 ↓
                                           Sucesso → Fecha modal
                                                  → Atualiza lista
                                                  → Toast "Pet criado!"
                                           Erro → Toast com mensagem
```

### Fluxo 4: Gestão de Usuários pelo Admin

```
[Admin] → [AdminUsersPage] → [UserModal] → [Backend /admin/users]
   ↓            ↓                  ↓                    ↓
Acessa     Renderiza lista   Abre modal       GET /admin/users
"Gerenciar  de usuários      para criar/      x-admin-key: <secret>
usuários"        ↓            editar usuário        ↓
             Filtros:              ↓            Busca usuários no SQLite
             - Tipo             Preenche        com filtros (type, q)
             - Nome/CPF         formulário           ↓
                  ↓                  ↓            Retorna 200 OK
             Clica "Refresh"   Clica "Salvar"  [ { id, name, ... }, ... ]
                  ↓                  ↓                    ↓
             Recarrega lista   FormData        [AdminUsersPage]
                  ↓            enviado         Renderiza lista
             Clica "Editar"         ↓                    ↓
                  ↓            POST ou PUT     Clica "Cadastrar"
             Abre modal       /admin/users         ↓
             preenchido       x-admin-key     Abre modal vazio
                  ↓                  ↓                    ↓
             Clica "Deletar"  Valida + Salva  Preenche e envia
                  ↓            no SQLite            ↓
             Confirmação          ↓            POST /admin/users
             "Tem certeza?"  Retorna 201/200      ↓
                  ↓                  ↓          Usuário criado
             Clica "OK"      [UserModal]            ↓
                  ↓            Recebe resposta  Toast "Usuário criado!"
             DELETE           Sucesso → Fecha      ↓
             /admin/users/:id      modal       Atualiza lista
             x-admin-key          ↓
                  ↓            Atualiza lista
             Usuário          Toast feedback
             deletado
```

---

## Padrões de Design Utilizados

### 1. Repository Pattern (Padrão Repositório)

**Objetivo:** Abstrair o acesso a dados, desacoplando a lógica de negócios da implementação do banco de dados.

**Implementação:**

- **Interface:** `UserRepository`, `PetRepository` (em `infrastructure/repositories/`)
- **Implementação Concreta:** `SqliteUserRepository`, `SqlitePetRepository`

**Vantagens:**

- Facilita testes (mock de repositórios)
- Permite trocar o banco de dados (ex: SQLite → PostgreSQL) sem alterar casos de uso
- Centraliza consultas SQL em um único lugar

**Exemplo:**

```typescript
// Interface
export interface UserRepository {
  create(user: User): User;
  findById(id: number): User | null;
  findByCPF(cpf: string): User | null;
  findByEmail(email: string): User | null;
  findAll(filters?: { type?: UserType; q?: string }): User[];
  update(id: number, data: Partial<User>): User;
  delete(id: number): void;
}

// Implementação SQLite
export class SqliteUserRepository implements UserRepository {
  create(user: User): User {
    const stmt = db.prepare(`INSERT INTO users (...) VALUES (...)`);
    const result = stmt.run(...);
    return { ...user, id: result.lastInsertRowid as number };
  }
  // ...
}

// Uso no caso de uso
export class CreateUser {
  constructor(private readonly repo: UserRepository) {}
  
  execute(input: CreateUserInput): User {
    // Valida...
    const user = this.repo.create({ ... });
    return user;
  }
}
```

### 2. Dependency Injection (Injeção de Dependência)

**Objetivo:** Reduzir acoplamento entre classes, facilitando testes e manutenção.

**Implementação:**

- Os casos de uso recebem repositórios via construtor
- As rotas instanciam repositórios e casos de uso

**Exemplo:**

```typescript
// Caso de uso
export class CreatePet {
  constructor(private readonly repo: PetRepository) {}
  
  execute(input: CreatePetInput): Pet {
    // ...
    return this.repo.create(pet);
  }
}

// Rota
petsRouter.post('/', (req, res) => {
  const repo = new SqlitePetRepository();  // Instância concreta
  const create = new CreatePet(repo);      // Injeção de dependência
  const created = create.execute({ ... });
  res.status(201).json(created);
});
```

### 3. Single Responsibility Principle (SRP)

**Objetivo:** Cada classe/função deve ter uma única responsabilidade.

**Implementação:**

- **Validadores:** Separados em `validators.ts` (isValidCPF, isValidEmail, etc.)
- **Password:** Hash e verificação em `password.ts`
- **Use Cases:** Um caso de uso por operação (CreateUser, UpdateUser, DeleteUser)
- **Repositories:** Apenas acesso a dados (sem lógica de negócios)

**Exemplo:**

```typescript
// validators.ts - APENAS validações
export function isValidCPF(cpf: string): boolean { /* ... */ }
export function isValidEmail(email: string): boolean { /* ... */ }

// password.ts - APENAS hash e verificação
export function hashPassword(plain: string): string { /* bcrypt */ }
export function verifyPassword(plain: string, hash: string): boolean { /* bcrypt */ }

// CreateUser.ts - APENAS lógica de criação de usuário
export class CreateUser {
  execute(input: CreateUserInput): User {
    // Valida usando validators.ts
    // Hash usando password.ts
    // Cria usando repo
  }
}
```

### 4. Factory Pattern (Padrão Fábrica)

**Objetivo:** Centralizar a criação de objetos complexos.

**Implementação:**

- Função `signToken()` em `auth.ts` encapsula a criação de JWT
- Função `toSafeUser()` cria uma versão segura do usuário 

**Exemplo:**

```typescript
function signToken(payload: any): string {
  const secret = process.env.JWT_SECRET || 'dev-secret';
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

function toSafeUser(u: any) {
  const { passwordHash, ...safe } = u || {};
  return safe;
}
```

### 5. Middleware Pattern (Padrão Middleware)

**Objetivo:** Adicionar funcionalidades de forma modular (autenticação, logging, validação).

**Implementação:**

- `requireAuth`: Verifica JWT e adiciona `req.user`
- Request logger: Registra todas as requisições
- Error handler: Captura erros não tratados

**Exemplo:**

```typescript
// Middleware de autenticação
export function requireAuth(req, res, next) {
  const token = extractToken(req.header('authorization'));
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  
  const payload = jwt.verify(token, secret);
  const user = repo.findById(payload.id);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });
  
  req.user = { id: user.id, role: user.role, type: user.type };
  next();  // Passa para o próximo middleware ou rota
}

// Uso
petsRouter.use(requireAuth);  // Todas as rotas de pets exigem autenticação
```

### 6. Context API Pattern (React)

**Objetivo:** Compartilhar estado global (autenticação) entre componentes sem prop drilling.

**Implementação:**

- `AuthProvider` encapsula lógica de autenticação
- `useAuth()` hook para acessar contexto

**Exemplo:**

```typescript
// Provider
export function AuthProvider({ children }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  
  // Métodos login, logout, register...
  
  const value = useMemo(() => ({ user, token, login, logout, register }), [user, token]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}

// Uso em componente
function MyComponent() {
  const { user, logout } = useAuth();
  return <button onClick={logout}>Sair ({user?.name})</button>;
}
```

---

## Segurança e Autenticação

### 1. Autenticação JWT (JSON Web Token)

**Fluxo:**

1. User faz login com email e senha
2. Backend verifica credenciais
3. Backend gera JWT assinado com `JWT_SECRET` contendo `{ id, role }`
4. Frontend armazena JWT no `localStorage`
5. Frontend envia JWT em todas as requisições autenticadas via header `Authorization: Bearer <token>`
6. Backend verifica assinatura do JWT e extrai dados do usuário

**Estrutura do JWT:**

```json
{
  "id": 1,
  "role": "user",
  "iat": 1699999999,
  "exp": 1700604799
}
```

**Verificação:**

```typescript
const secret = process.env.JWT_SECRET || 'dev-secret';
const payload = jwt.verify(token, secret) as any;
// Se o token for inválido ou expirado, jwt.verify() lança erro
```

### 2. Hash de Senhas com Bcrypt

**Armazenamento:**

- Senhas **NUNCA** são armazenadas em texto plano
- Bcrypt gera hash com salt automático (custo 10)

**Exemplo:**

```typescript
import bcrypt from 'bcrypt';

// Hash
export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, 10);
}

// Verificação
export function verifyPassword(plain: string, hash: string): boolean {
  return bcrypt.compareSync(plain, hash);
}
```

### 3. Validações e Sanitização

**Client-side (Frontend):**

- Validação de formato (CPF, email, telefone)
- Máscaras automáticas (CPF: 000.000.000-00, Telefone: (00) 00000-0000)
- Validação de senha forte (8-12 chars, maiúscula, número, especial)

**Server-side (Backend):**

- Revalidação de **todos** os campos (nunca confiar no cliente)
- Normalização de CPF (remove máscara antes de salvar)
- Verificação de duplicidade (CPF, email)
- Validação de arquivos (tipo, tamanho)

### 4. Controle de Acesso Baseado em Roles (RBAC)

**Roles:**

- `admin`: Acesso total ao sistema
- `user`: Acesso básico (Tutor ou Veterinário)

**Tipos de Usuário:**

- `Tutor`: Pode gerenciar pets
- `Veterinário`: Pode acessar consultas (futuro)

**Middleware de Autorização:**

```typescript
// Apenas admin
if (req.user.role !== 'admin') {
  return res.status(403).json({ message: 'Forbidden' });
}

// Apenas tutor
if (req.user.type !== 'Tutor') {
  return res.status(403).json({ message: 'Apenas tutor pode acessar pets' });
}
```

### 5. Admin Key (Chave de Administrador)

**Objetivo:** Proteger rotas administrativas de acesso não autorizado.

**Implementação:**

- Rotas `/admin/*` exigem header `x-admin-key: <secret>`
- Valor definido em `.env` (`ADMIN_KEY`)

**Exemplo:**

```typescript
const adminKey = req.header('x-admin-key');
if (adminKey !== process.env.ADMIN_KEY) {
  return res.status(403).json({ message: 'Forbidden' });
}
```

**Observação:** Em produção, considere usar OAuth2 ou uma solução mais robusta.

### 6. CORS (Cross-Origin Resource Sharing)

**Configuração:**

```typescript
import cors from 'cors';
app.use(cors());  // Permite requisições de qualquer origem
```

**Em Produção:** Configurar origens específicas:

```typescript
app.use(cors({
  origin: ['https://meu-pet.vercel.app'],
  credentials: true,
}));
```

---

## Banco de Dados e Persistência

### Escolha do SQLite

**Vantagens:**

- Sem necessidade de servidor de banco de dados separado
- Ideal para desenvolvimento local e protótipos
- Transações ACID
- Suporte a foreign keys e índices

**Desvantagens (Produção):**

- Não suporta múltiplas escritas simultâneas
- Não é adequado para ambientes distribuídos
- Escalabilidade limitada

**Alternativa Recomendada para Produção:** PostgreSQL (via Supabase, Railway, Heroku)

### Esquema do Banco de Dados

```sql
-- Tabela de Usuários
CREATE TABLE users (
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
CREATE INDEX idx_users_cpf ON users(cpf);

-- Tabela de Pets
CREATE TABLE pets (
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
CREATE INDEX idx_pets_owner ON pets(ownerId);
CREATE INDEX idx_pets_created ON pets(createdAt DESC);
```

### Relacionamentos

```
users (1) ──────────< (N) pets
  id                   ownerId (FK)
                          │
                          ├────────< (N) agenda
                          │           petId (FK)
                          │
                          └────────< (N) registros_saude
                                      petId (FK)
```

**Relacionamentos:**
- **Um usuário (Tutor)** pode ter **vários pets**
- **Um pet** pertence a **apenas um tutor**
- **Um pet** pode ter **vários agendamentos**
- **Um pet** pode ter **vários registros de saúde**

**Cascata de Deleção:**
- **Ao deletar um usuário**, todos os seus pets são deletados automaticamente (`ON DELETE CASCADE`)
- **Ao deletar um pet**, todos os seus agendamentos e registros de saúde são deletados automaticamente (`ON DELETE CASCADE`)

### Migrações e Versionamento

**Atualmente:** Migrations automáticas no `db.ts` (executado ao iniciar o servidor).

**Para Produção:**

- Usar ferramentas de migração: `knex`, `prisma migrate`, `typeorm`
- Versionamento de schema
- Rollback de migrations

---

## Deploy e Infraestrutura

### Ambiente de Desenvolvimento

```
┌──────────────────────────────────────────────────────┐
│                   localhost                          │
│                                                      │
│  Frontend (Vite Dev Server)    Backend (ts-node-dev) │
│  http://localhost:5173         http://localhost:3001 │
│         │                              │              │
│         └─────── API Calls ────────────┘              │
│                                                      │
│  SQLite: backend/data/app.db                         │
│  Uploads: backend/uploads/                           │
└──────────────────────────────────────────────────────┘
```

### Ambiente Docker (Isolado)

```
┌──────────────────────────────────────────────────────┐
│               Docker Containers                      │
│                                                      │
│  Frontend (Nginx)              Backend (Node.js)     │
│  Container: meu_pet-frontend   Container: meu_pet-backend │
│  Port: 8088 → 8080             Port: 3001 → 3001     │
│         │                              │              │
│         │  /api/* → proxy_pass → http://backend:3001 │
│         └──────────────────────────────┘              │
│                                                      │
│  Volumes:                                            │
│  - ./backend/data → /usr/src/app/backend/data        │
│  - ./backend/uploads → /usr/src/app/uploads          │
└──────────────────────────────────────────────────────┘

User Browser: http://localhost:8088
```

**Vantagens:**

- Ambiente isolado e reproduzível
- Fácil compartilhamento entre equipe
- Simula ambiente de produção

### Deploy em Produção

#### Frontend: Vercel

```
┌───────────────────────────────────────────┐
│           Vercel CDN (Edge Network)       │
│                                           │
│  https://meu-pet.vercel.app               │
│  ├── index.html                           │
│  ├── assets/                              │
│  │   ├── index-abc123.js                  │
│  │   └── index-def456.css                 │
│  └── favicon.ico                          │
│                                           │
│  Environment Variables:                   │
│  VITE_API_URL=https://api.example.com     │
└───────────────────────────────────────────┘
```

#### Backend: Railway / Render / Heroku

```
┌───────────────────────────────────────────┐
│        Cloud Platform (Railway)           │
│                                           │
│  https://api.example.com                  │
│  ├── Express.js App                       │
│  ├── SQLite (ou PostgreSQL)               │
│  └── /uploads (ou S3/Blob Storage)        │
│                                           │
│  Environment Variables:                   │
│  JWT_SECRET=<secret>                      │
│  ADMIN_KEY=<secret>                       │
│  DATABASE_URL=<postgres-url> (opcional)   │
└───────────────────────────────────────────┘
```

**Comunicação:**

```
User Browser
   │
   ├─> https://meu-pet.vercel.app (Frontend - Vercel CDN)
   │       │
   │       └─> https://api.example.com (Backend - Railway)
   │               │
   │               └─> PostgreSQL Database
   │
   └─> Assets carregados do CDN (baixa latência)
```

---

## Testes e Qualidade

### Testes End-to-End (E2E) com Selenium

**Objetivo:** Validar fluxos completos do usuário, simulando interações reais no navegador.

**Ferramentas:**

- Selenium WebDriver (Python)
- Chrome/ChromeDriver

**Cobertura:**

1. **test_register_login.py**: Registro e autenticação
2. **test_pets_flow.py**: Gestão de pets
3. **test_agenda_flow.py**: Gestão de agenda (agendamentos)
4. **test_registrosaude_flow.py**: Gestão de registros de saúde
5. **test_admin_users_flow.py**: Gestão de usuários (admin)

**Exemplo de Teste:**

```python
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

driver = webdriver.Chrome()
driver.get('http://localhost:5173/register')

# Preencher formulário
driver.find_element(By.CSS_SELECTOR, 'input[name="name"]').send_keys('João Silva')
driver.find_element(By.CSS_SELECTOR, 'input[name="cpf"]').send_keys('12345678901')
# ...

# Clicar em "Criar Conta"
driver.find_element(By.CSS_SELECTOR, 'button[type="submit"]').click()

# Aguardar redirecionamento para dashboard
WebDriverWait(driver, 10).until(EC.url_contains('/'))

assert 'Olá, João Silva!' in driver.page_source
driver.quit()
```

### Tipos de Testes Implementados

| Tipo         | Descrição                              | Ferramenta   | Status          |
| ------------ | ---------------------------------------- | ------------ | --------------- |
| E2E          | Fluxos completos (registro, login, CRUD) | Selenium     | ✅ Implementado |
| Unitário    | Funções individuais (validators, hash) | Jest/Vitest  | ⏳ Futuro       |
| Integração | Rotas da API                             | Supertest    | ⏳ Futuro       |
| Performance  | Carga e stress                           | k6/Artillery | ⏳ Futuro       |

### Boas Práticas de Testes

1. **Isolamento:** Cada teste deve ser independente (não depender de outros testes)
2. **Dados Aleatórios:** Usar CPF/email/telefone aleatórios para evitar conflitos
3. **Seletores Estáveis:** Usar `data-testid` em vez de classes CSS (que podem mudar)
4. **Waits Explícitos:** Sempre aguardar elementos carregarem antes de interagir
5. **Cleanup:** Deletar dados criados pelos testes (ou usar banco de teste separado)

---

## Escalabilidade e Evolução

### Limitações Atuais

1. **SQLite:** Não adequado para produção com múltiplas instâncias
2. **Upload de Arquivos:** Armazenados localmente (não escalável)
3. **Sem Cache:** Todas as requisições vão direto ao banco
4. **Sem Fila de Jobs:** Tarefas assíncronas bloqueiam requisições

### Roadmap de Evolução

#### Fase 1: Banco de Dados em Produção

- Migrar SQLite → PostgreSQL
- Usar ORM (Prisma, TypeORM)
- Connection pooling

#### Fase 2: Armazenamento de Arquivos

- Integrar com S3 / Azure Blob Storage / Cloudinary
- CDN para servir imagens de pets

#### Fase 3: Cache

- Redis para cache de sessões e dados frequentes
- Cache de queries (ex: lista de pets)

#### Fase 4: Filas e Background Jobs

- RabbitMQ / BullMQ para tarefas assíncronas
- Exemplo: envio de emails, processamento de imagens

#### Fase 5: Observabilidade

- Logging estruturado (Winston, Pino)
- Monitoramento (Datadog, New Relic)
- Alertas de erros (Sentry)

#### Fase 6: Microserviços (se necessário)

- Separar backend em serviços:
  - Auth Service
  - User Service
  - Pet Service
  - Notification Service

---

## Conclusão

A arquitetura do **Meu Pet em Dia** foi projetada com foco em:

✅ **Manutenibilidade:** Código organizado em camadas bem definidas
✅ **Testabilidade:** Desacoplamento via Repository Pattern e Dependency Injection
✅ **Segurança:** JWT, hash de senhas, validações server-side
✅ **Escalabilidade:** Facilita migração para banco relacional robusto
✅ **Qualidade:** Testes E2E automatizados com Selenium

Para dúvidas ou sugestões de melhoria, consulte o **GUIA_IMPLEMENTACAO.md** ou abra uma issue no GitHub.

---

**Última atualização:** 2025-11-05
