import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  InviteMemberDto,
  UpdateMemberRoleDto,
  RemoveMemberDto,
  OrganizationResponse,
  MemberResponse,
  CreateInvitationDto,
  InvitationResponse,
  AcceptInvitationDto,
} from './dto/organization.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationGuard } from '../auth/guards/organization.guard';
import { RequireRole } from '../auth/decorators/require-role.decorator';
import { OrganizationRole } from './organization-member.entity';
import { validate as isUUID } from 'uuid';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  async createOrganization(
    @Body() createDto: CreateOrganizationDto,
    @Request() req,
  ): Promise<OrganizationResponse> {
    return this.organizationsService.createOrganization(createDto, req.user.id);
  }

  @Get()
  async findAllOrganizations(@Request() req): Promise<OrganizationResponse[]> {
    return this.organizationsService.findAllOrganizations(req.user.id);
  }

  @Get(':id')
  @UseGuards(OrganizationGuard)
  @RequireRole(OrganizationRole.WRITER)
  async findOrganizationById(
    @Param('id') id: string,
    @Request() req,
  ): Promise<OrganizationResponse> {
    if (!isUUID(id)) throw new NotFoundException('Organization not found');
    return this.organizationsService.findOrganizationById(id, req.user.id);
  }

  @Put(':id')
  @UseGuards(OrganizationGuard)
  @RequireRole(OrganizationRole.EDITOR)
  async updateOrganization(
    @Param('id') id: string,
    @Body() updateDto: UpdateOrganizationDto,
    @Request() req,
  ): Promise<OrganizationResponse> {
    if (!isUUID(id)) throw new NotFoundException('Organization not found');
    return this.organizationsService.updateOrganization(id, updateDto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(OrganizationGuard)
  @RequireRole(OrganizationRole.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteOrganization(
    @Param('id') id: string,
    @Request() req,
  ): Promise<void> {
    if (!isUUID(id)) throw new NotFoundException('Organization not found');
    return this.organizationsService.deleteOrganization(id, req.user.id);
  }

  @Get(':id/members')
  @UseGuards(OrganizationGuard)
  @RequireRole(OrganizationRole.WRITER)
  async getMembers(
    @Param('id') id: string,
    @Request() req,
  ): Promise<MemberResponse[]> {
    if (!isUUID(id)) throw new NotFoundException('Organization not found');
    return this.organizationsService.getMembers(id, req.user.id);
  }

  @Post(':id/members')
  @UseGuards(OrganizationGuard)
  @RequireRole(OrganizationRole.EDITOR)
  async inviteMember(
    @Param('id') id: string,
    @Body() inviteDto: InviteMemberDto,
    @Request() req,
  ): Promise<MemberResponse> {
    if (!isUUID(id)) throw new NotFoundException('Organization not found');
    return this.organizationsService.inviteMember(id, inviteDto, req.user.id);
  }

  @Put(':id/members/:memberId/role')
  @UseGuards(OrganizationGuard)
  @RequireRole(OrganizationRole.EDITOR)
  async updateMemberRole(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() updateDto: UpdateMemberRoleDto,
    @Request() req,
  ): Promise<MemberResponse> {
    if (!isUUID(id)) throw new NotFoundException('Organization not found');
    if (!isUUID(memberId)) throw new NotFoundException('Member not found');
    return this.organizationsService.updateMemberRole(id, updateDto, req.user.id);
  }

  @Delete(':id/members/:memberId')
  @UseGuards(OrganizationGuard)
  @RequireRole(OrganizationRole.EDITOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() removeDto: RemoveMemberDto,
    @Request() req,
  ): Promise<void> {
    if (!isUUID(id)) throw new NotFoundException('Organization not found');
    if (!isUUID(memberId)) throw new NotFoundException('Member not found');
    removeDto.memberId = memberId;
    return this.organizationsService.removeMember(id, removeDto, req.user.id);
  }

  @Post(':id/leave')
  @UseGuards(OrganizationGuard)
  @RequireRole(OrganizationRole.WRITER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async leaveOrganization(
    @Param('id') id: string,
    @Request() req,
  ): Promise<void> {
    if (!isUUID(id)) throw new NotFoundException('Organization not found');
    return this.organizationsService.leaveOrganization(id, req.user.id);
  }

  @Get(':id/invitations')
  @UseGuards(OrganizationGuard)
  @RequireRole(OrganizationRole.EDITOR)
  async getInvitations(
    @Param('id') id: string,
    @Request() req,
  ): Promise<InvitationResponse[]> {
    if (!isUUID(id)) throw new NotFoundException('Organization not found');
    return this.organizationsService.getInvitations(id, req.user.id);
  }

  @Post(':id/invitations')
  @UseGuards(OrganizationGuard)
  @RequireRole(OrganizationRole.EDITOR)
  async createInvitation(
    @Param('id') id: string,
    @Body() createDto: CreateInvitationDto,
    @Request() req,
  ): Promise<InvitationResponse> {
    if (!isUUID(id)) throw new NotFoundException('Organization not found');
    return this.organizationsService.createInvitation(id, createDto, req.user.id);
  }

  @Post(':id/invitations/:invitationId/resend')
  @UseGuards(OrganizationGuard)
  @RequireRole(OrganizationRole.EDITOR)
  async resendInvitation(
    @Param('id') id: string,
    @Param('invitationId') invitationId: string,
    @Request() req,
  ): Promise<InvitationResponse> {
    if (!isUUID(id)) throw new NotFoundException('Organization not found');
    if (!isUUID(invitationId)) throw new NotFoundException('Invitation not found');
    return this.organizationsService.resendInvitation(id, invitationId, req.user.id);
  }

  @Delete(':id/invitations/:invitationId')
  @UseGuards(OrganizationGuard)
  @RequireRole(OrganizationRole.EDITOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancelInvitation(
    @Param('id') id: string,
    @Param('invitationId') invitationId: string,
    @Request() req,
  ): Promise<void> {
    if (!isUUID(id)) throw new NotFoundException('Organization not found');
    if (!isUUID(invitationId)) throw new NotFoundException('Invitation not found');
    return this.organizationsService.cancelInvitation(id, invitationId, req.user.id);
  }

  @Post('invitations/accept')
  async acceptInvitation(
    @Body() body: AcceptInvitationDto,
    @Request() req,
  ): Promise<MemberResponse> {
    return this.organizationsService.acceptInvitation(body.token, req.user.id);
  }

  @Get('invitations/my')
  async getUserInvitations(@Request() req): Promise<InvitationResponse[]> {
    return this.organizationsService.getUserInvitations(req.user.id);
  }
} 