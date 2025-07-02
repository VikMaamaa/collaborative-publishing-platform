import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { UsersService, CreateUserDto, UpdateUserDto } from './users.service';
import { User, UserRole } from './user.entity';
import { OrganizationMember, OrganizationRole } from '../organizations/organization-member.entity';
import { Organization } from '../organizations/organization.entity';
import * as bcrypt from 'bcryptjs';

// Mock bcrypt
jest.mock('bcryptjs');

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: Repository<User>;
  let organizationMemberRepository: any;

  const mockUserRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockOrganizationMemberRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    username: 'testuser',
    password: 'hashedPassword123',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.USER,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    organizationMembers: [],
    posts: [],
    validatePassword: jest.fn(),
    getFullName: jest.fn(),
    hashPassword: jest.fn(),
    isSuperAdmin: jest.fn(),
    isAdmin: jest.fn(),
    isUser: jest.fn(),
  };

  const mockOrganization: Organization = {
    id: 'org-1',
    name: 'Test Organization',
    description: 'Test Description',
    website: 'https://test.com',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    members: [],
    posts: [],
    invitations: [],
  };

  const mockOrganizationMember: OrganizationMember = {
    id: 'member-1',
    userId: 'user-1',
    organizationId: 'org-1',
    role: OrganizationRole.WRITER,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: mockUser,
    organization: mockOrganization,
    hasPermission: jest.fn(),
    isOwner: jest.fn(),
    isEditor: jest.fn(),
    isWriter: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(OrganizationMember),
          useValue: mockOrganizationMemberRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    organizationMemberRepository = mockOrganizationMemberRepository;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createUserDto: any = {
      email: 'newuser@example.com',
      username: 'newuser',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
    };

    it('should create a new user successfully', async () => {
      // Mock bcrypt.hash
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');

      // Mock the saved user that will be returned
      const savedUser = {
        ...mockUser,
        email: createUserDto.email,
        username: createUserDto.username,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        isSuperAdmin: () => false,
        isAdmin: () => false,
        isUser: () => true,
      };

      mockUserRepository.findOne.mockResolvedValue(null); // No existing user
      mockUserRepository.create.mockReturnValue({
        ...savedUser,
        password: createUserDto.password,
      });
      mockUserRepository.save.mockImplementation(user => ({
        ...user,
        password: 'hashedPassword123',
      }));

      const result = await service.create(createUserDto);

      expect(mockUserRepository.findOne).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: [
          { email: createUserDto.email },
          { username: createUserDto.username },
        ],
      });
      expect(mockUserRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        email: createUserDto.email,
        username: createUserDto.username,
        password: createUserDto.password,
      }));
      expect(mockUserRepository.save).toHaveBeenCalledWith({
        ...savedUser,
        password: createUserDto.password,
      });
      
      // The result should be a UserResponse (without password and methods)
      expect(result).toEqual({
        id: savedUser.id,
        email: savedUser.email,
        username: savedUser.username,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        role: savedUser.role,
        isActive: savedUser.isActive,
        createdAt: savedUser.createdAt,
        updatedAt: savedUser.updatedAt,
        organizationMembers: savedUser.organizationMembers,
        posts: savedUser.posts,
        isSuperAdmin: expect.any(Boolean),
        isAdmin: expect.any(Boolean),
        isUser: expect.any(Boolean),
      });
    });

    it('should throw ConflictException when email already exists', async () => {
      const existingUser = { ...mockUser, email: createUserDto.email };
      mockUserRepository.findOne.mockResolvedValue(existingUser);

      await expect(service.create(createUserDto)).rejects.toThrow(
        new ConflictException('Email already exists')
      );
    });

    it('should throw ConflictException when username already exists', async () => {
      const existingUser = { ...mockUser, username: createUserDto.username };
      mockUserRepository.findOne.mockResolvedValue(existingUser);

      await expect(service.create(createUserDto)).rejects.toThrow(
        new ConflictException('Username already exists')
      );
    });
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      const userWithValidation = {
        ...mockUser,
        validatePassword: jest.fn().mockResolvedValue(true),
      };
      mockUserRepository.findOne.mockResolvedValue(userWithValidation);

      const result = await service.validateUser('test@example.com', 'password123');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com', isActive: true },
      });
      expect(result).toEqual(userWithValidation);
    });

    it('should return null when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent@example.com', 'password123');

      expect(result).toBeNull();
    });

    it('should return null when user is inactive', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      mockUserRepository.findOne.mockResolvedValue(inactiveUser);

      const result = await service.validateUser('test@example.com', 'password123');

      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      const userWithInvalidPassword = {
        ...mockUser,
        validatePassword: jest.fn().mockResolvedValue(false),
      };
      mockUserRepository.findOne.mockResolvedValue(userWithInvalidPassword);
      
      // Mock bcrypt.compare to return false
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('test@example.com', 'wrongpassword');

      expect(result).toBeNull();
    });
  });

  describe('getUserRoleInOrganization', () => {
    it('should return user role when member of organization', async () => {
      organizationMemberRepository.findOne.mockResolvedValue(mockOrganizationMember);

      const result = await service.getUserRoleInOrganization('user-1', 'org-1');

      expect(organizationMemberRepository.findOne).toHaveBeenCalledWith({
        where: { userId: 'user-1', organizationId: 'org-1', isActive: true },
      });
      expect(result).toBe(OrganizationRole.WRITER);
    });

    it('should return null when user is not member of organization', async () => {
      organizationMemberRepository.findOne.mockResolvedValue(null);

      const result = await service.getUserRoleInOrganization('user-1', 'org-2');

      expect(result).toBeNull();
    });

    it('should return null when membership is inactive', async () => {
      organizationMemberRepository.findOne.mockResolvedValue(null);

      const result = await service.getUserRoleInOrganization('user-1', 'org-1');

      expect(result).toBeNull();
    });
  });
}); 