import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

const mockUser: User = {
  id: 'uuid-1',
  name: 'Diego Prado',
  email: 'diego@email.com',
  password: 'hashed',
  createdAt: new Date(),
  updatedAt: new Date(),
  transactions: [],
};

describe('UsersService', () => {
  let service: UsersService;
  let repo: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOneBy: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(UsersService);
    repo = module.get(getRepositoryToken(User));
  });

  describe('create', () => {
    it('deve criar usuário e hashear a senha', async () => {
      repo.findOneBy.mockResolvedValue(null);
      repo.create.mockReturnValue(mockUser);
      repo.save.mockResolvedValue(mockUser);

      const result = await service.create({
        name: 'Diego Prado',
        email: 'diego@email.com',
        password: 'senha123',
      });

      expect(repo.findOneBy).toHaveBeenCalledWith({ email: 'diego@email.com' });
      expect(repo.create).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('deve lançar ConflictException se e-mail já existir', async () => {
      repo.findOneBy.mockResolvedValue(mockUser);

      await expect(
        service.create({ name: 'X', email: 'diego@email.com', password: '123456' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findByEmail', () => {
    it('deve retornar usuário pelo e-mail', async () => {
      repo.findOneBy.mockResolvedValue(mockUser);
      const result = await service.findByEmail('diego@email.com');
      expect(result).toEqual(mockUser);
    });
  });

  describe('findById', () => {
    it('deve retornar usuário pelo id', async () => {
      repo.findOneBy.mockResolvedValue(mockUser);
      const result = await service.findById('uuid-1');
      expect(result).toEqual(mockUser);
    });

    it('deve lançar NotFoundException se não encontrar', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.findById('nao-existe')).rejects.toThrow(NotFoundException);
    });
  });
});
