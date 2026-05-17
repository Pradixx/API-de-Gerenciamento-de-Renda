import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { FilterTransactionDto } from './dto/filter-transaction.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { SummaryResponseDto } from './dto/summary-response.dto';
import { TransactionType } from './entities/transaction.entity';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  lastPage: number;
}

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
  ) {}

  async create(userId: string, dto: CreateTransactionDto): Promise<TransactionResponseDto> {
    const transaction = this.transactionsRepository.create({ ...dto, userId });
    const saved = await this.transactionsRepository.save(transaction);
    return TransactionResponseDto.fromEntity(saved);
  }

  async findAll(
    userId: string,
    filters: FilterTransactionDto,
  ): Promise<PaginatedResult<TransactionResponseDto>> {
    const { type, startDate, endDate, page = 1, limit = 10 } = filters;

    const qb = this.transactionsRepository
      .createQueryBuilder('t')
      .where('t.user_id = :userId', { userId })
      .orderBy('t.date', 'DESC')
      .addOrderBy('t.created_at', 'DESC');

    if (type) qb.andWhere('t.type = :type', { type });
    if (startDate) qb.andWhere('t.date >= :startDate', { startDate });
    if (endDate) qb.andWhere('t.date <= :endDate', { endDate });

    const total = await qb.getCount();
    const items = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data: items.map(TransactionResponseDto.fromEntity),
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findOne(userId: string, id: string): Promise<TransactionResponseDto> {
    const transaction = await this.transactionsRepository.findOneBy({ id });
    if (!transaction) throw new NotFoundException('Transação não encontrada');
    if (transaction.userId !== userId) throw new ForbiddenException();
    return TransactionResponseDto.fromEntity(transaction);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateTransactionDto,
  ): Promise<TransactionResponseDto> {
    const transaction = await this.transactionsRepository.findOneBy({ id });
    if (!transaction) throw new NotFoundException('Transação não encontrada');
    if (transaction.userId !== userId) throw new ForbiddenException();

    Object.assign(transaction, dto);
    const updated = await this.transactionsRepository.save(transaction);
    return TransactionResponseDto.fromEntity(updated);
  }

  async remove(userId: string, id: string): Promise<void> {
    const transaction = await this.transactionsRepository.findOneBy({ id });
    if (!transaction) throw new NotFoundException('Transação não encontrada');
    if (transaction.userId !== userId) throw new ForbiddenException();
    await this.transactionsRepository.remove(transaction);
  }

  async getSummary(userId: string): Promise<SummaryResponseDto> {
    const result = await this.transactionsRepository
      .createQueryBuilder('t')
      .select('t.type', 'type')
      .addSelect('SUM(t.amount)', 'total')
      .where('t.user_id = :userId', { userId })
      .groupBy('t.type')
      .getRawMany<{ type: TransactionType; total: string }>();

    const totalIncome = Number(
      result.find((r) => r.type === TransactionType.INCOME)?.total ?? 0,
    );
    const totalExpense = Number(
      result.find((r) => r.type === TransactionType.EXPENSE)?.total ?? 0,
    );

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    };
  }
}
