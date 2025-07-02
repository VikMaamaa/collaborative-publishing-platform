import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike } from 'typeorm';
import { Post } from '../posts/post.entity';
import { User } from '../users/user.entity';
import { Organization } from '../organizations/organization.entity';

export interface SearchFilters {
  organizationId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
  ) {}

  async searchPosts(query: string, filters: SearchFilters = {}) {
    const { organizationId, status, page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;

    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.organization', 'organization')
      .where(
        '(post.title ILIKE :query OR post.content ILIKE :query OR post.excerpt ILIKE :query)',
        { query: `%${query}%` }
      );

    if (organizationId) {
      queryBuilder.andWhere('post.organizationId = :organizationId', { organizationId });
    }

    if (status) {
      queryBuilder.andWhere('post.status = :status', { status });
    }

    const [posts, total] = await queryBuilder
      .orderBy('post.updatedAt', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return {
      data: posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async searchUsers(query: string, filters: SearchFilters = {}) {
    const { organizationId, page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.organizationMembers', 'members')
      .where(
        '(user.firstName ILIKE :query OR user.lastName ILIKE :query OR user.email ILIKE :query OR user.username ILIKE :query)',
        { query: `%${query}%` }
      );

    if (organizationId) {
      queryBuilder.andWhere('members.organizationId = :organizationId', { organizationId });
    }

    const [users, total] = await queryBuilder
      .orderBy('user.firstName', 'ASC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async searchOrganizations(query: string, filters: SearchFilters = {}) {
    const { page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;

    const queryBuilder = this.organizationRepository
      .createQueryBuilder('organization')
      .where(
        '(organization.name ILIKE :query OR organization.description ILIKE :query)',
        { query: `%${query}%` }
      );

    const [organizations, total] = await queryBuilder
      .orderBy('organization.name', 'ASC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return {
      data: organizations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
} 