import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { Transaction, TransactionType } from './entities/transaction.entity';

const userId = 'user-uuid-1';

const mockTransaction: Transaction = {
  id: 'tx-uuid-1',
  description: 'Salário',
  amount: 5000,
  type: TransactionType.INCOME,
  date: '2026-05-01',
  userId,
  user: {} as any,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockQb = {
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  addOrderBy: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getCount: jest.fn().mockResolvedValue(1),
  getMany: jest.fn().mockResolvedValue([mockTransaction]),
  getRawMany: jest.fn().mockResolvedValue([
    { type: TransactionType.INCOME, total: '5000' },
    { type: TransactionType.EXPENSE, total: '1200' },
  ]),
};

describe('TransactionsService', () => {
  let service: TransactionsService;
  let repo: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: {
            create: jest.fn().mockReturnValue(mockTransaction),
            save: jest.fn().mockResolvedValue(mockTransaction),
            findOneBy: jest.fn(),
            remove: jest.fn().mockResolvedValue(undefined),
            createQueryBuilder: jest.fn().mockReturnValue(mockQb),
          },
        },
      ],
    }).compile();

    service = module.get(TransactionsService);
    repo = module.get(getRepositoryToken(Transaction));
  });

  describe('create', () => {
    it('deve criar e retornar uma transação', async () => {
      const result = await service.create(userId, {
        description: 'Salário',
        amount: 5000,
        type: TransactionType.INCOME,
        date: '2026-05-01',
      });

      expect(result.description).toBe('Salário');
      expect(result.amount).toBe(5000);
    });
  });

  describe('findAll', () => {
    it('deve retornar lista paginada de transações', async () => {
      const result = await service.findAll(userId, { page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });
  });

  describe('findOne', () => {
    it('deve retornar uma transação do usuário', async () => {
      repo.findOneBy.mockResolvedValue(mockTransaction);
      const result = await service.findOne(userId, 'tx-uuid-1');
      expect(result.id).toBe('tx-uuid-1');
    });

    it('deve lançar NotFoundException se não encontrar', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.findOne(userId, 'nao-existe')).rejects.toThrow(NotFoundException);
    });

    it('deve lançar ForbiddenException se a transação for de outro usuário', async () => {
      repo.findOneBy.mockResolvedValue({ ...mockTransaction, userId: 'outro-user' });
      await expect(service.findOne(userId, 'tx-uuid-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('deve atualizar e retornar a transação', async () => {
      repo.findOneBy.mockResolvedValue(mockTransaction);
      const result = await service.update(userId, 'tx-uuid-1', { description: 'Bônus' });
      expect(result).toBeDefined();
    });

    it('deve lançar NotFoundException se não encontrar', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.update(userId, 'nao-existe', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deve remover a transação', async () => {
      repo.findOneBy.mockResolvedValue(mockTransaction);
      await expect(service.remove(userId, 'tx-uuid-1')).resolves.toBeUndefined();
    });

    it('deve lançar NotFoundException se não encontrar', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.remove(userId, 'nao-existe')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSummary', () => {
    it('deve retornar o resumo financeiro correto', async () => {
      const result = await service.getSummary(userId);
      expect(result.totalIncome).toBe(5000);
      expect(result.totalExpense).toBe(1200);
      expect(result.balance).toBe(3800);
    });
  });
});
