import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { User } from '../src/users/user.entity';
import { Organization } from '../src/organizations/organization.entity';
import { OrganizationMember, OrganizationRole } from '../src/organizations/organization-member.entity';
import { Invitation } from '../src/organizations/invitation.entity';
import { Post } from '../src/posts/post.entity';
import { JwtService } from '@nestjs/jwt';
import { PostStatus } from '../src/posts/post.entity';
import { OrganizationsService } from '../src/organizations/organizations.service';

describe('PostsModule (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let dataSource: DataSource;
  let server: any;
  let ownerToken: string;
  let editorToken: string;
  let writerToken: string;
  let orgId: string;
  let ownerId: string;
  let editorId: string;
  let writerId: string;
  let organizationsService: OrganizationsService;

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
          entities: [User, Organization, OrganizationMember, Post, Invitation],
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
    organizationsService = app.get(OrganizationsService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await dataSource.query('DELETE FROM posts');
    await dataSource.query('DELETE FROM organization_members');
    await dataSource.query('DELETE FROM organizations');
    await dataSource.query('DELETE FROM users');

    // Create users
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

    // Create organization
    const orgRes = await request(server)
      .post('/api/organizations')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Test Org' });
    orgId = orgRes.body.id;

    // Add editor and writer as members
    const editorMemberRes = await request(server)
      .post(`/api/organizations/${orgId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: 'editor@example.com', role: OrganizationRole.EDITOR });
    
    const writerMemberRes = await request(server)
      .post(`/api/organizations/${orgId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: 'writer@example.com', role: OrganizationRole.WRITER });
  });

  describe('Post CRUD and workflow', () => {
    let postId: string;

    it('Writer can create a post (DRAFT)', async () => {
      const res = await request(server)
        .post(`/api/organizations/${orgId}/posts`)
        .set('Authorization', `Bearer ${writerToken}`)
        .send({
          title: 'First Post',
          content: 'This is the content of the first post.',
          excerpt: 'First post excerpt',
          isPublic: false,
        })
        .expect(201);
      expect(res.body.title).toBe('First Post');
      expect(res.body.status).toBe(PostStatus.DRAFT);
      postId = res.body.id;
    });

    it('Writer can update their own draft post', async () => {
      const createRes = await request(server)
        .post(`/api/organizations/${orgId}/posts`)
        .set('Authorization', `Bearer ${writerToken}`)
        .send({
          title: 'Draft Post',
          content: 'Draft content for update.',
        });
      postId = createRes.body.id;
      const res = await request(server)
        .put(`/api/organizations/${orgId}/posts/${postId}`)
        .set('Authorization', `Bearer ${writerToken}`)
        .send({ title: 'Updated Title' })
        .expect(200);
      expect(res.body.title).toBe('Updated Title');
    });

    it('Writer cannot update published post', async () => {
      // Create and submit for review, then approve as editor
      const createRes = await request(server)
        .post(`/api/organizations/${orgId}/posts`)
        .set('Authorization', `Bearer ${writerToken}`)
        .send({ title: 'To Publish', content: 'Content to publish.' });
      postId = createRes.body.id;
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
      await request(server)
        .put(`/api/organizations/${orgId}/posts/${postId}`)
        .set('Authorization', `Bearer ${writerToken}`)
        .send({ title: 'Should Fail' })
        .expect(409);
    });

    it('Writer can submit draft for review', async () => {
      const createRes = await request(server)
        .post(`/api/organizations/${orgId}/posts`)
        .set('Authorization', `Bearer ${writerToken}`)
        .send({ title: 'Review Me', content: 'Content for review.' });
      postId = createRes.body.id;
      const res = await request(server)
        .post(`/api/organizations/${orgId}/posts/${postId}/submit-for-review`)
        .set('Authorization', `Bearer ${writerToken}`)
        .send({ postId })
        .expect(201);
      expect(res.body.status).toBe(PostStatus.IN_REVIEW);
    });

    it('Editor can approve a post in review', async () => {
      const createRes = await request(server)
        .post(`/api/organizations/${orgId}/posts`)
        .set('Authorization', `Bearer ${writerToken}`)
        .send({ title: 'Approve Me', content: 'Content for approval.' });
      postId = createRes.body.id;
      await request(server)
        .post(`/api/organizations/${orgId}/posts/${postId}/submit-for-review`)
        .set('Authorization', `Bearer ${writerToken}`)
        .send({ postId });
      const res = await request(server)
        .post(`/api/organizations/${orgId}/posts/${postId}/review`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ postId, action: 'approve' })
        .expect(201);
      expect(res.body.status).toBe(PostStatus.PUBLISHED);
    });

    it('Editor can reject a post in review with reason', async () => {
      const createRes = await request(server)
        .post(`/api/organizations/${orgId}/posts`)
        .set('Authorization', `Bearer ${writerToken}`)
        .send({ title: 'Reject Me', content: 'Content for rejection.' });
      postId = createRes.body.id;
      await request(server)
        .post(`/api/organizations/${orgId}/posts/${postId}/submit-for-review`)
        .set('Authorization', `Bearer ${writerToken}`)
        .send({ postId });
      const res = await request(server)
        .post(`/api/organizations/${orgId}/posts/${postId}/review`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ postId, action: 'reject', rejectionReason: 'Needs work' })
        .expect(201);
      expect(res.body.status).toBe(PostStatus.REJECTED);
      expect(res.body.rejectionReason).toBe('Needs work');
    });

    it('Writer can revert rejected post to draft', async () => {
      const createRes = await request(server)
        .post(`/api/organizations/${orgId}/posts`)
        .set('Authorization', `Bearer ${writerToken}`)
        .send({ title: 'Rejected Post', content: 'Rejected content.' });
      postId = createRes.body.id;
      await request(server)
        .post(`/api/organizations/${orgId}/posts/${postId}/submit-for-review`)
        .set('Authorization', `Bearer ${writerToken}`)
        .send({ postId });
      await request(server)
        .post(`/api/organizations/${orgId}/posts/${postId}/review`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ postId, action: 'reject', rejectionReason: 'Fix this' });
      const res = await request(server)
        .post(`/api/organizations/${orgId}/posts/${postId}/revert-to-draft`)
        .set('Authorization', `Bearer ${writerToken}`)
        .expect(201);
      expect(res.body.status).toBe(PostStatus.DRAFT);
    });

    it('Writer cannot approve a post', async () => {
      const createRes = await request(server)
        .post(`/api/organizations/${orgId}/posts`)
        .set('Authorization', `Bearer ${writerToken}`)
        .send({ title: 'No Approve', content: 'Writer cannot approve.' });
      postId = createRes.body.id;
      await request(server)
        .post(`/api/organizations/${orgId}/posts/${postId}/submit-for-review`)
        .set('Authorization', `Bearer ${writerToken}`)
        .send({ postId });
      await request(server)
        .post(`/api/organizations/${orgId}/posts/${postId}/review`)
        .set('Authorization', `Bearer ${writerToken}`)
        .send({ postId, action: 'approve' })
        .expect(403);
    });

    it('Public posts endpoint returns published posts', async () => {
      // Create and publish a post
      const createRes = await request(server)
        .post(`/api/organizations/${orgId}/posts`)
        .set('Authorization', `Bearer ${writerToken}`)
        .send({ title: 'Public Post', content: 'Public content', isPublic: true });
      postId = createRes.body.id;
      await request(server)
        .post(`/api/organizations/${orgId}/posts/${postId}/submit-for-review`)
        .set('Authorization', `Bearer ${writerToken}`)
        .send({ postId });
      await request(server)
        .post(`/api/organizations/${orgId}/posts/${postId}/review`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ postId, action: 'approve' });
      const res = await request(server)
        .get(`/api/organizations/${orgId}/posts/public`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0].status).toBe(PostStatus.PUBLISHED);
      expect(res.body[0].isPublic).toBe(true);
    });
  });

  describe('RBAC and permissions', () => {
    let postId: string;
    let anotherPostId: string;

    beforeEach(async () => {
      // Writer creates a post
      const createRes = await request(server)
        .post(`/api/organizations/${orgId}/posts`)
        .set('Authorization', `Bearer ${writerToken}`)
        .send({ title: 'RBAC Post', content: 'RBAC content.' });
      postId = createRes.body.id;

      // Editor creates another post
      const editorCreateRes = await request(server)
        .post(`/api/organizations/${orgId}/posts`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ title: 'Editor Post', content: 'Editor content.' });
      anotherPostId = editorCreateRes.body.id;
    });

    it('Writer cannot delete another user post', async () => {
      // Writer tries to delete editor's post
      await request(server)
        .delete(`/api/organizations/${orgId}/posts/${anotherPostId}`)
        .set('Authorization', `Bearer ${writerToken}`)
        .expect(403);
    });

    it('Editor can delete any post', async () => {
      await request(server)
        .delete(`/api/organizations/${orgId}/posts/${postId}`)
        .set('Authorization', `Bearer ${editorToken}`)
        .expect(200);
    });

    it('Writer cannot submit another user post for review', async () => {
      // Editor creates a post
      const createRes = await request(server)
        .post(`/api/organizations/${orgId}/posts`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ title: 'Editor Post', content: 'Editor content.' });
      const editorPostId = createRes.body.id;
      await request(server)
        .post(`/api/organizations/${orgId}/posts/${editorPostId}/submit-for-review`)
        .set('Authorization', `Bearer ${writerToken}`)
        .send({ postId: editorPostId })
        .expect(403);
    });
  });
}); 