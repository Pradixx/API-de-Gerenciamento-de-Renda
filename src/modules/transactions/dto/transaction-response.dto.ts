import { ApiProperty } from '@nestjs/swagger';
import { Transaction, TransactionType } from '../entities/transaction.entity';

export class TransactionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  amount: number;

  @ApiProperty({ enum: TransactionType })
  type: TransactionType;

  @ApiProperty()
  date: string;

  @ApiProperty()
  createdAt: Date;

  static fromEntity(t: Transaction): TransactionResponseDto {
    const dto = new TransactionResponseDto();
    dto.id = t.id;
    dto.description = t.description;
    dto.amount = Number(t.amount);
    dto.type = t.type;
    dto.date = t.date;
    dto.createdAt = t.createdAt;
    return dto;
  }
}
