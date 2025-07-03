import 'dotenv/config';
import { AppDataSource } from './data-source';
import { User, UserRole } from './users/user.entity';
import { Organization } from './organizations/organization.entity';
import { OrganizationMember } from './organizations/organization-member.entity';
import { OrganizationRole } from './organizations/organization-role.enum';
import { Post, PostStatus } from './posts/post.entity';

async function seed() {
  await AppDataSource.initialize();
  const userRepo = AppDataSource.getRepository(User);
  const orgRepo = AppDataSource.getRepository(Organization);
  const memberRepo = AppDataSource.getRepository(OrganizationMember);
  const postRepo = AppDataSource.getRepository(Post);

  // Clear existing data (for dev only!)
  await postRepo.delete({});
  await memberRepo.delete({});
  await orgRepo.delete({});
  await userRepo.delete({});

  // Create users
  const superadmin = userRepo.create({
    email: 'superadmin@example.com',
    username: 'superadmin',
    password: 'superpassword',
    firstName: 'Super',
    lastName: 'Admin',
    role: UserRole.SUPERADMIN,
    isActive: true,
  });
  const user = userRepo.create({
    email: 'user@example.com',
    username: 'testuser',
    password: 'userpassword',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.USER,
    isActive: true,
  });
  await userRepo.save([superadmin, user]);

  // Create organization
  const org = orgRepo.create({
    name: 'Demo Organization',
    description: 'A sample organization for seeding.',
    website: 'https://demo.org',
    isActive: true,
  });
  await orgRepo.save(org);

  // Create memberships
  const ownerMember = memberRepo.create({
    userId: superadmin.id,
    organizationId: org.id,
    role: OrganizationRole.OWNER,
    isActive: true,
  });
  const writerMember = memberRepo.create({
    userId: user.id,
    organizationId: org.id,
    role: OrganizationRole.WRITER,
    isActive: true,
  });
  await memberRepo.save([ownerMember, writerMember]);

  // Create posts
  const post1 = postRepo.create({
    title: 'Welcome to the Demo Org',
    content: 'This is the first post in the demo organization.',
    status: PostStatus.PUBLISHED,
    organizationId: org.id,
    authorId: superadmin.id,
    isPublic: true,
    publishedAt: new Date(),
  });
  const post2 = postRepo.create({
    title: 'Getting Started',
    content: 'Here is how to get started with the platform...',
    status: PostStatus.DRAFT,
    organizationId: org.id,
    authorId: user.id,
    isPublic: false,
  });
  await postRepo.save([post1, post2]);

  console.log('Database seeded successfully!');
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
}); 