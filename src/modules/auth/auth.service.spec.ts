import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed'),
  compare: jest.fn(),
}));

import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

const mockUser: User = {
  id: 'uuid-1',
  name: 'Diego Prado',
  email: 'diego@email.com',
  password: '$2a$10$hashedpassword',
  createdAt: new Date(),
  updatedAt: new Date(),
  transactions: [],
};

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findByEmail: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('mock.jwt.token') },
        },
      ],
    }).compile();

    service = module.get(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  describe('register', () => {
    it('deve registrar usuário e retornar token', async () => {
      usersService.create.mockResolvedValue(mockUser);

      const result = await service.register({
        name: 'Diego Prado',
        email: 'diego@email.com',
        password: 'senha123',
      });

      expect(result.accessToken).toBe('mock.jwt.token');
      expect(result.user.email).toBe('diego@email.com');
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: 'uuid-1', email: 'diego@email.com' });
    });
  });

  describe('login', () => {
    it('deve autenticar usuário com credenciais corretas', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({ email: 'diego@email.com', password: 'senha123' });

      expect(result.accessToken).toBe('mock.jwt.token');
      expect(result.user.email).toBe('diego@email.com');
    });

    it('deve lançar UnauthorizedException se usuário não existir', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nao@existe.com', password: 'senha123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve lançar UnauthorizedException se senha estiver errada', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'diego@email.com', password: 'errada' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
