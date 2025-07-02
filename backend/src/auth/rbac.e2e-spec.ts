import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { AuthModule } from './auth.module';
import { UsersModule } from '../users/users.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { User, UserRole } from '../users/user.entity';
import { Organization } from '../organizations/organization.entity';
import { OrganizationMember, OrganizationRole } from '../organizations/organization-member.entity';
import { Post } from '../posts/post.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

describe('RBAC Integration Tests', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let organizationRepository: Repository<Organization>;
  let organizationMemberRepository: Repository<OrganizationMember>;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [() => ({ JWT_SECRET: 'test-secret-key' })],
        }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT) || 5433,
          username: process.env.DB_USERNAME || 'postgres',
          password: process.env.DB_PASSWORD || 'password',
          database: process.env.DB_DATABASE || 'collaborative_publishing',
          entities: [User, Organization, OrganizationMember, Post],
          synchronize: true,
          logging: false,
        }),
        PassportModule,
        AuthModule,
        UsersModule,
        OrganizationsModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Add validation pipe
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));

    // Set global prefix
    app.setGlobalPrefix('api');
    
    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    organizationRepository = moduleFixture.get<Repository<Organization>>(getRepositoryToken(Organization));
    organizationMemberRepository = moduleFixture.get<Repository<OrganizationMember>>(getRepositoryToken(OrganizationMember));
    dataSource = moduleFixture.get<DataSource>(DataSource);
    await app.init();
  }, 30000);

  beforeEach(async () => {
    // Clear the database before each test
    await dataSource.query('DELETE FROM posts');
    await dataSource.query('DELETE FROM organization_members');
    await dataSource.query('DELETE FROM organizations');
    await dataSource.query('DELETE FROM users');
    // Wait for DB consistency
    await new Promise(res => setTimeout(res, 100));
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('RBAC with Organization Roles', () => {
    let ownerUser: User;
    let editorUser: User;
    let writerUser: User;
    let outsiderUser: User;
    let organization: Organization;
    let ownerToken: string;
    let editorToken: string;
    let writerToken: string;
    let outsiderToken: string;

    beforeEach(async () => {
      // Create users
      const hashedPassword = await bcrypt.hash('password123', 12);
      
      ownerUser = await userRepository.save({
        email: 'owner@example.com',
        username: 'owner',
        password: hashedPassword,
        firstName: 'Owner',
        lastName: 'User',
      });
      if (!ownerUser.id) throw new Error('Owner user not saved');

      editorUser = await userRepository.save({
        email: 'editor@example.com',
        username: 'editor',
        password: hashedPassword,
        firstName: 'Editor',
        lastName: 'User',
      });
      if (!editorUser.id) throw new Error('Editor user not saved');

      writerUser = await userRepository.save({
        email: 'writer@example.com',
        username: 'writer',
        password: hashedPassword,
        firstName: 'Writer',
        lastName: 'User',
      });
      if (!writerUser.id) throw new Error('Writer user not saved');

      outsiderUser = await userRepository.save({
        email: 'outsider@example.com',
        username: 'outsider',
        password: hashedPassword,
        firstName: 'Outsider',
        lastName: 'User',
      });
      if (!outsiderUser.id) throw new Error('Outsider user not saved');

      // Wait for DB consistency
      await new Promise(res => setTimeout(res, 300));

      // Create organization
      organization = await organizationRepository.save({
        name: 'Test Organization',
        description: 'Test Description',
        website: 'https://test.com',
      });
      if (!organization.id) throw new Error('Organization not saved');

      // Wait for DB consistency
      await new Promise(res => setTimeout(res, 300));

      // Create organization memberships
      await organizationMemberRepository.save({
        userId: ownerUser.id,
        organizationId: organization.id,
        role: OrganizationRole.OWNER,
        isActive: true,
      });

      await organizationMemberRepository.save({
        userId: editorUser.id,
        organizationId: organization.id,
        role: OrganizationRole.EDITOR,
        isActive: true,
      });

      await organizationMemberRepository.save({
        userId: writerUser.id,
        organizationId: organization.id,
        role: OrganizationRole.WRITER,
        isActive: true,
      });

      // Get auth tokens
      const ownerLoginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'owner@example.com',
          password: 'password123',
        });
      ownerToken = ownerLoginResponse.body.access_token;

      const editorLoginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'editor@example.com',
          password: 'password123',
        });
      editorToken = editorLoginResponse.body.access_token;

      const writerLoginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'writer@example.com',
          password: 'password123',
        });
      writerToken = writerLoginResponse.body.access_token;

      const outsiderLoginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'outsider@example.com',
          password: 'password123',
        });
      outsiderToken = outsiderLoginResponse.body.access_token;
    });

    describe('Owner-only endpoints', () => {
      it('should allow owner access to owner-only endpoint', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/test-rbac/${organization.id}/owner-only`)
          .set('Authorization', `Bearer ${ownerToken}`)
          .expect(200);

        expect(response.body.message).toBe('Owner access granted');
        expect(response.body.userId).toBe(ownerUser.id);
        expect(response.body.orgId).toBe(organization.id);
      });

      it('should deny editor access to owner-only endpoint', async () => {
        await request(app.getHttpServer())
          .get(`/api/test-rbac/${organization.id}/owner-only`)
          .set('Authorization', `Bearer ${editorToken}`)
          .expect(403);
      });

      it('should deny writer access to owner-only endpoint', async () => {
        await request(app.getHttpServer())
          .get(`/api/test-rbac/${organization.id}/owner-only`)
          .set('Authorization', `Bearer ${writerToken}`)
          .expect(403);
      });

      it('should deny outsider access to owner-only endpoint', async () => {
        await request(app.getHttpServer())
          .get(`/api/test-rbac/${organization.id}/owner-only`)
          .set('Authorization', `Bearer ${outsiderToken}`)
          .expect(403);
      });
    });

    describe('Editor or Owner endpoints', () => {
      it('should allow owner access to editor-or-owner endpoint', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/test-rbac/${organization.id}/editor-or-owner`)
          .set('Authorization', `Bearer ${ownerToken}`)
          .expect(200);

        expect(response.body.message).toBe('Editor or owner access granted');
        expect(response.body.userId).toBe(ownerUser.id);
      });

      it('should allow editor access to editor-or-owner endpoint', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/test-rbac/${organization.id}/editor-or-owner`)
          .set('Authorization', `Bearer ${editorToken}`)
          .expect(200);

        expect(response.body.message).toBe('Editor or owner access granted');
        expect(response.body.userId).toBe(editorUser.id);
      });

      it('should deny writer access to editor-or-owner endpoint', async () => {
        await request(app.getHttpServer())
          .get(`/api/test-rbac/${organization.id}/editor-or-owner`)
          .set('Authorization', `Bearer ${writerToken}`)
          .expect(403);
      });

      it('should deny outsider access to editor-or-owner endpoint', async () => {
        await request(app.getHttpServer())
          .get(`/api/test-rbac/${organization.id}/editor-or-owner`)
          .set('Authorization', `Bearer ${outsiderToken}`)
          .expect(403);
      });
    });

    describe('Writer action endpoints', () => {
      it('should allow owner access to writer action endpoint', async () => {
        const response = await request(app.getHttpServer())
          .post(`/api/test-rbac/${organization.id}/writer-action`)
          .set('Authorization', `Bearer ${ownerToken}`)
          .send({ action: 'test' })
          .expect(200);

        expect(response.body.message).toBe('Writer action completed');
        expect(response.body.userId).toBe(ownerUser.id);
        expect(response.body.data.action).toBe('test');
      });

      it('should allow editor access to writer action endpoint', async () => {
        const response = await request(app.getHttpServer())
          .post(`/api/test-rbac/${organization.id}/writer-action`)
          .set('Authorization', `Bearer ${editorToken}`)
          .send({ action: 'test' })
          .expect(200);

        expect(response.body.message).toBe('Writer action completed');
        expect(response.body.userId).toBe(editorUser.id);
      });

      it('should allow writer access to writer action endpoint', async () => {
        const response = await request(app.getHttpServer())
          .post(`/api/test-rbac/${organization.id}/writer-action`)
          .set('Authorization', `Bearer ${writerToken}`)
          .send({ action: 'test' })
          .expect(200);

        expect(response.body.message).toBe('Writer action completed');
        expect(response.body.userId).toBe(writerUser.id);
      });

      it('should deny outsider access to writer action endpoint', async () => {
        await request(app.getHttpServer())
          .post(`/api/test-rbac/${organization.id}/writer-action`)
          .set('Authorization', `Bearer ${outsiderToken}`)
          .send({ action: 'test' })
          .expect(403);
      });
    });

    describe('Public endpoints', () => {
      it('should allow any authenticated user access to public endpoint', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/test-rbac/${organization.id}/public`)
          .set('Authorization', `Bearer ${outsiderToken}`)
          .expect(200);

        expect(response.body.message).toBe('Public access granted');
        expect(response.body.userId).toBe(outsiderUser.id);
      });
    });

    describe('Authentication requirements', () => {
      it('should require authentication for all endpoints', async () => {
        await request(app.getHttpServer())
          .get(`/api/test-rbac/${organization.id}/public`)
          .expect(401);
      });

      it('should require valid JWT token', async () => {
        await request(app.getHttpServer())
          .get(`/api/test-rbac/${organization.id}/public`)
          .set('Authorization', 'Bearer invalid-token')
          .expect(401);
      });
    });

    describe('Organization membership requirements', () => {
      it('should deny access when user is not a member of the organization', async () => {
        // Create a new organization
        const newOrg = await organizationRepository.save({
          name: 'Another Organization',
          description: 'Another Description',
          website: 'https://another.com',
        });

        await request(app.getHttpServer())
          .get(`/api/test-rbac/${newOrg.id}/owner-only`)
          .set('Authorization', `Bearer ${ownerToken}`)
          .expect(403);
      });
    });
  });
}); 