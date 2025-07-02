import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { Organization } from './organization.entity';
import { OrganizationMember, OrganizationRole } from './organization-member.entity';
import { User } from '../users/user.entity';
import { Invitation } from './invitation.entity';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  InviteMemberDto,
  UpdateMemberRoleDto,
  RemoveMemberDto,
} from './dto/organization.dto';

describe('OrganizationsService', () => {
  let service: OrganizationsService;
  let organizationRepository: Repository<Organization>;
  let memberRepository: Repository<OrganizationMember>;
  let userRepository: Repository<User>;
  let invitationRepository: Repository<Invitation>;

  const mockOrganizationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockMemberRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockInvitationRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue({
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      whereInIds: jest.fn().mockReturnThis(),
      execute: jest.fn(),
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        {
          provide: getRepositoryToken(Organization),
          useValue: mockOrganizationRepository,
        },
        {
          provide: getRepositoryToken(OrganizationMember),
          useValue: mockMemberRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Invitation),
          useValue: mockInvitationRepository,
        },
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
    organizationRepository = module.get<Repository<Organization>>(getRepositoryToken(Organization));
    memberRepository = module.get<Repository<OrganizationMember>>(getRepositoryToken(OrganizationMember));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    invitationRepository = module.get<Repository<Invitation>>(getRepositoryToken(Invitation));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrganization', () => {
    const createDto: CreateOrganizationDto = {
      name: 'Test Organization',
      description: 'Test Description',
    };
    const userId = 'user-123';

    it('should create an organization and add creator as owner', async () => {
      const organization = {
        id: 'org-123',
        name: createDto.name,
        description: createDto.description,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const member = {
        id: 'member-123',
        userId,
        organizationId: organization.id,
        role: OrganizationRole.OWNER,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOrganizationRepository.findOne.mockResolvedValue(null);
      mockOrganizationRepository.create.mockReturnValue(organization);
      mockOrganizationRepository.save.mockResolvedValue(organization);
      mockMemberRepository.create.mockReturnValue(member);
      mockMemberRepository.save.mockResolvedValue(member);

      const result = await service.createOrganization(createDto, userId);

      expect(mockOrganizationRepository.findOne).toHaveBeenCalledWith({
        where: { name: createDto.name },
      });
      expect(mockOrganizationRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockMemberRepository.create).toHaveBeenCalledWith({
        userId,
        organizationId: organization.id,
        role: OrganizationRole.OWNER,
      });
      expect(result).toEqual({
        id: organization.id,
        name: organization.name,
        description: organization.description,
        isActive: organization.isActive,
        createdAt: organization.createdAt,
        updatedAt: organization.updatedAt,
        memberCount: 0,
      });
    });

    it('should throw ConflictException if organization name already exists', async () => {
      mockOrganizationRepository.findOne.mockResolvedValue({ id: 'existing-org' });

      await expect(service.createOrganization(createDto, userId)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAllOrganizations', () => {
    const userId = 'user-123';

    it('should return organizations where user is a member', async () => {
      const organizations = [
        {
          id: 'org-1',
          name: 'Org 1',
          members: [{ isActive: true }],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Set up fresh mocks for this test
      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(organizations),
      };
      mockOrganizationRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAllOrganizations(userId);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0].memberCount).toBe(1);
    });
  });

  describe('findOrganizationById', () => {
    const organizationId = 'org-123';
    const userId = 'user-123';

    it('should return organization if user is a member', async () => {
      const organization = {
        id: organizationId,
        name: 'Test Org',
        members: [
          { userId, isActive: true },
          { userId: 'other-user', isActive: true },
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Set up fresh mocks for this test
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(organization),
      };
      mockOrganizationRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findOrganizationById(organizationId, userId);

      expect(result).toBeDefined();
      expect(result.id).toBe(organizationId);
    });

    it('should throw NotFoundException if organization not found', async () => {
      // Set up fresh mocks for this test
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      mockOrganizationRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await expect(service.findOrganizationById(organizationId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      const organization = {
        id: organizationId,
        name: 'Test Org',
        members: [{ userId: 'other-user', isActive: true }],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Set up fresh mocks for this test
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(organization),
      };
      mockOrganizationRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await expect(service.findOrganizationById(organizationId, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('updateOrganization', () => {
    const organizationId = 'org-123';
    const userId = 'user-123';
    const updateDto: UpdateOrganizationDto = { name: 'Updated Name' };

    it('should update organization if user has editor permission', async () => {
      const member = {
        userId,
        organizationId,
        role: OrganizationRole.EDITOR,
        isActive: true,
        hasPermission: jest.fn().mockReturnValue(true),
      };

      const organization = {
        id: organizationId,
        name: 'Old Name',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockMemberRepository.findOne.mockResolvedValue(member);
      mockOrganizationRepository.findOne
        .mockResolvedValueOnce(null) // For name conflict check
        .mockResolvedValueOnce(organization); // For organization lookup
      mockOrganizationRepository.save.mockResolvedValue({ ...organization, ...updateDto });

      const result = await service.updateOrganization(organizationId, updateDto, userId);

      expect(mockOrganizationRepository.save).toHaveBeenCalled();
      expect(result.name).toBe(updateDto.name);
    });

    it('should throw ForbiddenException if user lacks permission', async () => {
      const member = {
        userId,
        organizationId,
        role: OrganizationRole.WRITER,
        isActive: true,
        hasPermission: jest.fn().mockReturnValue(false),
      };

      mockMemberRepository.findOne.mockResolvedValue(member);

      await expect(service.updateOrganization(organizationId, updateDto, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('inviteMember', () => {
    const organizationId = 'org-123';
    const userId = 'user-123';
    const inviteDto: InviteMemberDto = {
      email: 'newuser@example.com',
      role: OrganizationRole.WRITER,
    };

    it('should invite member if user has editor permission', async () => {
      const member = {
        userId,
        organizationId,
        role: OrganizationRole.EDITOR,
        isActive: true,
        hasPermission: jest.fn().mockReturnValue(true),
      };

      const user = {
        id: 'new-user-123',
        email: inviteDto.email,
      };

      const newMember = {
        id: 'member-123',
        userId: user.id,
        organizationId,
        role: inviteDto.role,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockMemberRepository.findOne.mockResolvedValue(member);
      mockUserRepository.findOne.mockResolvedValue(user);
      mockMemberRepository.findOne.mockResolvedValueOnce(member).mockResolvedValueOnce(null); // For existing member check
      mockMemberRepository.create.mockReturnValue(newMember);
      mockMemberRepository.save.mockResolvedValue(newMember);

      const result = await service.inviteMember(organizationId, inviteDto, userId);

      expect(mockMemberRepository.create).toHaveBeenCalledWith({
        userId: user.id,
        organizationId,
        role: inviteDto.role,
      });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if user not found', async () => {
      const member = {
        userId,
        organizationId,
        role: OrganizationRole.EDITOR,
        isActive: true,
        hasPermission: jest.fn().mockReturnValue(true),
      };

      mockMemberRepository.findOne.mockResolvedValue(member);
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.inviteMember(organizationId, inviteDto, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if user is already a member', async () => {
      const member = {
        userId,
        organizationId,
        role: OrganizationRole.EDITOR,
        isActive: true,
        hasPermission: jest.fn().mockReturnValue(true),
      };

      const user = {
        id: 'new-user-123',
        email: inviteDto.email,
      };

      const existingMember = {
        userId: user.id,
        organizationId,
        isActive: true,
      };

      mockMemberRepository.findOne
        .mockResolvedValueOnce(member)
        .mockResolvedValueOnce(existingMember);
      mockUserRepository.findOne.mockResolvedValue(user);

      await expect(service.inviteMember(organizationId, inviteDto, userId)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('updateMemberRole', () => {
    const organizationId = 'org-123';
    const userId = 'user-123';
    const updateDto: UpdateMemberRoleDto = {
      memberId: 'member-123',
      role: OrganizationRole.EDITOR,
    };

    it('should update member role if user has editor permission', async () => {
      const currentMember = {
        userId,
        organizationId,
        role: OrganizationRole.EDITOR,
        isActive: true,
        hasPermission: jest.fn().mockReturnValue(true),
      };

      const targetMember = {
        id: updateDto.memberId,
        userId: 'target-user-123',
        organizationId,
        role: OrganizationRole.WRITER,
        isActive: true,
        user: { id: 'target-user-123', email: 'target@example.com' },
      };

      mockMemberRepository.findOne
        .mockResolvedValueOnce(currentMember)
        .mockResolvedValueOnce(targetMember);
      mockMemberRepository.save.mockResolvedValue({ ...targetMember, role: updateDto.role });

      const result = await service.updateMemberRole(organizationId, updateDto, userId);

      expect(mockMemberRepository.save).toHaveBeenCalled();
      expect(result.role).toBe(updateDto.role);
    });

    it('should prevent changing owner role unless it is the owner themselves', async () => {
      const currentMember = {
        userId,
        organizationId,
        role: OrganizationRole.EDITOR,
        isActive: true,
        hasPermission: jest.fn().mockReturnValue(true),
      };

      const targetMember = {
        id: updateDto.memberId,
        userId: 'owner-user-123',
        organizationId,
        role: OrganizationRole.OWNER,
        isActive: true,
        user: { id: 'owner-user-123', email: 'owner@example.com' },
      };

      mockMemberRepository.findOne
        .mockResolvedValueOnce(currentMember)
        .mockResolvedValueOnce(targetMember);

      await expect(service.updateMemberRole(organizationId, updateDto, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('removeMember', () => {
    const organizationId = 'org-123';
    const userId = 'user-123';
    const removeDto: RemoveMemberDto = { memberId: 'member-123' };

    it('should remove member if user has editor permission', async () => {
      const currentMember = {
        userId,
        organizationId,
        role: OrganizationRole.EDITOR,
        isActive: true,
        hasPermission: jest.fn().mockReturnValue(true),
      };

      const targetMember = {
        id: removeDto.memberId,
        userId: 'target-user-123',
        organizationId,
        role: OrganizationRole.WRITER,
        isActive: true,
      };

      mockMemberRepository.findOne
        .mockResolvedValueOnce(currentMember)
        .mockResolvedValueOnce(targetMember);
      mockMemberRepository.save.mockResolvedValue({ ...targetMember, isActive: false });

      await service.removeMember(organizationId, removeDto, userId);

      expect(mockMemberRepository.save).toHaveBeenCalledWith({
        ...targetMember,
        isActive: false,
      });
    });

    it('should prevent removing owner unless it is themselves', async () => {
      const currentMember = {
        userId,
        organizationId,
        role: OrganizationRole.EDITOR,
        isActive: true,
        hasPermission: jest.fn().mockReturnValue(true),
      };

      const targetMember = {
        id: removeDto.memberId,
        userId: 'owner-user-123',
        organizationId,
        role: OrganizationRole.OWNER,
        isActive: true,
      };

      mockMemberRepository.findOne
        .mockResolvedValueOnce(currentMember)
        .mockResolvedValueOnce(targetMember);

      await expect(service.removeMember(organizationId, removeDto, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('leaveOrganization', () => {
    const organizationId = 'org-123';
    const userId = 'user-123';

    it('should allow user to leave organization', async () => {
      const member = {
        userId,
        organizationId,
        role: OrganizationRole.WRITER,
        isActive: true,
      };

      mockMemberRepository.findOne.mockResolvedValue(member);
      mockMemberRepository.save.mockResolvedValue({ ...member, isActive: false });

      await service.leaveOrganization(organizationId, userId);

      expect(mockMemberRepository.save).toHaveBeenCalledWith({
        ...member,
        isActive: false,
      });
    });

    it('should prevent leaving if user is the only owner', async () => {
      const member = {
        userId,
        organizationId,
        role: OrganizationRole.OWNER,
        isActive: true,
      };

      mockMemberRepository.findOne.mockResolvedValue(member);
      mockMemberRepository.count.mockResolvedValue(1);

      await expect(service.leaveOrganization(organizationId, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException if user is not a member', async () => {
      mockMemberRepository.findOne.mockResolvedValue(null);

      await expect(service.leaveOrganization(organizationId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
}); 