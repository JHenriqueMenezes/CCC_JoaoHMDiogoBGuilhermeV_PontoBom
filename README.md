# 🍕 PontoBom — Sistema de Pedidos

Projeto acadêmico — UPF 2026  
**Stack:** React.js 18 · Node.js 20 · Express 4 · PostgreSQL 16 · Prisma 5

---

## 📁 Estrutura do Projeto

```
pontobom/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Modelo completo do banco de dados
│   │   └── migrations/
│   │       └── 0001_init.sql      # SQL para criar todas as tabelas
│   ├── src/
│   │   ├── server.js              # Inicia o servidor
│   │   └── app.js                 # Configura o Express
│   ├── .env.example               # Variáveis de ambiente necessárias
│   └── package.json
└── frontend/
    ├── src/
    │   ├── pages/                 # Telas (implementar semana 2+)
    │   ├── components/            # Componentes reutilizáveis
    │   ├── contexts/              # Contextos React
    │   ├── lib/                   # Utilitários (axios, etc.)
    │   └── App.jsx
    ├── .env.example
    └── package.json
```

---

## 🚀 Como rodar

### 1. Banco de dados

Abra o terminal e crie o banco:

```bash
psql -U postgres -c "CREATE DATABASE pontobom;"
```

Execute a migration:

```bash
psql -U postgres -d pontobom -f backend/prisma/migrations/0001_init.sql
```

Isso cria todas as tabelas e um admin padrão:

- **E-mail:** `admin@pontobom.com`
- **Senha:** `admin123`

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edite o .env com suas credenciais do PostgreSQL
npm install
npx prisma generate
npm run dev
```

Teste em: `http://localhost:3001/health`

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Acesse: `http://localhost:5173`

---

## 📅 Cronograma

| Semana | Datas         | Entrega                                   | Status |
| ------ | ------------- | ----------------------------------------- | ------ |
| 1      | 14/04 a 20/04 | Configuração do ambiente e banco de dados | ✅     |
| 2      | 21/04 a 27/04 | UC01 – Login e Cadastro                   | ⏳     |
| 3      | 28/04 a 04/05 | UC02 – Cardápio Admin                     | ⏳     |
| 4      | 05/05 a 11/05 | UC03/04 – Cardápio + Carrinho             | ⏳     |
| 5      | 12/05 a 18/05 | UC04 – Pagamento + Asaas                  | ⏳     |
| 6      | 19/05 a 25/05 | UC05 – Gerenciar Pedidos                  | ⏳     |
| 7      | 26/05 a 01/06 | UC06 – Acompanhamento                     | ⏳     |
| 8      | 02/06 a 08/06 | Testes e validação                        | ⏳     |

---

## 👥 Equipe

- Diogo Brollo
- Guilherme Vieira
- João Henrique Menezes

**Universidade de Passo Fundo — UPF, 2026**
