import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './post.entity';
import { OrganizationMember } from '../organizations/organization-member.entity';
import { PostsService } from './posts.service';
import { PostsController, StandalonePostsController } from './posts.controller';
import { OrganizationGuard } from '../auth/guards/organization.guard';
import { TransactionService } from '../common/services/transaction.service';
import { QueuesModule } from '../queues/queues.module';
import { UsersModule } from '../users/users.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, OrganizationMember]),
    QueuesModule,
    UsersModule,
    OrganizationsModule,
    RealtimeModule,
  ],
  controllers: [PostsController, StandalonePostsController],
  providers: [PostsService, OrganizationGuard, TransactionService],
  exports: [PostsService],
})
export class PostsModule {} 