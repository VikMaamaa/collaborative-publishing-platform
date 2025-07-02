import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizationsService } from './organizations.service';
import { Organization } from './organization.entity';
import { OrganizationMember, OrganizationRole } from './organization-member.entity';
import { User } from '../users/user.entity';
import { Invitation, InvitationStatus } from './invitation.entity';
import { CreateInvitationDto } from './dto/organization.dto';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('OrganizationsService - Invitations', () => {
  let service: OrganizationsService;
  let organizationRepository: Repository<Organization>;
  let memberRepository: Repository<OrganizationMember>;
  let userRepository: Repository<User>;
  let invitationRepository: Repository<Invitation>;

  const mockOrganization = {
    id: 'org-1',
    name: 'Test Org',
    description: 'Test Description',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    role: 'USER',
    isActive: true,
  };

  const mockMember = {
    id: 'member-1',
    userId: 'user-1',
    organizationId: 'org-1',
    role: OrganizationRole.EDITOR,
    isActive: true,
    hasPermission: jest.fn().mockReturnValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        {
          provide: getRepositoryToken(Organization),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(OrganizationMember),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Invitation),
          useValue: {
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
          },
        },
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
    organizationRepository = module.get<Repository<Organization>>(getRepositoryToken(Organization));
    memberRepository = module.get<Repository<OrganizationMember>>(getRepositoryToken(OrganizationMember));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    invitationRepository = module.get<Repository<Invitation>>(getRepositoryToken(Invitation));
  });

  describe('createInvitation', () => {
    const createDto: CreateInvitationDto = {
      email: 'newuser@example.com',
      role: OrganizationRole.WRITER,
    };

    it('should create an invitation successfully', async () => {
      // Mock permission check
      jest.spyOn(memberRepository, 'findOne').mockResolvedValue(mockMember as any);
      
      // Mock user not found (new user)
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      
      // Mock no existing invitation
      jest.spyOn(invitationRepository, 'findOne').mockResolvedValue(null);
      
      // Mock invitation creation
      const mockInvitation = {
        id: 'inv-1',
        organizationId: 'org-1',
        email: 'newuser@example.com',
        role: OrganizationRole.WRITER,
        status: InvitationStatus.PENDING,
        token: 'mock-token',
        invitedBy: 'user-1',
        expiresAt: expect.any(Date),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      jest.spyOn(invitationRepository, 'create').mockReturnValue(mockInvitation as any);
      jest.spyOn(invitationRepository, 'save').mockResolvedValue(mockInvitation as any);

      const result = await service.createInvitation('org-1', createDto, 'user-1');

      expect(result).toEqual({
        id: 'inv-1',
        organizationId: 'org-1',
        email: 'newuser@example.com',
        role: OrganizationRole.WRITER,
        status: InvitationStatus.PENDING,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        invitedBy: 'user-1',
        expiresAt: expect.any(Date),
      });
    });

    it('should throw ConflictException if user is already a member', async () => {
      // Mock permission check
      jest.spyOn(memberRepository, 'findOne').mockResolvedValue(mockMember as any);
      
      // Mock existing user
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as any);
      
      // Mock existing member
      jest.spyOn(memberRepository, 'findOne').mockResolvedValueOnce(mockMember as any);

      await expect(service.createInvitation('org-1', createDto, 'user-1'))
        .rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if invitation already exists', async () => {
      // Mock permission check
      jest.spyOn(memberRepository, 'findOne').mockResolvedValue(mockMember as any);
      
      // Mock user not found
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      
      // Mock existing invitation
      jest.spyOn(invitationRepository, 'findOne').mockResolvedValue({
        id: 'existing-inv',
        status: InvitationStatus.PENDING,
      } as any);

      await expect(service.createInvitation('org-1', createDto, 'user-1'))
        .rejects.toThrow(ConflictException);
    });
  });

  describe('getInvitations', () => {
    it('should return pending invitations for organization', async () => {
      // Mock permission check
      jest.spyOn(memberRepository, 'findOne').mockResolvedValue(mockMember as any);
      
      const mockInvitations = [
        {
          id: 'inv-1',
          organizationId: 'org-1',
          email: 'user1@example.com',
          role: OrganizationRole.WRITER,
          status: InvitationStatus.PENDING,
          createdAt: new Date(),
          updatedAt: new Date(),
          invitedBy: 'user-1',
          expiresAt: new Date(),
        },
      ];
      
      jest.spyOn(invitationRepository, 'find').mockResolvedValue(mockInvitations as any);

      const result = await service.getInvitations('org-1', 'user-1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('inv-1');
    });
  });

  describe('resendInvitation', () => {
    it('should resend invitation with new token and extended expiration', async () => {
      // Mock permission check
      jest.spyOn(memberRepository, 'findOne').mockResolvedValue(mockMember as any);
      
      const existingInvitation = {
        id: 'inv-1',
        organizationId: 'org-1',
        email: 'user@example.com',
        role: OrganizationRole.WRITER,
        status: InvitationStatus.PENDING,
        token: 'old-token',
        expiresAt: new Date(),
      };
      
      jest.spyOn(invitationRepository, 'findOne').mockResolvedValue(existingInvitation as any);
      jest.spyOn(invitationRepository, 'save').mockResolvedValue({
        ...existingInvitation,
        token: 'new-token',
        updatedAt: new Date(),
        expiresAt: expect.any(Date),
      } as any);

      const result = await service.resendInvitation('org-1', 'inv-1', 'user-1');

      expect(result.id).toBe('inv-1');
      expect(invitationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          token: expect.any(String),
          expiresAt: expect.any(Date),
        })
      );
    });

    it('should throw NotFoundException if invitation not found', async () => {
      // Mock permission check
      jest.spyOn(memberRepository, 'findOne').mockResolvedValue(mockMember as any);
      
      // Mock invitation not found
      jest.spyOn(invitationRepository, 'findOne').mockResolvedValue(null);

      await expect(service.resendInvitation('org-1', 'inv-1', 'user-1'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('cancelInvitation', () => {
    it('should cancel invitation successfully', async () => {
      // Mock permission check
      jest.spyOn(memberRepository, 'findOne').mockResolvedValue(mockMember as any);
      
      const existingInvitation = {
        id: 'inv-1',
        organizationId: 'org-1',
        status: InvitationStatus.PENDING,
      };
      
      jest.spyOn(invitationRepository, 'findOne').mockResolvedValue(existingInvitation as any);
      jest.spyOn(invitationRepository, 'save').mockResolvedValue({
        ...existingInvitation,
        status: InvitationStatus.CANCELED,
      } as any);

      await service.cancelInvitation('org-1', 'inv-1', 'user-1');

      expect(invitationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: InvitationStatus.CANCELED,
        })
      );
    });
  });

  describe('acceptInvitation', () => {
    it('should accept invitation and create member', async () => {
      const invitation = {
        id: 'inv-1',
        organizationId: 'org-1',
        email: 'user@example.com',
        role: OrganizationRole.WRITER,
        status: InvitationStatus.PENDING,
        expiresAt: new Date(Date.now() + 86400000), // 1 day from now
        organization: mockOrganization,
      };
      
      jest.spyOn(invitationRepository, 'findOne').mockResolvedValue(invitation as any);
      jest.spyOn(memberRepository, 'findOne').mockResolvedValue(null); // No existing member
      jest.spyOn(memberRepository, 'create').mockReturnValue(mockMember as any);
      jest.spyOn(memberRepository, 'save').mockResolvedValue(mockMember as any);
      jest.spyOn(invitationRepository, 'save').mockResolvedValue({
        ...invitation,
        status: InvitationStatus.ACCEPTED,
      } as any);

      const result = await service.acceptInvitation('valid-token', 'user-1');

      expect(result).toBeDefined();
      expect(invitationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: InvitationStatus.ACCEPTED,
        })
      );
    });

    it('should throw NotFoundException if invitation has expired', async () => {
      const expiredInvitation = {
        id: 'inv-1',
        organizationId: 'org-1',
        status: InvitationStatus.PENDING,
        expiresAt: new Date(Date.now() - 86400000), // 1 day ago
      };
      
      jest.spyOn(invitationRepository, 'findOne').mockResolvedValue(expiredInvitation as any);
      jest.spyOn(invitationRepository, 'save').mockResolvedValue({
        ...expiredInvitation,
        status: InvitationStatus.EXPIRED,
      } as any);

      await expect(service.acceptInvitation('expired-token', 'user-1'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserInvitations', () => {
    it('should return user invitations', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as any);
      
      const mockInvitations = [
        {
          id: 'inv-1',
          organizationId: 'org-1',
          email: 'test@example.com',
          role: OrganizationRole.WRITER,
          status: InvitationStatus.PENDING,
          organization: mockOrganization,
        },
      ];
      
      jest.spyOn(invitationRepository, 'find').mockResolvedValue(mockInvitations as any);

      const result = await service.getUserInvitations('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('inv-1');
    });
  });
}); 