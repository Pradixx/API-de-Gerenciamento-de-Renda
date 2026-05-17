import { ApiProperty } from '@nestjs/swagger';

export class SummaryResponseDto {
  @ApiProperty({ example: 8000.0 })
  totalIncome: number;

  @ApiProperty({ example: 3000.0 })
  totalExpense: number;

  @ApiProperty({ example: 5000.0 })
  balance: number;
}
