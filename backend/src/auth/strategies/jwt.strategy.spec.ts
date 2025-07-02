import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { JwtPayload } from '../dto/auth.dto';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should return user data when payload is valid', async () => {
      const payload: JwtPayload = {
        sub: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        role: 'USER',
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: payload.sub,
        email: payload.email,
        username: payload.username,
        role: payload.role,
      });
    });

    it('should throw UnauthorizedException when payload is missing sub', async () => {
      const payload: JwtPayload = {
        sub: '',
        email: 'test@example.com',
        username: 'testuser',
        role: 'USER',
      };

      await expect(strategy.validate(payload)).rejects.toThrow(
        new UnauthorizedException('Invalid token payload')
      );
    });

    it('should throw UnauthorizedException when payload is missing email', async () => {
      const payload: JwtPayload = {
        sub: 'user-1',
        email: '',
        username: 'testuser',
        role: 'USER',
      };

      await expect(strategy.validate(payload)).rejects.toThrow(
        new UnauthorizedException('Invalid token payload')
      );
    });
  });
}); 