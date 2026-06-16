# PontoBom — Sistema de Pedidos

Projeto acadêmico — UPF 2026  
**Stack:** React 19 · Node.js 20 · Express 4 · PostgreSQL (Neon) · Prisma 5

---

## Estrutura do Projeto

```
pontobom/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Modelo do banco de dados
│   │   └── migrations/
│   │       └── 0001_init.sql      # Migration inicial
│   ├── src/
│   │   ├── controllers/           # auth, cardapio, admin, pedido
│   │   ├── routes/                # Roteadores Express
│   │   ├── middlewares/           # JWT, upload (Cloudinary/multer)
│   │   ├── services/whatsapp/     # Integrações Z-API e Meta Business
│   │   ├── lib/prisma.js          # Singleton do Prisma client
│   │   ├── app.js                 # Configuração Express + CORS
│   │   └── server.js              # Entry point
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── pages/                 # Telas da aplicação
    │   ├── components/            # Componentes reutilizáveis
    │   ├── context/               # AuthContext, CartContext
    │   ├── services/api.js        # Instância Axios configurada
    │   └── App.jsx                # Rotas e guards (RotaAdmin)
    ├── .env.example
    └── package.json
```

---

## Como rodar localmente

### 1. Backend

```bash
cd backend
cp .env.example .env
# Preencha o .env com as credenciais (ver seção Variáveis de Ambiente)
npm install
npm run db:generate
npm run dev
```

Teste em: `http://localhost:3001/health`

### 2. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Acesse: `http://localhost:5173`

---

## Variáveis de Ambiente

### Backend (`.env`)

```env
DATABASE_URL=
PORT=3001
FRONTEND_URL=
JWT_SECRET=
WHATSAPP_PROVIDER=   # ZAPI ou META
ZAPI_INSTANCE_ID=
ZAPI_TOKEN=
ZAPI_CLIENT_TOKEN=
META_PHONE_ID=
META_ACCESS_TOKEN=
META_API_VERSION=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
ASAAS_API_KEY=
ASAAS_BASE_URL=
```

### Frontend (`.env`)

```env
VITE_API_URL=http://localhost:3001
```

---

## Credenciais padrão (admin)

- **E-mail:** `admin@pontobom.com`
- **Senha:** `admin123`

---

## Comandos úteis

### Backend

```bash
npm run dev          # Inicia com nodemon (porta 3001)
npm start            # Inicia em produção
npm run db:migrate   # Executa a migration SQL
npm run db:generate  # Regenera o Prisma client após mudanças no schema
npm run db:studio    # Abre o Prisma Studio
```

### Frontend

```bash
npm run dev          # Servidor de desenvolvimento Vite (porta 5173)
npm run build        # Build de produção
npm run lint         # Verificação ESLint
npm run preview      # Preview do build de produção
```

---

## Integrações Externas

| Serviço | Finalidade |
|---|---|
| Neon (PostgreSQL) | Banco de dados cloud |
| Cloudinary | Imagens dos itens do cardápio |
| Z-API / Meta Business | Envio de OTP via WhatsApp |
| Asaas | Gateway de pagamento |

---

## Deploy

| Camada | Plataforma |
|---|---|
| Frontend | Vercel |
| Backend | Railway |
| Banco de dados | Neon |

---

## Cronograma

| Semana | Datas         | Entrega                                   | Status |
| ------ | ------------- | ----------------------------------------- | ------ |
| 1      | 14/04 a 20/04 | Configuração do ambiente e banco de dados | ✅     |
| 2      | 21/04 a 27/04 | UC01 – Login e Cadastro                   | ✅     |
| 3      | 28/04 a 04/05 | UC02 – Cardápio Admin                     | ✅     |
| 4      | 05/05 a 11/05 | UC03/04 – Cardápio + Carrinho             | ✅     |
| 5      | 12/05 a 18/05 | UC04 – Pagamento + Asaas                  | ✅     |
| 6      | 19/05 a 25/05 | UC05 – Gerenciar Pedidos                  | ✅     |
| 7      | 26/05 a 01/06 | UC06 – Acompanhamento                     | ✅     |
| 8      | 02/06 a 08/06 | Testes e validação                        | ✅     |

---

## Equipe

- Diogo Brollo
- Guilherme Vieira
- João Henrique Menezes

**Universidade de Passo Fundo — UPF, 2026**
