# 🐾 Meu Pet em Dia

Sistema completo de gestão de saúde para pets, conectando tutores e veterinários em uma plataforma moderna e intuitiva.

## 📋 Sobre o Projeto

**Meu Pet em Dia** é uma aplicação web fullstack que facilita o acompanhamento da saúde dos pets, permitindo que tutores gerenciem informações de seus animais e veterinários ofereçam seus serviços profissionais.

### ✨ Funcionalidades Principais

- 🔐 **Autenticação Completa**: Sistema de login e registro com JWT
- 👥 **Dois Tipos de Usuário**: 
  - **Tutores**: Responsáveis pelos pets
  - **Veterinários**: Profissionais de saúde animal (com CRMV)
- 🎨 **Interface Moderna**: Design responsivo para desktop e mobile
- 🔒 **Segurança**: Senhas criptografadas com bcrypt
- 📱 **Validações Brasileiras**: CPF e telefone com máscaras automáticas
- 🌐 **API RESTful**: Backend robusto com Express.js

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18** + **TypeScript**
- **Vite** - Build tool
- **React Router** - Navegação
- **Context API** - Gerenciamento de estado
- **CSS Modules** - Estilização com variáveis CSS

### Backend
- **Node.js** + **Express**
- **TypeScript**
- **SQLite** (`better-sqlite3`) - Banco de dados local
- **JWT** - Autenticação
- **Bcrypt** - Criptografia de senhas
- **Multer** - Upload de arquivos

### Arquitetura
- **Domain-Driven Design (DDD)**
- **Repository Pattern**
- **Single Responsibility Principle (SRP)**
- **Clean Architecture**

## 📁 Estrutura do Projeto

```
meu_pet/
├── frontend/                 # Aplicação React
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/  # Componentes React
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── RegisterForm.tsx
│   │   │   │   ├── Navbar.tsx
│   │   │   │   ├── Toast.tsx
│   │   │   │   └── ...
│   │   │   ├── providers/   # Context Providers
│   │   │   │   └── AuthProvider.tsx
│   │   │   └── routes/      # Configuração de rotas
│   │   │       └── AppRoutes.tsx
│   │   ├── lib/             # Configurações
│   │   │   └── api.ts
│   │   ├── utils/           # Utilitários
│   │   │   ├── brCPF.ts
│   │   │   └── brPhone.ts
│   │   ├── styles/          # Estilos globais
│   │   │   └── global.css
│   │   └── types/           # Tipos TypeScript
│   │       └── User.ts
│   └── package.json
│
├── backend/                 # API Express
│   ├── src/
│   │   ├── domain/          # Entidades de domínio
│   │   │   └── User.ts
│   │   ├── application/     # Casos de uso
│   │   │   ├── CreateUser.ts
│   │   │   ├── UpdateUser.ts
│   │   │   ├── validators.ts
│   │   │   └── password.ts
│   │   ├── infrastructure/  # Camada de infraestrutura
│   │   │   ├── db.ts
│   │   │   └── repositories/
│   │   │       ├── UserRepository.ts
│   │   │       └── SqliteUserRepository.ts
│   │   ├── presentation/    # Camada de apresentação
│   │   │   └── routes/
│   │   │       ├── auth.ts
│   │   │       └── admin.ts
│   │   └── index.ts         # Entry point
│   ├── data/                # Banco de dados SQLite
│   │   └── app.db
│   └── package.json
│
└── README.md
```

## 🚀 Como Executar

### Pré-requisitos

- Node.js 18+ instalado
- NPM ou Yarn

### 1️⃣ Configuração do Backend

```powershell
# Entrar na pasta do backend
cd backend

# Instalar dependências
npm install

# Criar arquivo .env na raiz do backend
# Adicione as seguintes variáveis:
PORT=3001
JWT_SECRET=seu_jwt_secret_aqui_muito_seguro_123
ADMIN_KEY=sua_chave_admin_aqui_123

# Iniciar servidor de desenvolvimento
npm run dev
```

O backend estará rodando em `http://localhost:3001`

### 2️⃣ Configuração do Frontend

