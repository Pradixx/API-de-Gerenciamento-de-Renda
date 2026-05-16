# API de Gerenciamento de Renda

API REST para controle financeiro pessoal, desenvolvida como desafio técnico back-end.

## Sobre o Desafio

> Desenvolver uma API utilizando TypeScript e NestJS, simulando um sistema simples de controle financeiro.

### Requisitos funcionais

- **Autenticação de usuários** — cadastro e login com nome, e-mail e senha. Rotas protegidas exigem autenticação.
- **Gerenciamento de transações** — criar, listar, atualizar e remover transações (entrada e saída) do usuário autenticado.
- **Resumo financeiro** — endpoint com total de entradas, total de saídas e saldo final.

### Diferenciais implementados

- Paginação e filtros por tipo e data nas listagens
- Hash de senha com bcrypt
- Validação de dados com `class-validator`
- Separação de camadas: controllers / services / repositories
- Organização por módulos (auth, users, transactions)
- Seeds com dados iniciais para facilitar testes
- Documentação completa via Swagger

---

## Stack

| Tecnologia     | Versão  |
|----------------|---------|
| Node.js        | 20+     |
| NestJS         | 11      |
| TypeScript     | 5       |
| TypeORM        | 0.3     |
| PostgreSQL      | 16      |
| Docker         | —       |
| JWT + Passport | —       |
| Jest           | 30      |

---

## Como rodar o projeto

### Pré-requisitos

- [Node.js 20+](https://nodejs.org/)
- [Docker](https://www.docker.com/)

### 1. Clone o repositório e instale as dependências

```bash
npm install
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

O `.env` já vem preenchido com os valores padrão para desenvolvimento local.

### 3. Suba o banco de dados com Docker

```bash
docker compose up -d
```

### 4. (Opcional) Popule o banco com dados iniciais

```bash
npm run seed
```

Isso cria o seguinte usuário de teste:

| Campo  | Valor             |
|--------|-------------------|
| E-mail | diego@email.com   |
| Senha  | senha123          |

### 5. Inicie a aplicação

```bash
# desenvolvimento (hot reload)
npm run start:dev

# produção
npm run start:prod
```

A API estará disponível em: `http://localhost:3000`

---

## Documentação (Swagger)

Acesse `http://localhost:3000/docs` para visualizar e testar todos os endpoints interativamente.

---

## Endpoints

### Auth

| Método | Rota             | Descrição              | Auth |
|--------|------------------|------------------------|------|
| POST   | /auth/register   | Cadastrar usuário      | Não  |
| POST   | /auth/login      | Autenticar usuário     | Não  |

### Transactions

| Método | Rota                      | Descrição                          | Auth |
|--------|---------------------------|------------------------------------|------|
| POST   | /transactions             | Criar transação                    | Sim  |
| GET    | /transactions             | Listar transações (filtros + página) | Sim  |
| GET    | /transactions/summary     | Resumo financeiro                  | Sim  |
| GET    | /transactions/:id         | Buscar transação por ID            | Sim  |
| PUT    | /transactions/:id         | Atualizar transação                | Sim  |
| DELETE | /transactions/:id         | Remover transação                  | Sim  |

### Filtros disponíveis em GET /transactions

| Parâmetro  | Tipo   | Exemplo      |
|------------|--------|--------------|
| type       | string | income / expense |
| startDate  | string | 2026-01-01   |
| endDate    | string | 2026-12-31   |
| page       | number | 1            |
| limit      | number | 10           |

---

## Exemplos de requisição

### Cadastrar usuário

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Diego Prado", "email": "diego@email.com", "password": "senha123"}'
```

### Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "diego@email.com", "password": "senha123"}'
```

### Criar transação

```bash
curl -X POST http://localhost:3000/transactions \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"description": "Salário", "amount": 5000, "type": "income", "date": "2026-05-01"}'
```

### Resumo financeiro

```bash
curl http://localhost:3000/transactions/summary \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Resposta:**

```json
{
  "totalIncome": 6500.00,
  "totalExpense": 2050.00,
  "balance": 4450.00
}
```

---

## Testes

```bash
# Testes unitários
npm run test

# Testes e2e (requer banco rodando)
npm run test:e2e

# Cobertura
npm run test:cov
```

---

## Variáveis de ambiente

| Variável       | Descrição                  | Padrão                |
|----------------|----------------------------|-----------------------|
| DB_HOST        | Host do PostgreSQL         | localhost             |
| DB_PORT        | Porta do PostgreSQL        | 5432                  |
| DB_USERNAME    | Usuário do banco           | postgres              |
| DB_PASSWORD    | Senha do banco             | postgres              |
| DB_NAME        | Nome do banco de dados     | renda_db              |
| JWT_SECRET     | Chave secreta do JWT       | —                     |
| JWT_EXPIRES_IN | Expiração do token         | 7d                    |
| PORT           | Porta da aplicação         | 3000                  |

---

## Estrutura do projeto

```
src/
├── config/
│   └── database.config.ts
├── common/
│   ├── decorators/
│   │   └── current-user.decorator.ts
│   └── guards/
│       └── jwt-auth.guard.ts
├── database/
│   └── seeds/
│       └── seed.ts
└── modules/
    ├── auth/
    │   ├── dto/
    │   ├── strategies/
    │   ├── auth.controller.ts
    │   ├── auth.service.ts
    │   └── auth.module.ts
    ├── users/
    │   ├── dto/
    │   ├── entities/
    │   ├── users.service.ts
    │   └── users.module.ts
    └── transactions/
        ├── dto/
        ├── entities/
        ├── transactions.controller.ts
        ├── transactions.service.ts
        └── transactions.module.ts
```

---

## Autor

**Diego Silva Prado**
- GitHub: [Pradixx](https://github.com/Pradixx)
- LinkedIn: [diego-prado-dev](https://www.linkedin.com/in/diego-prado-dev/)
