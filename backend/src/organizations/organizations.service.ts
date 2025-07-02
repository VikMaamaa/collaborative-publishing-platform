import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './organization.entity';
import { OrganizationMember, OrganizationRole } from './organization-member.entity';
import { User } from '../users/user.entity';
import { Invitation, InvitationStatus } from './invitation.entity';
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
} from './dto/organization.dto';
import { RealtimeService } from '../realtime/realtime.service';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(OrganizationMember)
    private memberRepository: Repository<OrganizationMember>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Invitation)
    private invitationRepository: Repository<Invitation>,
    private readonly realtimeService: RealtimeService,
  ) {}

  async createOrganization(
    createDto: CreateOrganizationDto,
    userId: string,
  ): Promise<OrganizationResponse> {
    // Check if organization name already exists
    const existingOrg = await this.organizationRepository.findOne({
      where: { name: createDto.name },
    });

    if (existingOrg) {
      throw new ConflictException('Organization with this name already exists');
    }

    // Create organization
    const organization = this.organizationRepository.create(createDto);
    const savedOrg = await this.organizationRepository.save(organization);

    // Add creator as owner
    const member = this.memberRepository.create({
      userId,
      organizationId: savedOrg.id,
      role: OrganizationRole.OWNER,
    });
    
    const savedMember = await this.memberRepository.save(member);

    return this.mapToOrganizationResponse(savedOrg);
  }

  async findAllOrganizations(userId: string): Promise<OrganizationResponse[]> {
    const organizations = await this.organizationRepository
      .createQueryBuilder('org')
      .leftJoin('org.members', 'member')
      .where('member.userId = :userId', { userId })
      .andWhere('member.isActive = :isActive', { isActive: true })
      .andWhere('org.isActive = :orgActive', { orgActive: true })
      .leftJoinAndSelect('org.members', 'allMembers')
      .getMany();

    return organizations.map(org => this.mapToOrganizationResponse(org));
  }

  async findOrganizationById(
    organizationId: string,
    userId: string,
  ): Promise<OrganizationResponse> {
    const organization = await this.organizationRepository
      .createQueryBuilder('org')
      .leftJoinAndSelect('org.members', 'members')
      .leftJoinAndSelect('members.user', 'user')
      .where('org.id = :organizationId', { organizationId })
      .andWhere('org.isActive = :isActive', { isActive: true })
      .getOne();

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Check if user is a member
    const isMember = organization.members.some(
      member => member.userId === userId && member.isActive,
    );

    if (!isMember) {
      throw new ForbiddenException('Access denied to this organization');
    }

    return this.mapToOrganizationResponse(organization);
  }

  async updateOrganization(
    organizationId: string,
    updateDto: UpdateOrganizationDto,
    userId: string,
  ): Promise<OrganizationResponse> {
    // Check if user has permission to update
    await this.checkUserPermission(organizationId, userId, OrganizationRole.EDITOR);

    // Check if name is being changed and if it conflicts
    if (updateDto.name) {
      const existingOrg = await this.organizationRepository.findOne({
        where: { name: updateDto.name, id: organizationId },
      });

      if (existingOrg && existingOrg.id !== organizationId) {
        throw new ConflictException('Organization with this name already exists');
      }
    }

    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    Object.assign(organization, updateDto);
    const updatedOrg = await this.organizationRepository.save(organization);

    return this.mapToOrganizationResponse(updatedOrg);
  }

  async deleteOrganization(
    organizationId: string,
    userId: string,
  ): Promise<void> {
    // Only owner can delete organization
    await this.checkUserPermission(organizationId, userId, OrganizationRole.OWNER);

    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Soft delete organization
    organization.isActive = false;
    await this.organizationRepository.save(organization);

    // Deactivate all members
    await this.memberRepository.update(
      { organizationId },
      { isActive: false },
    );
  }

  async getMembers(
    organizationId: string,
    userId: string,
  ): Promise<MemberResponse[]> {
    // Check if user is a member
    await this.checkUserPermission(organizationId, userId, OrganizationRole.WRITER);

    const members = await this.memberRepository
      .createQueryBuilder('member')
      .leftJoinAndSelect('member.user', 'user')
      .where('member.organizationId = :organizationId', { organizationId })
      .andWhere('member.isActive = :isActive', { isActive: true })
      .getMany();

    return members.map(member => this.mapToMemberResponse(member));
  }

  async inviteMember(
    organizationId: string,
    inviteDto: InviteMemberDto,
    userId: string,
  ): Promise<MemberResponse> {
    // Check if user has permission to invite
    await this.checkUserPermission(organizationId, userId, OrganizationRole.EDITOR);

    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email: inviteDto.email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is already a member
    const existingMember = await this.memberRepository.findOne({
      where: {
        userId: user.id,
        organizationId,
        isActive: true,
      },
    });

    if (existingMember) {
      throw new ConflictException('User is already a member of this organization');
    }

    // Create member
    const member = this.memberRepository.create({
      userId: user.id,
      organizationId,
      role: inviteDto.role,
    });

    const savedMember = await this.memberRepository.save(member);
    // Realtime notification for member join
    this.realtimeService.sendMemberJoin(organizationId, user.email, { userId: user.id });
    return this.mapToMemberResponse(savedMember);
  }

  async updateMemberRole(
    organizationId: string,
    updateDto: UpdateMemberRoleDto,
    userId: string,
  ): Promise<MemberResponse> {
    // Check if user has permission to update roles
    await this.checkUserPermission(organizationId, userId, OrganizationRole.EDITOR);

    const member = await this.memberRepository.findOne({
      where: {
        id: updateDto.memberId,
        organizationId,
        isActive: true,
      },
      relations: ['user'],
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Prevent changing owner role unless it's the owner themselves
    if (member.role === OrganizationRole.OWNER && member.userId !== userId) {
      throw new ForbiddenException('Cannot change owner role');
    }

    // Prevent promoting to owner unless current user is owner
    if (updateDto.role === OrganizationRole.OWNER) {
      const currentUserMember = await this.memberRepository.findOne({
        where: { userId, organizationId, isActive: true },
      });

      if (!currentUserMember || currentUserMember.role !== OrganizationRole.OWNER) {
        throw new ForbiddenException('Only owners can promote to owner role');
      }
    }

    member.role = updateDto.role;
    const updatedMember = await this.memberRepository.save(member);

    return this.mapToMemberResponse(updatedMember);
  }

  async removeMember(
    organizationId: string,
    removeDto: RemoveMemberDto,
    userId: string,
  ): Promise<void> {
    // Check if user has permission to remove members
    await this.checkUserPermission(organizationId, userId, OrganizationRole.EDITOR);

    const member = await this.memberRepository.findOne({
      where: {
        id: removeDto.memberId,
        organizationId,
        isActive: true,
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Prevent removing owner unless it's themselves
    if (member.role === OrganizationRole.OWNER && member.userId !== userId) {
      throw new ForbiddenException('Cannot remove owner');
    }

    // Prevent removing yourself if you're the only owner
    if (member.userId === userId && member.role === OrganizationRole.OWNER) {
      const ownerCount = await this.memberRepository.count({
        where: {
          organizationId,
          role: OrganizationRole.OWNER,
          isActive: true,
        },
      });

      if (ownerCount === 1) {
        throw new ForbiddenException('Cannot remove the only owner');
      }
    }

    member.isActive = false;
    await this.memberRepository.save(member);
  }

  async leaveOrganization(
    organizationId: string,
    userId: string,
  ): Promise<void> {
    const member = await this.memberRepository.findOne({
      where: {
        userId,
        organizationId,
        isActive: true,
      },
    });

    if (!member) {
      throw new NotFoundException('You are not a member of this organization');
    }

    // If leaving as owner, ensure there's another owner
    if (member.role === OrganizationRole.OWNER) {
      const ownerCount = await this.memberRepository.count({
        where: {
          organizationId,
          role: OrganizationRole.OWNER,
          isActive: true,
        },
      });

      if (ownerCount === 1) {
        throw new ForbiddenException('Cannot leave as the only owner. Transfer ownership first.');
      }
    }

    member.isActive = false;
    await this.memberRepository.save(member);
  }

  async createInvitation(
    organizationId: string,
    createDto: CreateInvitationDto,
    userId: string,
  ): Promise<InvitationResponse> {
    // Check if user has permission to invite
    await this.checkUserPermission(organizationId, userId, OrganizationRole.EDITOR);

    // Check if user is already a member by email
    const existingMember = await this.memberRepository.findOne({
      where: {
        organizationId,
        isActive: true,
      },
      relations: ['user'],
    });

    // Find user by email to check if they exist and are already a member
    const userToInvite = await this.userRepository.findOne({
      where: { email: createDto.email },
    });

    if (userToInvite) {
      const existingMemberByUser = await this.memberRepository.findOne({
        where: {
          userId: userToInvite.id,
          organizationId,
          isActive: true,
        },
      });

      if (existingMemberByUser) {
        throw new ConflictException('User is already a member of this organization');
      }
    }

    // Check if there's already a pending invitation for this email
    const existingInvitation = await this.invitationRepository.findOne({
      where: {
        organizationId,
        email: createDto.email,
        status: InvitationStatus.PENDING,
      },
    });

    if (existingInvitation) {
      throw new ConflictException('An invitation is already pending for this email');
    }

    // Generate a unique token
    const token = this.generateInvitationToken();

    // Create invitation with 7-day expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = this.invitationRepository.create({
      organizationId,
      email: createDto.email,
      role: createDto.role,
      status: InvitationStatus.PENDING,
      token,
      invitedBy: userId,
      expiresAt,
    });

    const savedInvitation = await this.invitationRepository.save(invitation);
    // Realtime notification for invitation sent
    this.realtimeService.sendInvitation(userId, `Invitation sent to ${createDto.email}`, { invitationId: savedInvitation.id });
    return this.mapToInvitationResponse(savedInvitation);
  }

  async getInvitations(
    organizationId: string,
    userId: string,
  ): Promise<InvitationResponse[]> {
    // Check if user has permission to view invitations
    await this.checkUserPermission(organizationId, userId, OrganizationRole.EDITOR);

    const invitations = await this.invitationRepository.find({
      where: {
        organizationId,
        status: InvitationStatus.PENDING,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    return invitations.map(invitation => this.mapToInvitationResponse(invitation));
  }

  async resendInvitation(
    organizationId: string,
    invitationId: string,
    userId: string,
  ): Promise<InvitationResponse> {
    // Check if user has permission to manage invitations
    await this.checkUserPermission(organizationId, userId, OrganizationRole.EDITOR);

    const invitation = await this.invitationRepository.findOne({
      where: {
        id: invitationId,
        organizationId,
        status: InvitationStatus.PENDING,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found or not pending');
    }

    // Generate a new token and extend expiration
    invitation.token = this.generateInvitationToken();
    invitation.updatedAt = new Date();
    
    // Extend expiration by 7 days
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);
    invitation.expiresAt = newExpiresAt;

    const updatedInvitation = await this.invitationRepository.save(invitation);
    return this.mapToInvitationResponse(updatedInvitation);
  }

  async cancelInvitation(
    organizationId: string,
    invitationId: string,
    userId: string,
  ): Promise<void> {
    // Check if user has permission to manage invitations
    await this.checkUserPermission(organizationId, userId, OrganizationRole.EDITOR);

    const invitation = await this.invitationRepository.findOne({
      where: {
        id: invitationId,
        organizationId,
        status: InvitationStatus.PENDING,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found or not pending');
    }

    invitation.status = InvitationStatus.CANCELED;
    await this.invitationRepository.save(invitation);
    // Realtime notification for invitation canceled
    this.realtimeService.sendInvitation(userId, `Invitation canceled for ${invitation.email}`, { invitationId: invitation.id });
  }

  async acceptInvitation(token: string, userId: string): Promise<MemberResponse> {
    const invitation = await this.invitationRepository.findOne({
      where: {
        token,
        status: InvitationStatus.PENDING,
      },
      relations: ['organization'],
    });

    if (!invitation) {
      throw new NotFoundException('Invalid or expired invitation token');
    }

    // Check if invitation has expired
    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      // Mark invitation as expired
      invitation.status = InvitationStatus.EXPIRED;
      await this.invitationRepository.save(invitation);
      throw new NotFoundException('Invitation has expired');
    }

    // Check if user is already a member
    const existingMember = await this.memberRepository.findOne({
      where: {
        userId,
        organizationId: invitation.organizationId,
        isActive: true,
      },
    });

    if (existingMember) {
      throw new ConflictException('You are already a member of this organization');
    }

    // Create member
    const member = this.memberRepository.create({
      userId,
      organizationId: invitation.organizationId,
      role: invitation.role,
    });

    const savedMember = await this.memberRepository.save(member);
    // Realtime notification for member join
    this.realtimeService.sendMemberJoin(invitation.organizationId, `User ${userId} joined`, { userId });
    // Mark invitation as accepted
    invitation.status = InvitationStatus.ACCEPTED;
    await this.invitationRepository.save(invitation);

    return this.mapToMemberResponse(savedMember);
  }

  async getUserInvitations(userId: string): Promise<InvitationResponse[]> {
    // Get user's email
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Find pending invitations for this user's email
    const invitations = await this.invitationRepository.find({
      where: {
        email: user.email,
        status: InvitationStatus.PENDING,
      },
      relations: ['organization'],
      order: {
        createdAt: 'DESC',
      },
    });

    return invitations.map(invitation => this.mapToInvitationResponse(invitation));
  }

  async cleanupExpiredInvitations(): Promise<void> {
    // Find all expired invitations and mark them as expired
    const expiredInvitations = await this.invitationRepository.find({
      where: {
        status: InvitationStatus.PENDING,
      },
    });

    const now = new Date();
    const toExpire = expiredInvitations.filter(
      invitation => invitation.expiresAt && invitation.expiresAt < now,
    );

    if (toExpire.length > 0) {
      const ids = toExpire.map(inv => inv.id);
      await this.invitationRepository
        .createQueryBuilder()
        .update(Invitation)
        .set({ status: InvitationStatus.EXPIRED })
        .whereInIds(ids)
        .execute();
    }
  }

  private generateInvitationToken(): string {
    // Generate a more secure token using crypto
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }

  private mapToOrganizationResponse(organization: Organization): OrganizationResponse {
    return {
      id: organization.id,
      name: organization.name,
      description: organization.description,
      website: organization.website,
      isActive: organization.isActive,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
      memberCount: organization.members?.filter(m => m.isActive).length || 0,
    };
  }

  private mapToMemberResponse(member: OrganizationMember): MemberResponse {
    return {
      id: member.id,
      userId: member.userId,
      organizationId: member.organizationId,
      role: member.role,
      isActive: member.isActive,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
      user: member.user ? {
        id: member.user.id,
        email: member.user.email,
        username: member.user.username,
        firstName: member.user.firstName,
        lastName: member.user.lastName,
      } : undefined,
    };
  }

  private mapToInvitationResponse(invitation: Invitation): InvitationResponse {
    return {
      id: invitation.id,
      organizationId: invitation.organizationId,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      createdAt: invitation.createdAt,
      updatedAt: invitation.updatedAt,
      invitedBy: invitation.invitedBy,
      expiresAt: invitation.expiresAt,
    };
  }

  private async checkUserPermission(
    organizationId: string,
    userId: string,
    requiredRole: OrganizationRole,
  ): Promise<void> {
    const member = await this.memberRepository.findOne({
      where: {
        userId,
        organizationId,
        isActive: true,
      },
    });

    if (!member) {
      throw new ForbiddenException('Access denied to this organization');
    }

    if (!member.hasPermission(requiredRole)) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }
} 