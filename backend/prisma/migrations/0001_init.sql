-- Migration: 0001_init
-- Execute: psql -U postgres -d pontobom -f prisma/migrations/0001_init.sql

CREATE TYPE "Role" AS ENUM ('ADMIN', 'CLIENTE');
CREATE TYPE "FormaPagamento" AS ENUM ('AVISTA', 'ASAAS');
CREATE TYPE "StatusPedido" AS ENUM ('RECEBIDO', 'ACEITO', 'EM_PREPARO', 'PRONTO_PARA_RETIRADA', 'FINALIZADO', 'RECUSADO');

CREATE TABLE "usuarios" (
  "id"        SERIAL PRIMARY KEY,
  "nome"      TEXT,
  "telefone"  TEXT UNIQUE,
  "email"     TEXT UNIQUE,
  "senha"     TEXT,
  "role"      "Role" NOT NULL DEFAULT 'CLIENTE',
  "ativo"     BOOLEAN NOT NULL DEFAULT TRUE,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "codigos_verificacao" (
  "id"        SERIAL PRIMARY KEY,
  "usuarioId" INTEGER NOT NULL REFERENCES "usuarios"("id"),
  "codigo"    TEXT NOT NULL,
  "usado"     BOOLEAN NOT NULL DEFAULT FALSE,
  "expiraEm"  TIMESTAMP(3) NOT NULL,
  "criadoEm"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "secoes" (
  "id"       SERIAL PRIMARY KEY,
  "nome"     TEXT UNIQUE NOT NULL,
  "ativa"    BOOLEAN NOT NULL DEFAULT TRUE,
  "ordem"    INTEGER NOT NULL DEFAULT 0,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "itens" (
  "id"           SERIAL PRIMARY KEY,
  "nome"         TEXT NOT NULL,
  "descricao"    TEXT,
  "preco"        DECIMAL(10,2) NOT NULL,
  "disponivel"   BOOLEAN NOT NULL DEFAULT TRUE,
  "criadoEm"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "itens_secoes" (
  "itemId"  INTEGER NOT NULL REFERENCES "itens"("id"),
  "secaoId" INTEGER NOT NULL REFERENCES "secoes"("id"),
  PRIMARY KEY ("itemId", "secaoId")
);

CREATE TABLE "pedidos" (
  "id"             SERIAL PRIMARY KEY,
  "numero"         TEXT UNIQUE NOT NULL,
  "usuarioId"      INTEGER NOT NULL REFERENCES "usuarios"("id"),
  "formaPagamento" "FormaPagamento" NOT NULL,
  "statusAtual"    "StatusPedido" NOT NULL DEFAULT 'RECEBIDO',
  "estimativaMin"  INTEGER,
  "total"          DECIMAL(10,2) NOT NULL,
  "criadoEm"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "itens_pedido" (
  "id"         SERIAL PRIMARY KEY,
  "pedidoId"   INTEGER NOT NULL REFERENCES "pedidos"("id"),
  "itemId"     INTEGER NOT NULL REFERENCES "itens"("id"),
  "quantidade" INTEGER NOT NULL DEFAULT 1,
  "observacao" TEXT,
  "precoUnit"  DECIMAL(10,2) NOT NULL
);

CREATE TABLE "historico_status" (
  "id"       SERIAL PRIMARY KEY,
  "pedidoId" INTEGER NOT NULL REFERENCES "pedidos"("id"),
  "status"   "StatusPedido" NOT NULL,
  "motivo"   TEXT,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed: admin padrão (senha: admin123)
INSERT INTO "usuarios" ("nome", "email", "senha", "role")
VALUES ('Administrador', 'admin@pontobom.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ADMIN');

-- Seed: seções iniciais
INSERT INTO "secoes" ("nome", "ordem") VALUES
  ('Promoções', 1),
  ('Itens do Dia', 2),
  ('Pizzas', 3),
  ('Hambúrgueres', 4),
  ('Bebidas', 5);
