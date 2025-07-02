import { Controller, Get, Post, Param, Body, UseGuards, Request, HttpCode, ForbiddenException, Res } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { OrganizationGuard } from './guards/organization.guard';
import { Roles } from './decorators/roles.decorator';
import { RequireRole } from './decorators/require-role.decorator';
import { Response } from 'express';

@Controller('test-rbac')
@UseGuards(JwtAuthGuard, OrganizationGuard)
export class TestRbacController {
  
  @Get(':orgId/owner-only')
  @RequireRole('owner')
  async ownerOnlyEndpoint(@Param('orgId') orgId: string, @Request() req, @Res() res: Response) {
    try {
      return res.status(200).json({
        message: 'Owner access granted',
        userId: req.user.id,
        orgId,
        role: 'owner'
      });
    } catch (err) {
      if (err instanceof ForbiddenException) {
        return res.status(403).json({ message: err.message });
      }
      throw err;
    }
  }

  @Get(':orgId/editor-or-owner')
  @Roles('owner', 'editor')
  async editorOrOwnerEndpoint(@Param('orgId') orgId: string, @Request() req, @Res() res: Response) {
    try {
      return res.status(200).json({
        message: 'Editor or owner access granted',
        userId: req.user.id,
        orgId,
        role: 'editor_or_owner'
      });
    } catch (err) {
      if (err instanceof ForbiddenException) {
        return res.status(403).json({ message: err.message });
      }
      throw err;
    }
  }

  @Post(':orgId/writer-action')
  @HttpCode(200)
  @Roles('owner', 'editor', 'writer')
  async writerActionEndpoint(
    @Param('orgId') orgId: string,
    @Body() body: any,
    @Request() req,
    @Res() res: Response
  ) {
    try {
      return res.status(200).json({
        message: 'Writer action completed',
        userId: req.user.id,
        orgId,
        data: body
      });
    } catch (err) {
      if (err instanceof ForbiddenException) {
        return res.status(403).json({ message: err.message });
      }
      throw err;
    }
  }

  @Get(':orgId/public')
  async publicEndpoint(@Param('orgId') orgId: string, @Request() req, @Res() res: Response) {
    try {
      return res.status(200).json({
        message: 'Public access granted',
        userId: req.user.id,
        orgId
      });
    } catch (err) {
      if (err instanceof ForbiddenException) {
        return res.status(403).json({ message: err.message });
      }
      throw err;
    }
  }
} 