```powershell
# Abrir novo terminal e entrar na pasta do frontend
cd frontend

# Instalar dependências
npm install

# Criar arquivo .env.local na raiz do frontend (opcional)
# Se não criar, usará valores padrão
VITE_API_URL=http://localhost:3001
VITE_ADMIN_KEY=sua_chave_admin_aqui_123

# Iniciar aplicação
npm run dev
```

O frontend estará rodando em `http://localhost:5173`

## 📝 Uso da Aplicação

### Registro de Novo Usuário

1. Acesse a tela de **Criar Conta**
2. Escolha o tipo de perfil:
   - **Tutor**: Responsável por pets
   - **Veterinário**: Profissional com CRMV
3. Preencha os dados obrigatórios:
   - Nome completo
   - Email
   - CPF (com máscara automática)
   - Telefone (com máscara automática)
   - Senha (8 a 12 caracteres)
4. **Se Veterinário**, preencha também:
   - CRMV
   - Upload de documento comprobatório
5. Clique em **Criar Conta**
6. Será redirecionado automaticamente para o dashboard

### Login

1. Acesse a tela de **Login**
2. Insira seu email e senha
3. Clique em **Entrar**
4. Será redirecionado para o dashboard

## 🎨 Identidade Visual

### Paleta de Cores

- **Primary**: `#FF6B9D` (Rosa vibrante - amor aos pets)
- **Secondary**: `#4ECDC4` (Turquesa - saúde e bem-estar)
- **Accent**: `#FFD93D` (Amarelo - energia e alegria)
- **Success**: `#6BCF7F` (Verde)
- **Warning**: `#FFB84D` (Laranja)
- **Error**: `#FF6B6B` (Vermelho)

### Tipografia

- **Primary**: Poppins (títulos e destaques)
- **Secondary**: Inter (textos gerais)

### Responsividade

- Mobile: até 768px
- Tablet: 769px - 1024px
- Desktop: 1025px+

## 🔐 Segurança

- ✅ Senhas criptografadas com bcrypt (salt rounds: 10)
- ✅ Autenticação via JWT com expiração de 7 dias
- ✅ Validação de dados no frontend e backend
- ✅ Proteção de rotas administrativas com `x-admin-key`
- ✅ Upload de arquivos com Multer (máx 5MB)
- ✅ CORS configurado para ambiente de desenvolvimento

## 📡 Endpoints da API

### Autenticação (`/auth`)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/auth/register` | Registrar novo usuário (Tutor ou Veterinário) |
| POST | `/auth/login` | Login de usuário |
| GET | `/auth/me` | Obter dados do usuário autenticado |

### Administração (`/admin`) - Requer `x-admin-key`

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/admin/users` | Criar usuário (admin) |
| GET | `/admin/users` | Listar todos os usuários |
| GET | `/admin/users/:id` | Obter usuário por ID |
| PUT | `/admin/users/:id` | Atualizar usuário |
| DELETE | `/admin/users/:id` | Deletar usuário |

## 🗄️ Modelo de Dados

### Tabela: `users`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | TEXT | UUID único |
| name | TEXT | Nome completo |
| email | TEXT | Email (único) |
| cpf | TEXT | CPF (único) |
| phone | TEXT | Telefone |
| password_hash | TEXT | Senha criptografada |
| user_type | TEXT | 'tutor' ou 'veterinario' |
| role | TEXT | 'user' ou 'admin' |
| crmv | TEXT | CRMV (apenas veterinários) |
| crmv_doc_path | TEXT | Caminho do documento |
| created_at | TEXT | Data de criação |
| updated_at | TEXT | Data de atualização |

## 🧪 Validações

### CPF
- Formato: `000.000.000-00`
- Validação: 11 dígitos numéricos
- Máscara automática no frontend

### Telefone
- Formato: `(00) 00000-0000`
- Validação: DDD + 9 dígitos
- Máscara automática no frontend

### Senha
- Comprimento: 8 a 12 caracteres
- Validação em tempo real no frontend

### Email
- Validação de formato padrão
- Verificação de unicidade no backend

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'feat: Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

## 👨‍💻 Desenvolvido por

**Junior Santos** - [GitHub](https://github.com/junior875)

---

⭐ Se este projeto foi útil para você, considere dar uma estrela!
