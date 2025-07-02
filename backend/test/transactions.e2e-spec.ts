import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { User } from '../src/users/user.entity';
import { Organization } from '../src/organizations/organization.entity';
import { OrganizationMember } from '../src/organizations/organization-member.entity';
import { OrganizationRole } from '../src/organizations/organization-role.enum';
import { Post, PostStatus } from '../src/posts/post.entity';
import { JwtService } from '@nestjs/jwt';
import { TransactionService } from '../src/common/services/transaction.service';

describe('Database Transactions (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let dataSource: DataSource;
  let transactionService: TransactionService;
  let server: any;

  beforeAll(async () => {
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
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
    server = app.getHttpServer();
    jwtService = app.get(JwtService);
    dataSource = app.get(DataSource);
    transactionService = app.get(TransactionService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await dataSource.query('DELETE FROM posts');
    await dataSource.query('DELETE FROM organization_members');
    await dataSource.query('DELETE FROM organizations');
    await dataSource.query('DELETE FROM users');
  });

  describe('Atomic Operations', () => {
    it('should create post and member atomically', async () => {
      // Create a new user
      const newUserRes = await request(server)
        .post('/api/users')
        .send({
          email: 'newuser@example.com',
          username: 'newuser',
          password: 'password',
          firstName: 'New',
          lastName: 'User',
        });
      const newUserId = newUserRes.body.id;

      // Create organization
      const ownerRes = await request(server)
        .post('/api/users')
        .send({
          email: 'owner@example.com',
          username: 'owner',
          password: 'password',
          firstName: 'Owner',
          lastName: 'User',
        });
      const ownerUser = ownerRes.body;
      const ownerToken = jwtService.sign({ 
        sub: ownerUser.id, 
        email: ownerUser.email,
        username: ownerUser.username,
        role: ownerUser.role || 'user'
      });

      const orgRes = await request(server)
        .post('/api/organizations')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'Test Org' });
      const orgId = orgRes.body.id;

      // Use transaction service to add member and create post atomically
      const result = await transactionService.executeInTransaction(async (entityManager) => {
        // Add user as member
        const member = entityManager.create(OrganizationMember, {
          userId: newUserId,
          organizationId: orgId,
          role: OrganizationRole.WRITER,
          isActive: true,
        });
        await entityManager.save(OrganizationMember, member);

        // Create post
        const post = entityManager.create(Post, {
          title: 'Atomic Post',
          content: 'This post was created atomically with member addition.',
          authorId: newUserId,
          organizationId: orgId,
          status: PostStatus.DRAFT,
        });
        const savedPost = await entityManager.save(Post, post);

        return { member, post: savedPost };
      });

      expect(result.member).toBeDefined();
      expect(result.post).toBeDefined();
      expect(result.post.title).toBe('Atomic Post');

      // Verify both operations were committed
      const memberCheck = await dataSource
        .createQueryBuilder(OrganizationMember, 'member')
        .where('member.userId = :userId', { userId: newUserId })
        .andWhere('member.organizationId = :orgId', { orgId })
        .getOne();
      expect(memberCheck).toBeDefined();

      const postCheck = await dataSource
        .createQueryBuilder(Post, 'post')
        .where('post.id = :postId', { postId: result.post.id })
        .getOne();
      expect(postCheck).toBeDefined();
    });

    it('should rollback all operations on error', async () => {
      const newUserRes = await request(server)
        .post('/api/users')
        .send({
          email: 'rollback@example.com',
          username: 'rollback',
          password: 'password',
          firstName: 'Rollback',
          lastName: 'User',
        });
      const newUserId = newUserRes.body.id;

      // Create organization
      const ownerRes = await request(server)
        .post('/api/users')
        .send({
          email: 'owner2@example.com',
          username: 'owner2',
          password: 'password',
          firstName: 'Owner2',
          lastName: 'User',
        });
      const ownerUser = ownerRes.body;
      const ownerToken = jwtService.sign({ 
        sub: ownerUser.id, 
        email: ownerUser.email,
        username: ownerUser.username,
        role: ownerUser.role || 'user'
      });

      const orgRes = await request(server)
        .post('/api/organizations')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'Test Org 2' });
      const orgId = orgRes.body.id;

      // Try to create member and post, but force an error
      await expect(
        transactionService.executeInTransaction(async (entityManager) => {
          // Add user as member
          const member = entityManager.create(OrganizationMember, {
            userId: newUserId,
            organizationId: orgId,
            role: OrganizationRole.WRITER,
            isActive: true,
          });
          await entityManager.save(OrganizationMember, member);

          // Create post
          const post = entityManager.create(Post, {
            title: 'Rollback Post',
            content: 'This post should be rolled back.',
            authorId: newUserId,
            organizationId: orgId,
            status: PostStatus.DRAFT,
          });
          await entityManager.save(Post, post);

          // Force an error to trigger rollback
          throw new Error('Simulated error for rollback test');
        })
      ).rejects.toThrow('Simulated error for rollback test');

      // Verify both operations were rolled back
      const memberCheck = await dataSource
        .createQueryBuilder(OrganizationMember, 'member')
        .where('member.userId = :userId', { userId: newUserId })
        .andWhere('member.organizationId = :orgId', { orgId })
        .getOne();
      expect(memberCheck).toBeNull();

      const postCheck = await dataSource
        .createQueryBuilder(Post, 'post')
        .where('post.title = :title', { title: 'Rollback Post' })
        .getOne();
      expect(postCheck).toBeNull();
    });
  });

  describe('Transaction Retry Logic', () => {
    it('should retry on deadlock scenarios', async () => {
      // Create a user and organization for the test
      const userRes = await request(server)
        .post('/api/users')
        .send({
          email: 'retry@example.com',
          username: 'retry',
          password: 'password',
          firstName: 'Retry',
          lastName: 'User',
        });
      const userId = userRes.body.id;

      const ownerRes = await request(server)
        .post('/api/users')
        .send({
          email: 'owner3@example.com',
          username: 'owner3',
          password: 'password',
          firstName: 'Owner3',
          lastName: 'User',
        });
      const ownerUser = ownerRes.body;
      const ownerToken = jwtService.sign({ 
        sub: ownerUser.id, 
        email: ownerUser.email,
        username: ownerUser.username,
        role: ownerUser.role || 'user'
      });

      const orgRes = await request(server)
        .post('/api/organizations')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'Test Org 3' });
      const orgId = orgRes.body.id;
      
      const result = await transactionService.executeWithRetry(async (entityManager) => {
        // Create a post
        const post = entityManager.create(Post, {
          title: 'Retry Test Post',
          content: 'This post tests retry logic.',
          authorId: userId,
          organizationId: orgId,
          status: PostStatus.DRAFT,
        });
        return await entityManager.save(Post, post);
      });

      expect(result).toBeDefined();
      expect(result.title).toBe('Retry Test Post');
    });
  });
});
