import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SearchService } from './search.service';

@Controller('api/search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('posts')
  async searchPosts(
    @Query('q') query: string,
    @Query('organizationId') organizationId?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const filters = {
      organizationId,
      status,
      page: page ? parseInt(page.toString()) : 1,
      limit: limit ? parseInt(limit.toString()) : 10,
    };

    return this.searchService.searchPosts(query, filters);
  }

  @Get('users')
  async searchUsers(
    @Query('q') query: string,
    @Query('organizationId') organizationId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const filters = {
      organizationId,
      page: page ? parseInt(page.toString()) : 1,
      limit: limit ? parseInt(limit.toString()) : 10,
    };

    return this.searchService.searchUsers(query, filters);
  }

  @Get('organizations')
  async searchOrganizations(
    @Query('q') query: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const filters = {
      page: page ? parseInt(page.toString()) : 1,
      limit: limit ? parseInt(limit.toString()) : 10,
    };

    return this.searchService.searchOrganizations(query, filters);
  }

  @Get('all')
  async searchAll(
    @Query('q') query: string,
    @Query('organizationId') organizationId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const filters = {
      organizationId,
      page: page ? parseInt(page.toString()) : 1,
      limit: limit ? parseInt(limit.toString()) : 10,
    };

    const [posts, users, organizations] = await Promise.all([
      this.searchService.searchPosts(query, filters),
      this.searchService.searchUsers(query, filters),
      this.searchService.searchOrganizations(query, filters),
    ]);

    return {
      posts: posts.data,
      users: users.data,
      organizations: organizations.data,
    };
  }
} 