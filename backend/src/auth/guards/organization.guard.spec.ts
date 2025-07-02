import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ForbiddenException } from '@nestjs/common';
import { OrganizationGuard } from './organization.guard';
import { UsersService } from '../../users/users.service';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { OrganizationsService } from '../../organizations/organizations.service';

describe('OrganizationGuard', () => {
  let guard: OrganizationGuard;
  let reflector: Reflector;
  let usersService: UsersService;
  let organizationsService: OrganizationsService;

  const mockUsersService = {
    getUserRoleInOrganization: jest.fn(),
  };

  const mockReflector = {
    getAllAndOverride: jest.fn(),
    get: jest.fn(),
  };

  const mockOrganizationsService = {
    organizationRepository: {
      findOne: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: OrganizationsService,
          useValue: mockOrganizationsService,
        },
      ],
    }).compile();

    guard = module.get<OrganizationGuard>(OrganizationGuard);
    reflector = module.get<Reflector>(Reflector);
    usersService = module.get<UsersService>(UsersService);
    organizationsService = module.get<OrganizationsService>(OrganizationsService);

    // Mock organizationRepository.findOne to return a valid organization by default
    mockOrganizationsService.organizationRepository.findOne.mockResolvedValue({ id: 'org-1', isActive: true });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    const mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { id: 'user-1' },
          params: { id: 'org-1' },
          body: {},
          query: {},
        }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    };

    it('should return true when no roles are required', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(null);

      const result = await guard.canActivate(mockExecutionContext as any);

      expect(result).toBe(true);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(
        ROLES_KEY,
        [mockExecutionContext.getHandler(), mockExecutionContext.getClass()]
      );
    });

    it('should return true when user has required role', async () => {
      const requiredRoles = ['owner', 'editor'];
      mockReflector.getAllAndOverride.mockReturnValue(requiredRoles);
      mockUsersService.getUserRoleInOrganization.mockResolvedValue('owner');

      const result = await guard.canActivate(mockExecutionContext as any);

      expect(result).toBe(true);
      expect(mockUsersService.getUserRoleInOrganization).toHaveBeenCalledWith('user-1', 'org-1');
    });

    it('should return true when user has one of multiple required roles', async () => {
      const requiredRoles = ['owner', 'editor'];
      mockReflector.getAllAndOverride.mockReturnValue(requiredRoles);
      mockUsersService.getUserRoleInOrganization.mockResolvedValue('editor');

      const result = await guard.canActivate(mockExecutionContext as any);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user is not specified', async () => {
      const requiredRoles = ['owner'];
      mockReflector.getAllAndOverride.mockReturnValue(requiredRoles);

      const contextWithoutUser = {
        switchToHttp: () => ({
          getRequest: () => ({
            params: { id: 'org-1' },
            body: {},
            query: {},
          }),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      };

      await expect(guard.canActivate(contextWithoutUser as any)).rejects.toThrow(
        new ForbiddenException('User or organization not specified')
      );
    });

    it('should throw ForbiddenException when organization is not specified', async () => {
      const requiredRoles = ['owner'];
      mockReflector.getAllAndOverride.mockReturnValue(requiredRoles);
      // Simulate missing organization by returning undefined
      mockOrganizationsService.organizationRepository.findOne.mockResolvedValueOnce(undefined);

      const contextWithoutOrg = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 'user-1' },
            params: {},
            body: {},
            query: {},
          }),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      };

      await expect(guard.canActivate(contextWithoutOrg as any)).rejects.toThrow(
        new ForbiddenException('User or organization not specified')
      );
    });

    it('should throw ForbiddenException for inactive organization', async () => {
      const requiredRoles = ['owner'];
      mockReflector.getAllAndOverride.mockReturnValue(requiredRoles);
      // Simulate inactive organization
      mockOrganizationsService.organizationRepository.findOne.mockResolvedValueOnce({ isActive: false });

      const contextWithInactiveOrg = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 'user-1' },
            params: { id: 'org-1' },
            body: {},
            query: {},
          }),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      };

      await expect(guard.canActivate(contextWithInactiveOrg as any)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when user has insufficient role', async () => {
      const requiredRoles = ['owner'];
      mockReflector.getAllAndOverride.mockReturnValue(requiredRoles);
      mockUsersService.getUserRoleInOrganization.mockResolvedValue('writer');

      await expect(guard.canActivate(mockExecutionContext as any)).rejects.toThrow(
        new ForbiddenException('Insufficient role for this organization')
      );
    });

    it('should throw ForbiddenException when user has no role in organization', async () => {
      const requiredRoles = ['owner'];
      mockReflector.getAllAndOverride.mockReturnValue(requiredRoles);
      mockUsersService.getUserRoleInOrganization.mockResolvedValue(null);

      await expect(guard.canActivate(mockExecutionContext as any)).rejects.toThrow(
        new ForbiddenException('Insufficient role for this organization')
      );
    });

    it('should extract orgId from request body', async () => {
      const requiredRoles = ['owner'];
      mockReflector.getAllAndOverride.mockReturnValue(requiredRoles);
      mockUsersService.getUserRoleInOrganization.mockResolvedValue('owner');

      const contextWithBodyOrg = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 'user-1' },
            params: {},
            body: { organizationId: 'org-2' },
            query: {},
          }),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      };

      const result = await guard.canActivate(contextWithBodyOrg as any);

      expect(result).toBe(true);
      expect(mockUsersService.getUserRoleInOrganization).toHaveBeenCalledWith('user-1', 'org-2');
    });

    it('should extract orgId from query parameters', async () => {
      const requiredRoles = ['owner'];
      mockReflector.getAllAndOverride.mockReturnValue(requiredRoles);
      mockUsersService.getUserRoleInOrganization.mockResolvedValue('owner');

      const contextWithQueryOrg = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 'user-1' },
            params: {},
            body: {},
            query: { organizationId: 'org-3' },
          }),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      };

      const result = await guard.canActivate(contextWithQueryOrg as any);

      expect(result).toBe(true);
      expect(mockUsersService.getUserRoleInOrganization).toHaveBeenCalledWith('user-1', 'org-3');
    });

    it('should prioritize params over body and query for orgId', async () => {
      const requiredRoles = ['owner'];
      mockReflector.getAllAndOverride.mockReturnValue(requiredRoles);
      mockUsersService.getUserRoleInOrganization.mockResolvedValue('owner');

      const contextWithMultipleOrgIds = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 'user-1' },
            params: { id: 'org-params' },
            body: { organizationId: 'org-body' },
            query: { organizationId: 'org-query' },
          }),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      };

      const result = await guard.canActivate(contextWithMultipleOrgIds as any);

      expect(result).toBe(true);
      expect(mockUsersService.getUserRoleInOrganization).toHaveBeenCalledWith('user-1', 'org-params');
    });
  });
}); 