import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { FilterTransactionDto } from './dto/filter-transaction.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { SummaryResponseDto } from './dto/summary-response.dto';
import { TransactionType } from './entities/transaction.entity';

@ApiTags('Transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar transação' })
  @ApiResponse({ status: 201, type: TransactionResponseDto, description: 'Transação criada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  create(
    @CurrentUser() user: User,
    @Body() dto: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
    return this.transactionsService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar transações com filtros e paginação' })
  @ApiQuery({ name: 'type', enum: TransactionType, required: false })
  @ApiQuery({ name: 'startDate', required: false, example: '2026-01-01' })
  @ApiQuery({ name: 'endDate', required: false, example: '2026-12-31' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, description: 'Lista paginada de transações' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  findAll(@CurrentUser() user: User, @Query() filters: FilterTransactionDto) {
    return this.transactionsService.findAll(user.id, filters);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Resumo financeiro do usuário' })
  @ApiResponse({ status: 200, type: SummaryResponseDto, description: 'Total de entradas, saídas e saldo' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  getSummary(@CurrentUser() user: User): Promise<SummaryResponseDto> {
    return this.transactionsService.getSummary(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar transação por ID' })
  @ApiResponse({ status: 200, type: TransactionResponseDto })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Transação não encontrada' })
  findOne(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TransactionResponseDto> {
    return this.transactionsService.findOne(user.id, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar transação' })
  @ApiResponse({ status: 200, type: TransactionResponseDto })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Transação não encontrada' })
  update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTransactionDto,
  ): Promise<TransactionResponseDto> {
    return this.transactionsService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover transação' })
  @ApiResponse({ status: 204, description: 'Transação removida com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Transação não encontrada' })
  remove(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.transactionsService.remove(user.id, id);
  }
}
