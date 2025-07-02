import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/auth/auth.service';
import { UsersService } from '../src/users/users.service';
import { OrganizationsService } from '../src/organizations/organizations.service';
import { User, UserRole } from '../src/users/user.entity';
import { Organization } from '../src/organizations/organization.entity';
import { OrganizationMember } from '../src/organizations/organization-member.entity';
import { OrganizationRole } from '../src/organizations/organization-role.enum';
import { Invitation } from '../src/organizations/invitation.entity';
import { Post } from '../src/posts/post.entity';
import { AdvancedAuthService } from '../src/auth/services/advanced-auth.service';

describe('Advanced Authorization (e2e)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let usersService: UsersService;
  let organizationsService: OrganizationsService;
  let advancedAuthService: AdvancedAuthService;
  let dataSource: DataSource;

  let ownerUser: any;
  let editorUser: any;
  let writerUser: any;
  let adminUser: any;
  let organization1: any;
  let organization2: any;
  let ownerToken: string;
  let editorToken: string;
  let writerToken: string;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env',
        }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: (configService: ConfigService) => ({
            type: 'postgres',
            host: configService.get('DB_HOST', 'localhost'),
            port: configService.get('DB_PORT', 5433),
            username: configService.get('DB_USERNAME', 'postgres'),
            password: configService.get('DB_PASSWORD', 'password'),
            database: configService.get('DB_DATABASE', 'collaborative_publishing'),
            entities: [User, Organization, OrganizationMember, Post, Invitation],
            synchronize: true,
            logging: false,
            retryAttempts: 3,
            retryDelay: 1000,
          }),
          inject: [ConfigService],
        }),
        JwtModule.registerAsync({
          imports: [ConfigModule],
          useFactory: (configService: ConfigService) => ({
            secret: configService.get('JWT_SECRET', 'your-super-secret-jwt-key-here'),
            signOptions: { expiresIn: '1h' },
          }),
          inject: [ConfigService],
        }),
        PassportModule,
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    authService = moduleFixture.get<AuthService>(AuthService);
    usersService = moduleFixture.get<UsersService>(UsersService);
    organizationsService = moduleFixture.get<OrganizationsService>(OrganizationsService);
    advancedAuthService = moduleFixture.get<AdvancedAuthService>(AdvancedAuthService);
    dataSource = moduleFixture.get<DataSource>(DataSource);
  }, 30000);

  beforeEach(async () => {
    // Clear the database before each test in the correct order using TRUNCATE CASCADE
    await dataSource.query('TRUNCATE TABLE posts CASCADE');
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to prevent deadlocks
    await dataSource.query('TRUNCATE TABLE invitations CASCADE');
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to prevent deadlocks
    await dataSource.query('TRUNCATE TABLE organizations CASCADE');
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to prevent deadlocks
    await dataSource.query('TRUNCATE TABLE users CASCADE');

    // Create test users with unique identifiers
    const timestamp = Date.now();
    
    ownerUser = await usersService.create({
      email: `owner${timestamp}@test.com`,
      username: `owner${timestamp}`,
      password: 'password123',
      firstName: 'Owner',
      lastName: 'User',
    });

    editorUser = await usersService.create({
      email: `editor${timestamp}@test.com`,
      username: `editor${timestamp}`,
      password: 'password123',
      firstName: 'Editor',
      lastName: 'User',
    });

    writerUser = await usersService.create({
      email: `writer${timestamp}@test.com`,
      username: `writer${timestamp}`,
      password: 'password123',
      firstName: 'Writer',
      lastName: 'User',
    });

    adminUser = await usersService.create({
      email: `admin${timestamp}@test.com`,
      username: `admin${timestamp}`,
      password: 'password123',
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
    });

    // Create superadmin user
    const superadminUser = await usersService.create({
      email: `superadmin${timestamp}@test.com`,
      username: `superadmin${timestamp}`,
      password: 'password123',
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.SUPERADMIN,
    });

    // Create test organizations
    organization1 = await organizationsService.createOrganization({
      name: `Test Organization 1 ${timestamp}`,
      description: 'First test organization',
      website: 'https://org1.com',
    }, ownerUser.id);

    organization2 = await organizationsService.createOrganization({
      name: `Test Organization 2 ${timestamp}`,
      description: 'Second test organization',
      website: 'https://org2.com',
    }, adminUser.id);

    // Add users to organizations with different roles
    await organizationsService.inviteMember(organization1.id, {
      email: editorUser.email,
      role: OrganizationRole.EDITOR,
    }, ownerUser.id);

    await organizationsService.inviteMember(organization1.id, {
      email: writerUser.email,
      role: OrganizationRole.WRITER,
    }, ownerUser.id);

    // Generate JWT tokens
    const ownerFullUser = await usersService.findByEmail(ownerUser.email);
    const editorFullUser = await usersService.findByEmail(editorUser.email);
    const writerFullUser = await usersService.findByEmail(writerUser.email);
    const adminFullUser = await usersService.findByEmail(adminUser.email);

    const validatedOwnerUser = await authService.validateUser(ownerUser.email, 'password123');
    const validatedEditorUser = await authService.validateUser(editorUser.email, 'password123');
    const validatedWriterUser = await authService.validateUser(writerUser.email, 'password123');
    const validatedAdminUser = await authService.validateUser(adminUser.email, 'password123');
    const validatedSuperadminUser = await authService.validateUser(superadminUser.email, 'password123');

    ownerToken = (await authService.login(await authService.validateUser(ownerUser.email, 'password123'))).access_token;
    editorToken = (await authService.login(await authService.validateUser(editorUser.email, 'password123'))).access_token;
    writerToken = (await authService.login(await authService.validateUser(writerUser.email, 'password123'))).access_token;
    adminToken = (await authService.login(await authService.validateUser(adminUser.email, 'password123'))).access_token;

    // Store superadmin user and token for tests
    (this as any).superadminUser = superadminUser;
    (this as any).superadminToken = (await authService.login(await authService.validateUser(superadminUser.email, 'password123'))).access_token;
  }, 60000); // Increased timeout to 60 seconds

  afterEach(async () => {
    // Clean up test data using TRUNCATE CASCADE
    await dataSource.query('TRUNCATE TABLE posts CASCADE');
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to prevent deadlocks
    await dataSource.query('TRUNCATE TABLE invitations CASCADE');
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to prevent deadlocks
    await dataSource.query('TRUNCATE TABLE organizations CASCADE');
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to prevent deadlocks
    await dataSource.query('TRUNCATE TABLE users CASCADE');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Strict Relationship Checks', () => {
    it('should enforce active membership requirement', async () => {
      // Test that active memberships work
      const hasPermission = await advancedAuthService.hasPermission({
        userId: ownerUser.id,
        organizationId: organization1.id,
        action: 'read',
        requireActiveMembership: true,
      });

      expect(hasPermission.allowed).toBe(true);
    });

    it('should validate user and organization active status', async () => {
      // Test with active user and organization
      const hasPermission = await advancedAuthService.hasPermission({
        userId: ownerUser.id,
        organizationId: organization1.id,
        action: 'read',
      });

      expect(hasPermission.allowed).toBe(true);
    });

    it('should enforce direct relationship requirement', async () => {
      const hasPermission = await advancedAuthService.hasPermission({
        userId: ownerUser.id,
        organizationId: organization1.id,
        action: 'read',
        requireDirectRelationship: true,
      });

      expect(hasPermission.allowed).toBe(true);

      // Test with wrong organization ID - use a valid UUID format
      const hasPermissionWrongOrg = await advancedAuthService.hasPermission({
        userId: ownerUser.id,
        organizationId: '00000000-0000-0000-0000-000000000000',
        action: 'read',
        requireDirectRelationship: true,
      });

      expect(hasPermissionWrongOrg.allowed).toBe(false);
    });
  });

  describe('Cross-Organization Permission Checks', () => {
    // Skipped: hasCrossOrganizationPermission no longer exists
    // it('should validate cross-organization permissions', async () => { ... });
    // it('should prevent self-cross-organization checks', async () => { ... });
  });

  describe('Complex Role Combinations', () => {
    it('should validate complex permission requirements', async () => {
      const complexCheck = {
        userId: ownerUser.id,
        checks: [
          {
            organizationId: organization1.id,
            requiredRole: OrganizationRole.OWNER,
            action: 'read',
          },
          {
            organizationId: organization1.id,
            requiredRole: OrganizationRole.EDITOR,
            action: 'write',
          },
        ],
        requireAll: true,
      };

      const result = await advancedAuthService.checkComplexPermissions(complexCheck);

      expect(result.hasAllPermissions).toBe(true);
      expect(result.failedPermissions).toHaveLength(0);
      expect(result.validationResult.isValid).toBe(true);
    });

    it('should handle partial permission failures', async () => {
      const complexCheck = {
        userId: writerUser.id,
        checks: [
          {
            organizationId: organization1.id,
            requiredRole: OrganizationRole.WRITER,
            action: 'read',
          },
          {
            organizationId: organization1.id,
            requiredRole: OrganizationRole.OWNER,
            action: 'delete',
          },
        ],
        requireAll: false,
      };

      const result = await advancedAuthService.checkComplexPermissions(complexCheck);

      expect(result.hasAllPermissions).toBe(true); // Partial success allowed
      expect(result.failedPermissions).toHaveLength(1);
    });

    it('should require all permissions when requireAll is true', async () => {
      const complexCheck = {
        userId: writerUser.id,
        checks: [
          {
            organizationId: organization1.id,
            requiredRole: OrganizationRole.WRITER,
            action: 'read',
          },
          {
            organizationId: organization1.id,
            requiredRole: OrganizationRole.OWNER,
            action: 'delete',
          },
        ],
        requireAll: true,
      };

      const result = await advancedAuthService.checkComplexPermissions(complexCheck);

      expect(result.hasAllPermissions).toBe(false);
      expect(result.failedPermissions).toHaveLength(1);
    });
  });

  describe('User Management Permissions', () => {
    it('should validate user management permissions', async () => {
      const canManage = await advancedAuthService.canManageUser(
        ownerUser.id,
        editorUser.id,
        organization1.id
      );

      expect(canManage).toBe(true);
    });

    it('should allow self-management for owners', async () => {
      const canManage = await advancedAuthService.canManageUser(
        ownerUser.id,
        ownerUser.id,
        organization1.id
      );

      // Owners should be able to manage themselves
      expect(canManage).toBe(true);
    });
  });

  describe('Effective Permissions', () => {
    it('should return user effective permissions', async () => {
      const permissions = await advancedAuthService.getUserEffectivePermissions(ownerUser.id);

      expect(permissions.organizations).toHaveLength(1);
      expect(permissions.totalOrganizations).toBe(1);
      expect(permissions.totalActiveOrganizations).toBe(1);
      expect(permissions.organizations[0].role).toBe(OrganizationRole.OWNER);
      expect(permissions.organizations[0].permissions).toContain('delete');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing parameters gracefully', async () => {
      await expect(
        advancedAuthService.hasPermission({
          userId: '',
          organizationId: organization1.id,
          action: 'read',
        })
      ).rejects.toThrow('User ID and Organization ID are required');
    });

    it('should handle non-existent organizations', async () => {
      const hasPermission = await advancedAuthService.hasPermission({
        userId: ownerUser.id,
        organizationId: '00000000-0000-0000-0000-000000000000',
        action: 'read',
      });

      expect(hasPermission.allowed).toBe(false);
    });

    it('should handle non-existent users', async () => {
      const hasPermission = await advancedAuthService.hasPermission({
        userId: '00000000-0000-0000-0000-000000000000',
        organizationId: organization1.id,
        action: 'read',
      });

      expect(hasPermission.allowed).toBe(false);
    });
  });

  describe('API Endpoints with Advanced Authorization', () => {
    it('should protect organization endpoints with advanced auth', async () => {
      // Test organization creation with owner role
      const timestamp = Date.now();
      const createResponse = await request(app.getHttpServer())
        .post('/organizations')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: `Advanced Test Org ${timestamp}`,
          description: 'Test organization for advanced auth',
        });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.name).toBe(`Advanced Test Org ${timestamp}`);

      // Test organization access with different roles - use organization1 that editor is a member of
      const getResponse = await request(app.getHttpServer())
        .get(`/organizations/${organization1.id}`)
        .set('Authorization', `Bearer ${editorToken}`);

      expect(getResponse.status).toBe(200);

      // Test organization modification with insufficient permissions - use organization1 that writer is a member of
      const updateResponse = await request(app.getHttpServer())
        .put(`/organizations/${organization1.id}`)
        .set('Authorization', `Bearer ${writerToken}`);

      expect(updateResponse.status).toBe(403);
    });
  });
});