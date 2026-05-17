import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('API de Gerenciamento de Renda (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;
  let transactionId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ── Auth ──────────────────────────────────────────────────────────────────

  describe('POST /auth/register', () => {
    it('deve cadastrar novo usuário e retornar token', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Teste E2E', email: 'e2e@teste.com', password: 'senha123' })
        .expect(201);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.user.email).toBe('e2e@teste.com');
      accessToken = res.body.accessToken;
    });

    it('deve retornar 409 ao cadastrar e-mail duplicado', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Teste E2E', email: 'e2e@teste.com', password: 'senha123' })
        .expect(409);
    });

    it('deve retornar 400 com dados inválidos', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'invalido', password: '123' })
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    it('deve autenticar e retornar token', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'e2e@teste.com', password: 'senha123' })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
    });

    it('deve retornar 401 com credenciais erradas', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'e2e@teste.com', password: 'errada' })
        .expect(401);
    });
  });

  // ── Transactions ──────────────────────────────────────────────────────────

  describe('POST /transactions', () => {
    it('deve criar uma transação', async () => {
      const res = await request(app.getHttpServer())
        .post('/transactions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ description: 'Salário', amount: 5000, type: 'income', date: '2026-05-01' })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.description).toBe('Salário');
      transactionId = res.body.id;
    });

    it('deve retornar 401 sem token', async () => {
      await request(app.getHttpServer())
        .post('/transactions')
        .send({ description: 'X', amount: 100, type: 'income', date: '2026-05-01' })
        .expect(401);
    });
  });

  describe('GET /transactions', () => {
    it('deve listar transações do usuário', async () => {
      const res = await request(app.getHttpServer())
        .get('/transactions')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('deve filtrar por tipo', async () => {
      const res = await request(app.getHttpServer())
        .get('/transactions?type=income')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      res.body.data.forEach((t: any) => expect(t.type).toBe('income'));
    });
  });

  describe('GET /transactions/summary', () => {
    it('deve retornar resumo financeiro', async () => {
      const res = await request(app.getHttpServer())
        .get('/transactions/summary')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('totalIncome');
      expect(res.body).toHaveProperty('totalExpense');
      expect(res.body).toHaveProperty('balance');
    });
  });

  describe('GET /transactions/:id', () => {
    it('deve retornar a transação pelo id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.id).toBe(transactionId);
    });

    it('deve retornar 404 para id inexistente', async () => {
      await request(app.getHttpServer())
        .get('/transactions/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('PUT /transactions/:id', () => {
    it('deve atualizar a transação', async () => {
      const res = await request(app.getHttpServer())
        .put(`/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ description: 'Salário atualizado' })
        .expect(200);

      expect(res.body.description).toBe('Salário atualizado');
    });
  });

  describe('DELETE /transactions/:id', () => {
    it('deve remover a transação', async () => {
      await request(app.getHttpServer())
        .delete(`/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);
    });
  });
});
