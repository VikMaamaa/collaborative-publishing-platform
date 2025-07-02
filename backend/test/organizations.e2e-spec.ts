import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AppModule } from '../src/app.module';
import { User, UserRole } from '../src/users/user.entity';
import { Organization } from '../src/organizations/organization.entity';
import { OrganizationMember } from '../src/organizations/organization-member.entity';
import { OrganizationRole } from '../src/organizations/organization-role.enum';
import { Post } from '../src/posts/post.entity';
import { UsersService } from '../src/users/users.service';
import { AuthService } from '../src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import { OrganizationsModule } from '../src/organizations/organizations.module';
import { UsersModule } from '../src/users/users.module';
import { AuthModule } from '../src/auth/auth.module';

describe('OrganizationsController (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let testUser1: User;
  let testUser2: User;

  // Helper function to create an organization for testing
  async function createTestOrganization(user: User, name?: string): Promise<Organization> {
    const token = jwtService.sign({ 
      sub: user.id, 
      email: user.email,
      username: user.username,
      role: user.role
    });

    const orgName = name || `Test Organization ${Date.now()}`;
    const response = await request(app.getHttpServer())
      .post('/organizations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: orgName,
        description: 'A test organization',
      })
      .expect(201);

    return response.body;
  }

  beforeAll(async () => {
    // Set JWT secret for testing
    process.env.JWT_SECRET = 'test-jwt-secret-key';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot(),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: 'localhost',
          port: 5433,
          username: 'postgres',
          password: 'password',
          database: 'collaborative_publishing',
          entities: [User, Organization, OrganizationMember, Post],
          synchronize: true,
          logging: false,
        }),
        OrganizationsModule,
        UsersModule,
        AuthModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    jwtService = moduleFixture.get<JwtService>(JwtService);
    const usersService = moduleFixture.get<UsersService>(UsersService);
    await app.init();

    // Create test users directly through the service
    try {
      await usersService.create({
        email: 'orgtest1@example.com',
        username: 'orgtestuser1',
        password: 'password123',
        firstName: 'Org',
        lastName: 'Test1',
      });
    } catch (error) {
      // User might already exist, continue
    }
    
    testUser1 = await usersService.findByEmail('orgtest1@example.com');
    if (!testUser1) {
      throw new Error('Failed to create or find test user 1');
    }

    try {
      await usersService.create({
        email: 'orgtest2@example.com',
        username: 'orgtestuser2',
        password: 'password123',
        firstName: 'Org',
        lastName: 'Test2',
      });
    } catch (error) {
      // User might already exist, continue
    }
    
    testUser2 = await usersService.findByEmail('orgtest2@example.com');
    if (!testUser2) {
      throw new Error('Failed to create or find test user 2');
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/organizations (POST)', () => {
    it('should create a new organization', async () => {
      const token = jwtService.sign({ 
        sub: testUser1.id, 
        email: testUser1.email,
        username: testUser1.username,
        role: testUser1.role
      });

      const uniqueOrgName = `Test Organization ${Date.now()}`;
      const response = await request(app.getHttpServer())
        .post('/organizations')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: uniqueOrgName,
          description: 'A test organization',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(uniqueOrgName);
      expect(response.body.description).toBe('A test organization');
      expect(response.body.isActive).toBe(true);

      // Test that the user can access the organization they just created
      const getResponse = await request(app.getHttpServer())
        .get(`/organizations/${response.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Debug: Check if the member was created
      const usersService = app.get(UsersService);
      const userRole = await usersService.getUserRoleInOrganization(testUser1.id, response.body.id);
    });

    it('should return 409 when organization name already exists', async () => {
      const token = jwtService.sign({ 
        sub: testUser1.id, 
        email: testUser1.email,
        username: testUser1.username,
        role: testUser1.role
      });

      // First create an organization
      const uniqueOrgName = `Duplicate Test Organization ${Date.now()}`;
      await request(app.getHttpServer())
        .post('/organizations')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: uniqueOrgName,
          description: 'First organization',
        });

      // Then try to create another with the same name
      await request(app.getHttpServer())
        .post('/organizations')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: uniqueOrgName,
          description: 'Another test organization',
        })
        .expect(409);
    });
  });

  describe('/organizations (GET)', () => {
    it('should return all organizations for user', async () => {
      // Create an organization first
      await createTestOrganization(testUser1);

      const token = jwtService.sign({ 
        sub: testUser1.id, 
        email: testUser1.email,
        username: testUser1.username,
        role: testUser1.role
      });

      const response = await request(app.getHttpServer())
        .get('/organizations')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
    });
  });

  describe('/organizations/:id (GET)', () => {
    it('should return a specific organization', async () => {
      // Create an organization first
      const organization = await createTestOrganization(testUser1);

      const token = jwtService.sign({ 
        sub: testUser1.id, 
        email: testUser1.email,
        username: testUser1.username,
        role: testUser1.role
      });

      const response = await request(app.getHttpServer())
        .get(`/organizations/${organization.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.id).toBe(organization.id);
      expect(response.body.name).toBe(organization.name);
    });

    it('should return 404 for non-existent organization', async () => {
      const token = jwtService.sign({ 
        sub: testUser1.id, 
        email: testUser1.email,
        username: testUser1.username,
        role: testUser1.role
      });

      await request(app.getHttpServer())
        .get('/organizations/non-existent-id')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('should return 403 for non-member user', async () => {
      // Create an organization with user1
      const organization = await createTestOrganization(testUser1);

      const token = jwtService.sign({ 
        sub: testUser2.id, 
        email: testUser2.email,
        username: testUser2.username,
        role: testUser2.role
      });

      await request(app.getHttpServer())
        .get(`/organizations/${organization.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('/organizations/:id (PUT)', () => {
    it('should update an organization', async () => {
      // Create an organization first
      const organization = await createTestOrganization(testUser1);

      const token = jwtService.sign({ 
        sub: testUser1.id, 
        email: testUser1.email,
        username: testUser1.username,
        role: testUser1.role
      });

      const uniqueName = 'Updated Test Organization ' + Date.now();

      const response = await request(app.getHttpServer())
        .put(`/organizations/${organization.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: uniqueName,
          description: 'Updated description',
        })
        .expect(200);

      expect(response.body.name).toBe(uniqueName);
      expect(response.body.description).toBe('Updated description');
    });

    it('should return 404 for non-existent organization', async () => {
      const token = jwtService.sign({ 
        sub: testUser1.id, 
        email: testUser1.email,
        username: testUser1.username,
        role: testUser1.role
      });

      await request(app.getHttpServer())
        .put('/organizations/non-existent-id')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Name',
        })
        .expect(404);
    });
  });

  describe('/organizations/:id/members (GET)', () => {
    it('should return organization members', async () => {
      // Create an organization first
      const organization = await createTestOrganization(testUser1);

      const token = jwtService.sign({ 
        sub: testUser1.id, 
        email: testUser1.email,
        username: testUser1.username,
        role: testUser1.role
      });

      const response = await request(app.getHttpServer())
        .get(`/organizations/${organization.id}/members`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('userId');
      expect(response.body[0]).toHaveProperty('role');
    });
  });

  describe('/organizations/:id/members (POST)', () => {
    it('should invite a member to organization', async () => {
      // Create an organization first
      const organization = await createTestOrganization(testUser1);

      const token = jwtService.sign({ 
        sub: testUser1.id, 
        email: testUser1.email,
        username: testUser1.username,
        role: testUser1.role
      });

      const response = await request(app.getHttpServer())
        .post(`/organizations/${organization.id}/members`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: testUser2.email,
          role: OrganizationRole.WRITER,
        })
        .expect(201);

      expect(response.body.userId).toBe(testUser2.id);
      expect(response.body.role).toBe(OrganizationRole.WRITER);
    });

    it('should return 409 when user is already a member', async () => {
      // Create an organization first
      const organization = await createTestOrganization(testUser1);

      const token = jwtService.sign({ 
        sub: testUser1.id, 
        email: testUser1.email,
        username: testUser1.username,
        role: testUser1.role
      });

      // First invite the user
      await request(app.getHttpServer())
        .post(`/organizations/${organization.id}/members`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: testUser2.email,
          role: OrganizationRole.WRITER,
        });

      // Then try to invite the same user again
      await request(app.getHttpServer())
        .post(`/organizations/${organization.id}/members`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: testUser2.email,
          role: OrganizationRole.WRITER,
        })
        .expect(409);
    });

    it('should return 404 when user not found', async () => {
      // Create an organization first
      const organization = await createTestOrganization(testUser1);

      const token = jwtService.sign({ 
        sub: testUser1.id, 
        email: testUser1.email,
        username: testUser1.username,
        role: testUser1.role
      });

      await request(app.getHttpServer())
        .post(`/organizations/${organization.id}/members`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: 'nonexistent@example.com',
          role: OrganizationRole.WRITER,
        })
        .expect(404);
    });
  });

  describe('/organizations/:id/members/:memberId/role (PUT)', () => {
    it('should update member role', async () => {
      // Create an organization first
      const organization = await createTestOrganization(testUser1);

      const token = jwtService.sign({ 
        sub: testUser1.id, 
        email: testUser1.email,
        username: testUser1.username,
        role: testUser1.role
      });

      // First invite user2
      await request(app.getHttpServer())
        .post(`/organizations/${organization.id}/members`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: testUser2.email,
          role: OrganizationRole.WRITER,
        });

      // Then update their role
      const response = await request(app.getHttpServer())
        .put(`/organizations/${organization.id}/members/${testUser2.id}/role`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          role: OrganizationRole.EDITOR,
        })
        .expect(200);

      expect(response.body.role).toBe(OrganizationRole.EDITOR);
    });
  });

  describe('/organizations/:id/members/:memberId (DELETE)', () => {
    it('should remove a member from organization', async () => {
      // Create an organization first
      const organization = await createTestOrganization(testUser1);

      const token = jwtService.sign({ 
        sub: testUser1.id, 
        email: testUser1.email,
        username: testUser1.username,
        role: testUser1.role
      });

      // First invite user2
      const inviteResponse = await request(app.getHttpServer())
        .post(`/organizations/${organization.id}/members`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: testUser2.email,
          role: OrganizationRole.WRITER,
        })
        .expect(201);

      const memberId = inviteResponse.body.id;

      // Then remove them using the correct memberId
      await request(app.getHttpServer())
        .delete(`/organizations/${organization.id}/members/${memberId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          reason: 'Test removal',
        })
        .expect(204);
    });
  });

  describe('/organizations/:id/leave (POST)', () => {
    it('should allow user to leave organization', async () => {
      // Create an organization first
      const organization = await createTestOrganization(testUser1);

      const token1 = jwtService.sign({ 
        sub: testUser1.id, 
        email: testUser1.email,
        username: testUser1.username,
        role: testUser1.role
      });

      // Add user2 to the organization
      await request(app.getHttpServer())
        .post(`/organizations/${organization.id}/members`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          email: testUser2.email,
          role: OrganizationRole.WRITER,
        });

      // Now test leaving
      const token2 = jwtService.sign({ 
        sub: testUser2.id, 
        email: testUser2.email,
        username: testUser2.username,
        role: testUser2.role
      });
      await request(app.getHttpServer())
        .post(`/organizations/${organization.id}/leave`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(204);
    });
  });

  describe('/organizations/:id (DELETE)', () => {
    it('should delete an organization', async () => {
      // Create an organization first
      const organization = await createTestOrganization(testUser1);

      const token = jwtService.sign({ 
        sub: testUser1.id, 
        email: testUser1.email,
        username: testUser1.username,
        role: testUser1.role
      });

      await request(app.getHttpServer())
        .delete(`/organizations/${organization.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);
    });
  });
}); 