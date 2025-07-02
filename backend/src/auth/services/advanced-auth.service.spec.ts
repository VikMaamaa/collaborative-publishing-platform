import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { AdvancedAuthService, PermissionContext, ComplexPermissionCheck } from './advanced-auth.service';
import { OrganizationMember } from '../../organizations/organization-member.entity';
import { OrganizationRole } from '../../organizations/organization-role.enum';
import { Organization } from '../../organizations/organization.entity';
import { User, UserRole } from '../../users/user.entity';

describe('AdvancedAuthService', () => {
  let service: AdvancedAuthService;
  let memberRepository: Repository<OrganizationMember>;
  let organizationRepository: Repository<Organization>;
  let userRepository: Repository<User>;

  // Helper function to create mock user with all required methods
  const createMockUser = (overrides: Partial<User> = {}): User => ({
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
    ...overrides,
  });

  // Helper function to create mock organization member with all required methods
  const createMockMember = (overrides: Partial<OrganizationMember> = {}): OrganizationMember => ({
    id: 'member-1',
    userId: 'user-1',
    organizationId: 'org-1',
    role: OrganizationRole.OWNER,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: createMockUser(),
    organization: {
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
    },
    hasPermission: jest.fn(),
    isOwner: jest.fn(),
    isEditor: jest.fn(),
    isWriter: jest.fn(),
    ...overrides,
  });

  const mockUser = createMockUser();
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

  const mockOwnerMember = createMockMember({
    id: 'member-1',
    userId: 'user-1',
    role: OrganizationRole.OWNER,
  });

  const mockEditorMember = createMockMember({
    id: 'member-2',
    userId: 'user-2',
    role: OrganizationRole.EDITOR,
  });

  const mockWriterMember = createMockMember({
    id: 'member-3',
    userId: 'user-3',
    role: OrganizationRole.WRITER,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdvancedAuthService,
        {
          provide: getRepositoryToken(OrganizationMember),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Organization),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AdvancedAuthService>(AdvancedAuthService);
    memberRepository = module.get<Repository<OrganizationMember>>(getRepositoryToken(OrganizationMember));
    organizationRepository = module.get<Repository<Organization>>(getRepositoryToken(Organization));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));

    // Setup default mock implementations
    (mockOwnerMember.isOwner as jest.Mock).mockReturnValue(true);
    (mockOwnerMember.isEditor as jest.Mock).mockReturnValue(true);
    (mockOwnerMember.isWriter as jest.Mock).mockReturnValue(true);
    (mockOwnerMember.hasPermission as jest.Mock).mockReturnValue(true);

    (mockEditorMember.isOwner as jest.Mock).mockReturnValue(false);
    (mockEditorMember.isEditor as jest.Mock).mockReturnValue(true);
    (mockEditorMember.isWriter as jest.Mock).mockReturnValue(true);
    (mockEditorMember.hasPermission as jest.Mock).mockReturnValue(true);

    (mockWriterMember.isOwner as jest.Mock).mockReturnValue(false);
    (mockWriterMember.isEditor as jest.Mock).mockReturnValue(false);
    (mockWriterMember.isWriter as jest.Mock).mockReturnValue(true);
    (mockWriterMember.hasPermission as jest.Mock).mockReturnValue(false);
  });

  describe('hasPermission', () => {
    it('should return true for owner with any action', async () => {
      const context: PermissionContext = {
        userId: 'user-1',
        organizationId: 'org-1',
        action: 'delete',
      };
      jest.spyOn(organizationRepository, 'findOne').mockResolvedValue(mockOrganization);
      jest.spyOn(memberRepository, 'findOne').mockResolvedValue(createMockMember(mockOwnerMember));
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      const result = await service.hasPermission(context);
      expect(result.allowed).toBe(true);
    });

    it('should return false for inactive organization', async () => {
      const inactiveOrg = { ...mockOrganization, isActive: false };
      const context: PermissionContext = {
        userId: 'user-1',
        organizationId: 'org-1',
        action: 'read',
      };
      jest.spyOn(organizationRepository, 'findOne').mockResolvedValue(inactiveOrg);
      const result = await service.hasPermission(context);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBeDefined();
    });

    it('should return false for inactive user', async () => {
      const inactiveUser = createMockUser({ isActive: false });
      const context: PermissionContext = {
        userId: 'user-1',
        organizationId: 'org-1',
        action: 'read',
      };
      jest.spyOn(organizationRepository, 'findOne').mockResolvedValue(mockOrganization);
      jest.spyOn(memberRepository, 'findOne').mockResolvedValue(
        createMockMember({ user: inactiveUser })
      );
      const result = await service.hasPermission(context);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBeDefined();
    });

    it('should return false for inactive membership', async () => {
      const context: PermissionContext = {
        userId: 'user-1',
        organizationId: 'org-1',
        action: 'read',
        requireActiveMembership: true,
      };
      jest.spyOn(memberRepository, 'findOne').mockResolvedValue(createMockMember({
        isActive: false,
        user: createMockUser({ id: 'user-1', isActive: true }),
        organization: mockOrganization,
      }));
      const result = await service.hasPermission(context);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBeDefined();
    });

    it('should allow inactive membership when requireActiveMembership is false', async () => {
      const inactiveMember = createMockMember({ isActive: false });
      const context: PermissionContext = {
        userId: 'user-1',
        organizationId: 'org-1',
        action: 'read',
        requireActiveMembership: false,
      };
      jest.spyOn(organizationRepository, 'findOne').mockResolvedValue(mockOrganization);
      jest.spyOn(memberRepository, 'findOne').mockResolvedValue(inactiveMember);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      const result = await service.hasPermission(context);
      expect(result.allowed).toBe(true);
    });

    it('should return false for missing userId', async () => {
      const context: PermissionContext = {
        userId: '',
        organizationId: 'org-1',
        action: 'read',
      };
      const result = await service.hasPermission(context);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBeDefined();
    });

    it('should return false for writer trying to delete', async () => {
      const context: PermissionContext = {
        userId: 'user-3',
        organizationId: 'org-1',
        action: 'delete',
      };
      jest.spyOn(organizationRepository, 'findOne').mockResolvedValue(mockOrganization);
      jest.spyOn(memberRepository, 'findOne').mockResolvedValue(createMockMember(mockWriterMember));
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      const result = await service.hasPermission(context);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBeDefined();
    });

    it('should return true for editor managing users', async () => {
      const context: PermissionContext = {
        userId: 'user-2',
        organizationId: 'org-1',
        action: 'manage',
      };
      jest.spyOn(organizationRepository, 'findOne').mockResolvedValue(mockOrganization);
      jest.spyOn(memberRepository, 'findOne').mockResolvedValue(createMockMember(mockEditorMember));
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      const result = await service.hasPermission(context);
      expect(result.allowed).toBe(true);
    });
  });

  describe('checkComplexPermissions', () => {
    it('should return true for all valid permissions', async () => {
      // Mock user, organization, and membership to exist and be valid
      const user = { ...mockUser, isActive: true, isSuperAdmin: () => false };
      const organization = { ...mockOrganization, isActive: true };
      const member = { ...mockOwnerMember, isActive: true, user };
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(createMockUser());
      jest.spyOn(organizationRepository, 'findOne').mockResolvedValue(organization);
      jest.spyOn(memberRepository, 'findOne').mockResolvedValue(createMockMember());
      const check: ComplexPermissionCheck = {
        userId: 'user-1',
        checks: [
          { organizationId: 'org-1', requiredRole: OrganizationRole.OWNER, action: 'read' },
        ],
        requireAll: true,
      };
      const result = await service.checkComplexPermissions(check);
      expect(result.hasAllPermissions).toBe(true);
      expect(result.failedPermissions).toHaveLength(0);
      expect(result.validationResult.isValid).toBe(true);
    });

    it('should return false when user is inactive', async () => {
      const check: ComplexPermissionCheck = {
        userId: 'user-1',
        checks: [
          {
            organizationId: 'org-1',
            requiredRole: OrganizationRole.OWNER,
            action: 'read',
            requireActiveMembership: true,
          },
        ],
        requireAll: true,
      };
      // Simulate inactive user
      jest.spyOn(memberRepository, 'findOne').mockResolvedValue(createMockMember({
        id: 'member-1',
        user: createMockUser({ id: 'user-1', isActive: false }),
        isActive: true,
        organization: mockOrganization,
      }));
      const result = await service.checkComplexPermissions(check);
      expect(result.hasAllPermissions).toBe(false);
      expect(result.failedPermissions).toContain('User not found or inactive');
      expect(result.validationResult.isValid).toBe(false);
    });

    it('should return partial success when requireAll is false', async () => {
      const check: ComplexPermissionCheck = {
        userId: 'user-1',
        checks: [
          {
            organizationId: 'org-1',
            requiredRole: OrganizationRole.OWNER,
            action: 'read',
          },
          {
            organizationId: 'org-2',
            requiredRole: OrganizationRole.OWNER,
            action: 'read',
          },
        ],
        requireAll: false,
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(organizationRepository, 'findOne').mockResolvedValue(mockOrganization);
      jest.spyOn(memberRepository, 'findOne')
        .mockResolvedValueOnce(createMockMember(mockOwnerMember))
        .mockResolvedValueOnce(null);

      const result = await service.checkComplexPermissions(check);

      expect(result.hasAllPermissions).toBe(true); // Partial success allowed
      expect(result.failedPermissions).toHaveLength(1);
    });
  });

  describe('canManageUser', () => {
    it('should return true for owner managing editor', async () => {
      jest.spyOn(userRepository, 'findOne')
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockUser);
      jest.spyOn(memberRepository, 'findOne')
        .mockResolvedValueOnce(createMockMember(mockOwnerMember))
        .mockResolvedValueOnce(createMockMember(mockEditorMember));

      const result = await service.canManageUser('user-1', 'user-2', 'org-1');
      expect(result).toBe(true);
    });

    it('should return false for editor managing owner', async () => {
      jest.spyOn(userRepository, 'findOne')
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockUser);
      jest.spyOn(memberRepository, 'findOne')
        .mockResolvedValueOnce(createMockMember(mockEditorMember))
        .mockResolvedValueOnce(createMockMember(mockOwnerMember));

      const result = await service.canManageUser('user-2', 'user-1', 'org-1');
      expect(result).toBe(false);
    });

    it('should return true for owner managing self', async () => {
      jest.spyOn(memberRepository, 'findOne').mockResolvedValue(createMockMember(mockOwnerMember));

      const result = await service.canManageUser('user-1', 'user-1', 'org-1');
      expect(result).toBe(true);
    });

    it('should return false for editor managing self', async () => {
      jest.spyOn(memberRepository, 'findOne').mockResolvedValue(createMockMember(mockEditorMember));

      const result = await service.canManageUser('user-2', 'user-2', 'org-1');
      expect(result).toBe(false);
    });

    it('should return false for inactive target user', async () => {
      const inactiveUser = createMockUser({ isActive: false });

      jest.spyOn(userRepository, 'findOne')
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(inactiveUser);

      const result = await service.canManageUser('user-1', 'user-2', 'org-1');
      expect(result).toBe(false);
    });

    it('should throw BadRequestException for missing parameters', async () => {
      await expect(service.canManageUser('', 'user-2', 'org-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null organization gracefully', async () => {
      // Simulate user not found
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      const context: PermissionContext = {
        userId: 'user-1',
        organizationId: 'org-404',
        action: 'read',
      };
      const result = await service.hasPermission(context);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('User not found');
    });
    it('should handle null membership gracefully', async () => {
      // Simulate user not found
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      const context: PermissionContext = {
        userId: 'user-1',
        organizationId: 'org-1',
        action: 'read',
      };
      const result = await service.hasPermission(context);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('User not found');
    });
  });
}); 