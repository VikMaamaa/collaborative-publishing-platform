import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { Post } from '../posts/post.entity';
import { User } from '../users/user.entity';
import { Organization } from '../organizations/organization.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, User, Organization]),
  ],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {} 