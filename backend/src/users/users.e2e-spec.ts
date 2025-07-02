import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users.module';
import { User, UserRole } from './user.entity';
import { Organization } from '../organizations/organization.entity';
import { OrganizationMember } from '../organizations/organization-member.entity';
import { Post } from '../posts/post.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthModule } from '../auth/auth.module';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
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
        JwtModule.register({
          secret: 'test-secret-key',
          signOptions: { expiresIn: '24h' },
        }),
        PassportModule,
        UsersModule,
        AuthModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    dataSource = moduleFixture.get<DataSource>(DataSource);
    await app.init();
  }, 30000); // Increase timeout to 30 seconds

  beforeEach(async () => {
    // Clear the database before each test in the correct order using TRUNCATE CASCADE
    await dataSource.query('TRUNCATE TABLE posts CASCADE');
    await dataSource.query('TRUNCATE TABLE organization_members CASCADE');
    await dataSource.query('TRUNCATE TABLE organizations CASCADE');
    await dataSource.query('TRUNCATE TABLE users CASCADE');
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('/users (POST)', () => {
    it('should create a new user', async () => {
      const createUserDto = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };

      const response = await request(app.getHttpServer())
        .post('/users')
        .send(createUserDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(createUserDto.email);
      expect(response.body.username).toBe(createUserDto.username);
      expect(response.body.firstName).toBe(createUserDto.firstName);
      expect(response.body.lastName).toBe(createUserDto.lastName);
      expect(response.body).not.toHaveProperty('password'); // Password should not be returned
      expect(response.body.role).toBe(UserRole.USER);
      expect(response.body.isActive).toBe(true);
    });

    it('should return 409 when email already exists', async () => {
      // Create first user
      const createUserDto = {
        email: 'test@example.com',
        username: 'testuser1',
        password: 'password123',
      };

      await request(app.getHttpServer())
        .post('/users')
        .send(createUserDto)
        .expect(201);

      // Try to create second user with same email
      const duplicateUserDto = {
        email: 'test@example.com',
        username: 'testuser2',
        password: 'password123',
      };

      await request(app.getHttpServer())
        .post('/users')
        .send(duplicateUserDto)
        .expect(409);
    });

    it('should return 409 when username already exists', async () => {
      // Create first user
      const createUserDto = {
        email: 'test1@example.com',
        username: 'testuser',
        password: 'password123',
      };

      await request(app.getHttpServer())
        .post('/users')
        .send(createUserDto)
        .expect(201);

      // Try to create second user with same username
      const duplicateUserDto = {
        email: 'test2@example.com',
        username: 'testuser',
        password: 'password123',
      };

      await request(app.getHttpServer())
        .post('/users')
        .send(duplicateUserDto)
        .expect(409);
    });
  });

  describe('/users (GET)', () => {
    it('should return all users', async () => {
      // Create test users using API
      const user1Dto = {
        email: 'user1@example.com',
        username: 'user1',
        password: 'password123',
        firstName: 'User',
        lastName: 'One',
      };

      const user2Dto = {
        email: 'user2@example.com',
        username: 'user2',
        password: 'password123',
        firstName: 'User',
        lastName: 'Two',
      };

      const user1Response = await request(app.getHttpServer())
        .post('/users')
        .send(user1Dto)
        .expect(201);

      const user2Response = await request(app.getHttpServer())
        .post('/users')
        .send(user2Dto)
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/users')
        .expect(200);

      expect(response.body).toHaveLength(2);
      // Sort both arrays by email to make the test order-agnostic
      const sortedResponse = response.body.sort((a, b) => a.email.localeCompare(b.email));
      const expectedUsers = [user1Response.body, user2Response.body].sort((a, b) => a.email.localeCompare(b.email));
      expect(sortedResponse[0].email).toBe(expectedUsers[0].email);
      expect(sortedResponse[1].email).toBe(expectedUsers[1].email);
      expect(sortedResponse[0]).not.toHaveProperty('password');
      expect(sortedResponse[1]).not.toHaveProperty('password');
    });
  });

  describe('/users/:id (GET)', () => {
    it('should return a specific user', async () => {
      // Create user using API
      const createUserDto = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/users')
        .send(createUserDto)
        .expect(201);

      const user = createResponse.body;

      const response = await request(app.getHttpServer())
        .get(`/users/${user.id}`)
        .expect(200);

      expect(response.body.id).toBe(user.id);
      expect(response.body.email).toBe(user.email);
      expect(response.body.username).toBe(user.username);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return 404 for non-existent user', async () => {
      await request(app.getHttpServer())
        .get('/users/non-existent-id')
        .expect(404);
    });
  });

  describe('/users/:id (PUT)', () => {
    it('should update a user', async () => {
      // Create user using API
      const createUserDto = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/users')
        .send(createUserDto)
        .expect(201);

      const user = createResponse.body;

      const updateUserDto = {
        firstName: 'Updated',
        lastName: 'Name',
      };

      const response = await request(app.getHttpServer())
        .put(`/users/${user.id}`)
        .send(updateUserDto)
        .expect(200);

      expect(response.body.firstName).toBe(updateUserDto.firstName);
      expect(response.body.lastName).toBe(updateUserDto.lastName);
      expect(response.body.email).toBe(user.email); // Should remain unchanged
    });

    it('should return 404 for non-existent user', async () => {
      const updateUserDto = {
        firstName: 'Updated',
      };

      await request(app.getHttpServer())
        .put('/users/non-existent-id')
        .send(updateUserDto)
        .expect(404);
    });
  });

  describe('/users/:id (DELETE)', () => {
    it('should deactivate a user', async () => {
      // Create user using API
      const createUserDto = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/users')
        .send(createUserDto)
        .expect(201);

      const user = createResponse.body;

      const response = await request(app.getHttpServer())
        .delete(`/users/${user.id}`)
        .expect(200);

      expect(response.body.isActive).toBe(false);

      // Verify in database
      const deactivatedUser = await userRepository.findOne({ where: { id: user.id } });
      expect(deactivatedUser).not.toBeNull();
      expect(deactivatedUser.isActive).toBe(false);
    });

    it('should return 404 for non-existent user', async () => {
      await request(app.getHttpServer())
        .delete('/users/non-existent-id')
        .expect(404);
    });
  });
}); 