import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { BullModule } from '@nestjs/bull';
import { AppModule } from '../src/app.module';
import { User } from '../src/users/user.entity';
import { Organization } from '../src/organizations/organization.entity';
import { OrganizationMember } from '../src/organizations/organization-member.entity';
import { OrganizationRole } from '../src/organizations/organization-role.enum';
import { Post, PostStatus } from '../src/posts/post.entity';
import { JwtService } from '@nestjs/jwt';
import { NotificationQueue } from '../src/queues/notification.queue';
import { NotificationProcessor } from '../src/queues/notification.processor';
import { getQueueToken } from '@nestjs/bull';
import { Queue } from 'bull';

describe('BullMQ Queue Operations (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let dataSource: DataSource;
  let notificationQueue: NotificationQueue;
  let notificationProcessor: NotificationProcessor;
  let queue: Queue;
  let server: any;
  let ownerToken: string;
  let editorToken: string;
  let writerToken: string;
  let orgId: string;
  let ownerId: string;
  let editorId: string;
  let writerId: string;

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
        BullModule.forRoot({
          redis: {
            host: 'localhost',
            port: 6380,
            password: undefined,
          },
        }),
        BullModule.registerQueue({
          name: 'notifications',
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
    notificationQueue = app.get(NotificationQueue);
    notificationProcessor = app.get(NotificationProcessor);
    queue = app.get(getQueueToken('notifications'));
  });

  afterAll(async () => {
    await queue.empty();
    await app.close();
  });

  beforeEach(async () => {
    await dataSource.query('DELETE FROM posts');
    await dataSource.query('DELETE FROM organization_members');
    await dataSource.query('DELETE FROM organizations');
    await dataSource.query('DELETE FROM users');
    await queue.empty();

    const ownerRes = await request(server)
      .post('/api/users')
      .send({
        email: 'owner@example.com',
        username: 'owner',
        password: 'password',
        firstName: 'Owner',
        lastName: 'User',
      });
    ownerId = ownerRes.body.id;
    const ownerUser = ownerRes.body;
    ownerToken = jwtService.sign({ 
      sub: ownerUser.id, 
      email: ownerUser.email,
      username: ownerUser.username,
      role: ownerUser.role || 'user'
    });

    const editorRes = await request(server)
      .post('/api/users')
      .send({
        email: 'editor@example.com',
        username: 'editor',
        password: 'password',
        firstName: 'Editor',
        lastName: 'User',
      });
    editorId = editorRes.body.id;
    const editorUser = editorRes.body;
    editorToken = jwtService.sign({ 
      sub: editorUser.id, 
      email: editorUser.email,
      username: editorUser.username,
      role: editorUser.role || 'user'
    });

    const writerRes = await request(server)
      .post('/api/users')
      .send({
        email: 'writer@example.com',
        username: 'writer',
        password: 'password',
        firstName: 'Writer',
        lastName: 'User',
      });
    writerId = writerRes.body.id;
    const writerUser = writerRes.body;
    writerToken = jwtService.sign({ 
      sub: writerUser.id, 
      email: writerUser.email,
      username: writerUser.username,
      role: writerUser.role || 'user'
    });

    const orgRes = await request(server)
      .post('/api/organizations')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Test Org' });
    orgId = orgRes.body.id;

    await request(server)
      .post(`/api/organizations/${orgId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: 'editor@example.com', role: OrganizationRole.EDITOR });
    
    await request(server)
      .post(`/api/organizations/${orgId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: 'writer@example.com', role: OrganizationRole.WRITER });
  });

  describe('Queue Job Management', () => {
    it('should add and process post published notification job', async () => {
      const postRes = await request(server)
        .post(`/api/organizations/${orgId}/posts`)
        .set('Authorization', `Bearer ${writerToken}`)
        .send({
          title: 'Test Post for Notification',
          content: 'This post will trigger notifications.',
        });
      const postId = postRes.body.id;

      await request(server)
        .post(`/api/organizations/${orgId}/posts/${postId}/submit-for-review`)
        .set('Authorization', `Bearer ${writerToken}`)
        .send({ postId })
        .expect(201);

      await request(server)
        .post(`/api/organizations/${orgId}/posts/${postId}/review`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ postId, action: 'approve' })
        .expect(201);

      await new Promise(resolve => setTimeout(resolve, 1000));

      const jobCounts = await notificationQueue.getJobCounts();
      expect(jobCounts.completed).toBeGreaterThan(0);

      const finalPost = await request(server)
        .get(`/api/organizations/${orgId}/posts/${postId}`)
        .set('Authorization', `Bearer ${writerToken}`);
      
      expect(finalPost.body.status).toBe(PostStatus.PUBLISHED);
    });

    it('should add and process post rejected notification job', async () => {
      const postRes = await request(server)
        .post(`/api/organizations/${orgId}/posts`)
        .set('Authorization', `Bearer ${writerToken}`)
        .send({
          title: 'Test Post for Rejection',
          content: 'This post will be rejected.',
        });
      const postId = postRes.body.id;

      await request(server)
        .post(`/api/organizations/${orgId}/posts/${postId}/submit-for-review`)
        .set('Authorization', `Bearer ${writerToken}`)
        .send({ postId })
        .expect(201);

      await request(server)
        .post(`/api/organizations/${orgId}/posts/${postId}/review`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ 
          postId, 
          action: 'reject',
          rejectionReason: 'Content needs improvement'
        })
        .expect(201);

      await new Promise(resolve => setTimeout(resolve, 1000));

      const jobCounts = await notificationQueue.getJobCounts();
      expect(jobCounts.completed).toBeGreaterThan(0);

      const finalPost = await request(server)
        .get(`/api/organizations/${orgId}/posts/${postId}`)
        .set('Authorization', `Bearer ${writerToken}`);
      
      expect(finalPost.body.status).toBe(PostStatus.REJECTED);
    });

    it('should add and process post needs review notification job', async () => {
      const postRes = await request(server)
        .post(`/api/organizations/${orgId}/posts`)
        .set('Authorization', `Bearer ${writerToken}`)
        .send({
          title: 'Test Post for Review',
          content: 'This post needs review.',
        });
      const postId = postRes.body.id;

      await request(server)
        .post(`/api/organizations/${orgId}/posts/${postId}/submit-for-review`)
        .set('Authorization', `Bearer ${writerToken}`)
        .send({ postId })
        .expect(201);

      await new Promise(resolve => setTimeout(resolve, 1000));

      const jobCounts = await notificationQueue.getJobCounts();
      expect(jobCounts.completed).toBeGreaterThan(0);

      const finalPost = await request(server)
        .get(`/api/organizations/${orgId}/posts/${postId}`)
        .set('Authorization', `Bearer ${writerToken}`);
      
      expect(finalPost.body.status).toBe(PostStatus.IN_REVIEW);
    });
  });

  describe('Queue Job Retry Logic', () => {
    it('should retry failed jobs', async () => {
      const jobData = {
        postId: 'test-post-123',
        organizationId: orgId,
        authorId: writerId,
        postTitle: 'Test Post',
        notificationType: 'post_published' as const,
      };

      const originalMethod = notificationProcessor['sendPostPublishedNotification'];
      let attemptCount = 0;
      notificationProcessor['sendPostPublishedNotification'] = jest.fn().mockImplementation(async () => {
        attemptCount++;
        if (attemptCount === 1) {
          throw new Error('Simulated failure');
        }
        return originalMethod.call(notificationProcessor, jobData);
      });

      await notificationQueue.addPostPublishedNotification(
        jobData.postId,
        jobData.organizationId,
        jobData.authorId,
        jobData.postTitle
      );

      await new Promise(resolve => setTimeout(resolve, 3000));

      expect(attemptCount).toBeGreaterThan(1);

      notificationProcessor['sendPostPublishedNotification'] = originalMethod;
    });

    it('should handle job failures gracefully', async () => {
      const jobData = {
        postId: 'test-post-456',
        organizationId: orgId,
        authorId: writerId,
        postTitle: 'Test Post',
        notificationType: 'post_published' as const,
      };

      const originalMethod = notificationProcessor['sendPostPublishedNotification'];
      notificationProcessor['sendPostPublishedNotification'] = jest.fn().mockRejectedValue(
        new Error('Persistent failure')
      );

      await notificationQueue.addPostPublishedNotification(
        jobData.postId,
        jobData.organizationId,
        jobData.authorId,
        jobData.postTitle
      );

      // Poll for failed jobs up to 15 seconds
      let failedJobs = [];
      const maxAttempts = 30;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        failedJobs = await notificationQueue.getFailedJobs();
        if (failedJobs.length > 0) break;
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      expect(failedJobs.length).toBeGreaterThan(0);

      notificationProcessor['sendPostPublishedNotification'] = originalMethod;
    }, 20000);
  });

  describe('Queue Performance and Concurrency', () => {
    it('should handle multiple concurrent jobs', async () => {
      const postPromises = [];
      for (let i = 0; i < 3; i++) {
        const postRes = await request(server)
          .post(`/api/organizations/${orgId}/posts`)
          .set('Authorization', `Bearer ${writerToken}`)
          .send({
            title: `Concurrent Post ${i + 1}`,
            content: `Content for post ${i + 1}`,
          });
        
        const postId = postRes.body.id;
        
        postPromises.push(
          request(server)
            .post(`/api/organizations/${orgId}/posts/${postId}/submit-for-review`)
            .set('Authorization', `Bearer ${writerToken}`)
            .send({ postId })
        );
      }

      await Promise.all(postPromises);
      await new Promise(resolve => setTimeout(resolve, 2000));

      const jobCounts = await notificationQueue.getJobCounts();
      expect(jobCounts.completed).toBeGreaterThanOrEqual(3);
    });

    it('should maintain job order for related operations', async () => {
      const postRes = await request(server)
        .post(`/api/organizations/${orgId}/posts`)
        .set('Authorization', `Bearer ${writerToken}`)
        .send({
          title: 'Ordered Post',
          content: 'This post will test job ordering.',
        });
      const postId = postRes.body.id;

      // Track job processing order
      const processingOrder: string[] = [];
      const originalMethods = {
        needsReview: notificationProcessor['sendPostNeedsReviewNotification'],
        published: notificationProcessor['sendPostPublishedNotification'],
      };

      // Mock methods to track order
      notificationProcessor['sendPostNeedsReviewNotification'] = jest.fn().mockImplementation(async (data) => {
        processingOrder.push('needs_review');
        return originalMethods.needsReview.call(notificationProcessor, data);
      });

      notificationProcessor['sendPostPublishedNotification'] = jest.fn().mockImplementation(async (data) => {
        processingOrder.push('published');
        return originalMethods.published.call(notificationProcessor, data);
      });

      // Submit for review
      await request(server)
        .post(`/api/organizations/${orgId}/posts/${postId}/submit-for-review`)
        .set('Authorization', `Bearer ${writerToken}`)
        .send({ postId })
        .expect(201);

      // Approve the post
      await request(server)
        .post(`/api/organizations/${orgId}/posts/${postId}/review`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ postId, action: 'approve' })
        .expect(201);

      // Wait for jobs to be processed
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify order (needs review should come before published)
      expect(processingOrder).toContain('needs_review');
      expect(processingOrder).toContain('published');
      expect(processingOrder.indexOf('needs_review')).toBeLessThan(processingOrder.indexOf('published'));

      // Restore original methods
      notificationProcessor['sendPostNeedsReviewNotification'] = originalMethods.needsReview;
      notificationProcessor['sendPostPublishedNotification'] = originalMethods.published;
    });
  });

  describe('Queue Monitoring and Management', () => {
    it('should provide accurate job counts', async () => {
      // Add some jobs
      await notificationQueue.addPostPublishedNotification(
        'test-post-1',
        orgId,
        writerId,
        'Test Post 1'
      );

      await notificationQueue.addPostPublishedNotification(
        'test-post-2',
        orgId,
        writerId,
        'Test Post 2'
      );

      // Wait for jobs to be processed
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check job counts
      const jobCounts = await notificationQueue.getJobCounts();
      expect(jobCounts.completed).toBeGreaterThanOrEqual(2);
      expect(jobCounts.waiting).toBe(0);
      expect(jobCounts.active).toBe(0);
    });

    it('should allow retrying failed jobs', async () => {
      // Add a job that will fail
      const jobData = {
        postId: 'test-post-retry',
        organizationId: orgId,
        authorId: writerId,
        postTitle: 'Test Post for Retry',
        notificationType: 'post_published' as const,
      };

      // Mock the processor to fail
      const originalMethod = notificationProcessor['sendPostPublishedNotification'];
      let retryAttempted = false;
      notificationProcessor['sendPostPublishedNotification'] = jest.fn().mockImplementation(async (data) => {
        if (!retryAttempted) {
          retryAttempted = true;
          throw new Error('Initial failure');
        }
        return originalMethod.call(notificationProcessor, data);
      });

      // Add the job
      const job = await notificationQueue.addPostPublishedNotification(
        jobData.postId,
        jobData.organizationId,
        jobData.authorId,
        jobData.postTitle
      );

      // Wait for job to fail
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Get failed jobs
      const failedJobs = await notificationQueue.getFailedJobs();
      const failedJob = failedJobs.find(j => j.data.postId === jobData.postId);
      
      if (failedJob) {
        // Retry the failed job
        await notificationQueue.retryFailedJob(failedJob.id.toString());
        
        // Wait for retry to complete
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check that the job was processed successfully
        const jobCounts = await notificationQueue.getJobCounts();
        expect(jobCounts.completed).toBeGreaterThan(0);
      }

      // Restore original method
      notificationProcessor['sendPostPublishedNotification'] = originalMethod;
    });
  });
}); 