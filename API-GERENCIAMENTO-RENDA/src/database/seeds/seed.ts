import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { User } from '../../modules/users/entities/user.entity';
import { Transaction, TransactionType } from '../../modules/transactions/entities/transaction.entity';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'renda_db',
  entities: [User, Transaction],
  synchronize: true,
});

async function seed() {
  await AppDataSource.initialize();
  console.log('Conexão estabelecida.');

  const userRepo = AppDataSource.getRepository(User);
  const transactionRepo = AppDataSource.getRepository(Transaction);

  await transactionRepo.delete({});
  await userRepo.delete({});
  console.log('Dados anteriores removidos.');

  const hashed = await bcrypt.hash('senha123', 10);
  const user = userRepo.create({
    name: 'Diego Prado',
    email: 'diego@email.com',
    password: hashed,
  });
  await userRepo.save(user);
  console.log(`Usuário criado: ${user.email}`);

  const transactions = transactionRepo.create([
    { description: 'Salário', amount: 5000, type: TransactionType.INCOME, date: '2026-05-01', userId: user.id },
    { description: 'Freelance', amount: 1500, type: TransactionType.INCOME, date: '2026-05-10', userId: user.id },
    { description: 'Aluguel', amount: 1200, type: TransactionType.EXPENSE, date: '2026-05-05', userId: user.id },
    { description: 'Mercado', amount: 600, type: TransactionType.EXPENSE, date: '2026-05-08', userId: user.id },
    { description: 'Conta de luz', amount: 150, type: TransactionType.EXPENSE, date: '2026-05-12', userId: user.id },
    { description: 'Academia', amount: 100, type: TransactionType.EXPENSE, date: '2026-05-02', userId: user.id },
  ]);
  await transactionRepo.save(transactions);
  console.log(`${transactions.length} transações criadas.`);

  await AppDataSource.destroy();
  console.log('Seed concluído.');
}

seed().catch((err) => {
  console.error('Erro no seed:', err);
  process.exit(1);
});
