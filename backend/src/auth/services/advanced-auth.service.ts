import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizationMember } from '../../organizations/organization-member.entity';
import { OrganizationRole } from '../../organizations/organization-role.enum';
import { Organization } from '../../organizations/organization.entity';
import { User, UserRole } from '../../users/user.entity';

export interface PermissionContext {
  userId: string;
  organizationId: string;
  targetUserId?: string;
  targetOrganizationId?: string;
  resourceType?: 'post' | 'organization' | 'member' | 'user';
  resourceId?: string;
  action?: 'read' | 'write' | 'delete' | 'manage' | 'invite';
  requireActiveMembership?: boolean;
  requireDirectRelationship?: boolean;
}

export interface ComplexPermissionCheck {
  userId: string;
  checks: Array<{
    organizationId: string;
    requiredRole: OrganizationRole;
    action?: string;
    resourceType?: string;
    resourceId?: string;
    requireActiveMembership?: boolean;
  }>;
  requireAll?: boolean;
}

export interface PermissionValidationResult {
  isValid: boolean;
  reason?: string;
  details?: {
    missingPermissions: string[];
    failedChecks: string[];
    relationshipIssues: string[];
  };
}

@Injectable()
export class AdvancedAuthService {
  constructor(
    @InjectRepository(OrganizationMember)
    private memberRepository: Repository<OrganizationMember>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Enhanced permission check with stricter relationship validation
   */
  async hasPermission(context: PermissionContext): Promise<{ allowed: boolean; reason?: string }> {
    const { 
      userId, 
      organizationId, 
      action = 'read',
      requireActiveMembership = true,
      requireDirectRelationship = true,
      targetUserId,
      resourceType,
      resourceId
    } = context;

    if (!userId || !organizationId) {
      return { allowed: false, reason: 'User ID and Organization ID are required' };
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      return { allowed: false, reason: 'User not found' };
    }
    if (user.isSuperAdmin && user.isSuperAdmin()) {
      return { allowed: true };
    }

    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId, isActive: true },
    });
    if (!organization) {
      return { allowed: false, reason: 'Organization not found' };
    }

    const memberQuery: any = { userId, organizationId };
    if (requireActiveMembership) {
      memberQuery.isActive = true;
    }
    const member = await this.memberRepository.findOne({
      where: memberQuery,
      relations: ['organization', 'user'],
    });
    if (!member) {
      return { allowed: false, reason: 'Membership not found'  };
    }
    if (!member.user || !member.user.isActive) {
      return { allowed: false, reason: 'User is not active' };
    }
    if (requireDirectRelationship && member.organizationId !== organizationId) {
      return { allowed: false, reason: 'No direct relationship with organization' };
    }
    if (resourceType && resourceId) {
      const resourcePermission = await this.checkResourcePermission(
        member,
        resourceType,
        resourceId,
        action
      );
      if (!resourcePermission) {
        return { allowed: false, reason: 'Resource-specific permission denied' };
      }
    }
    if (targetUserId && targetUserId !== userId) {
      const canManageTarget = await this.canManageUser(userId, targetUserId, organizationId);
      if (!canManageTarget) {
        return { allowed: false, reason: 'Cannot manage target user' };
      }
    }
    if (!this.checkActionPermission(member.role, action)) {
      return { allowed: false, reason: 'Insufficient role for action' };
    }
    return { allowed: true };
  }

  /**
   * Enhanced complex permission checking with detailed validation
   */
  async checkComplexPermissions(
    check: ComplexPermissionCheck
  ): Promise<{ 
    hasAllPermissions: boolean; 
    failedPermissions: string[];
    validationResult: PermissionValidationResult;
  }> {
    const { userId, checks, requireAll = true } = check;
    const failedPermissions: string[] = [];
    const missingPermissions: string[] = [];
    const failedChecks: string[] = [];
    const relationshipIssues: string[] = [];

    // Validate user exists and is active
    const user = await this.userRepository.findOne({
      where: { id: userId, isActive: true },
    });
    if (!user) {
      return {
        hasAllPermissions: false,
        failedPermissions: ['User not found or inactive'],
        validationResult: {
          isValid: false,
          reason: 'User not found or inactive',
          details: {
            missingPermissions,
            failedChecks,
            relationshipIssues,
          },
        },
      };
    }
    if (user.isSuperAdmin && user.isSuperAdmin()) {
      return {
        hasAllPermissions: true,
        failedPermissions: [],
        validationResult: {
          isValid: true,
          details: {
            missingPermissions,
            failedChecks,
            relationshipIssues,
          },
        },
      };
    }
    for (const permissionCheck of checks) {
      const permResult = await this.hasPermission({
        userId,
        organizationId: permissionCheck.organizationId,
        action: permissionCheck.action as any,
        resourceType: permissionCheck.resourceType as any,
        resourceId: permissionCheck.resourceId,
        requireActiveMembership: permissionCheck.requireActiveMembership,
      });
      if (!permResult.allowed) {
        const failedCheck = permResult.reason
          ? `Permission check failed for organization ${permissionCheck.organizationId}: ${permResult.reason}`
          : `Permission check failed for organization ${permissionCheck.organizationId}`;
        failedChecks.push(failedCheck);
        failedPermissions.push(failedCheck);
      }
    }
    const hasAllPermissions = requireAll 
      ? failedPermissions.length === 0 
      : failedPermissions.length < checks.length;
    return {
      hasAllPermissions,
      failedPermissions,
      validationResult: {
        isValid: hasAllPermissions,
        reason: hasAllPermissions ? undefined : 'Some permission checks failed',
        details: {
          missingPermissions,
          failedChecks,
          relationshipIssues,
        },
      },
    };
  }

  /**
   * Enhanced user management permission check
   */
  async canManageUser(
    managerId: string,
    targetUserId: string,
    organizationId: string,
    requireActiveMembership: boolean = true
  ): Promise<boolean> {
    // Validate input parameters
    if (!managerId || !targetUserId || !organizationId) {
      throw new BadRequestException('Manager ID, Target User ID, and Organization ID are required');
    }

    // Check if manager is superadmin - superadmins can manage any user
    const manager = await this.userRepository.findOne({ where: { id: managerId } });
    if (manager?.isSuperAdmin()) {
      return true; // Superadmins can manage any user
    }

    // Get manager's membership
    const managerQuery: any = { 
      userId: managerId, 
      organizationId 
    };

    if (requireActiveMembership) {
      managerQuery.isActive = true;
    }

    const managerMember = await this.memberRepository.findOne({
      where: managerQuery,
      relations: ['organization', 'user'],
    });

    if (!managerMember || !managerMember.user?.isActive) {
      return false;
    }

    // Handle self-management: only owners and superadmins can manage themselves
    if (managerId === targetUserId) {
      return managerMember.role === OrganizationRole.OWNER;
    }

    // Get target user's membership
    const targetQuery: any = { 
      userId: targetUserId, 
      organizationId 
    };

    if (requireActiveMembership) {
      targetQuery.isActive = true;
    }

    const targetMember = await this.memberRepository.findOne({
      where: targetQuery,
      relations: ['organization', 'user'],
    });

    if (!targetMember || !targetMember.user?.isActive) {
      return false;
    }

    // Check role hierarchy - manager must have higher or equal role
    const roleHierarchy = {
      [OrganizationRole.OWNER]: 3,
      [OrganizationRole.EDITOR]: 2,
      [OrganizationRole.WRITER]: 1,
    };

    const managerRoleLevel = roleHierarchy[managerMember.role] || 0;
    const targetRoleLevel = roleHierarchy[targetMember.role] || 0;

    return managerRoleLevel >= targetRoleLevel;
  }

  /**
   * Get user's effective permissions with enhanced validation
   */
  async getUserEffectivePermissions(userId: string): Promise<{
    organizations: Array<{
      organizationId: string;
      role: OrganizationRole;
      permissions: string[];
      isActive: boolean;
      organizationName: string;
    }>;
    totalOrganizations: number;
    totalActiveOrganizations: number;
  }> {
    // Validate user exists and is active
    const user = await this.userRepository.findOne({
      where: { id: userId, isActive: true },
    });

    if (!user) {
      throw new BadRequestException('User not found or inactive');
    }

    const memberships = await this.memberRepository.find({
      where: { userId, isActive: true },
      relations: ['organization'],
    }) || [];

    const organizations = memberships
      .filter(membership => membership.organization && membership.organization.isActive)
      .map(membership => ({
        organizationId: membership.organizationId,
        role: membership.role,
        permissions: this.getPermissionsForRole(membership.role),
        isActive: membership.isActive,
        organizationName: membership.organization.name,
      }));

    return {
      organizations,
      totalOrganizations: organizations.length,
      totalActiveOrganizations: organizations.filter(org => org.isActive).length,
    };
  }

  // Private helper methods

  private async checkResourcePermission(
    member: OrganizationMember,
    resourceType: string,
    resourceId: string,
    action: string
  ): Promise<boolean> {
    // Implement resource-specific permission checks
    // This could check if the user owns the resource, has been granted access, etc.
    switch (resourceType) {
      case 'post':
        return this.checkPostPermission(member, resourceId, action);
      case 'organization':
        return this.checkOrganizationPermission(member, resourceId, action);
      case 'member':
        return this.checkMemberPermission(member, resourceId, action);
      case 'user':
        return this.checkUserPermission(member, resourceId, action);
      default:
        return true; // Default to allowing if resource type is not specified
    }
  }

  private async checkPostPermission(
    member: OrganizationMember,
    postId: string,
    action: string
  ): Promise<boolean> {
    // Implement post-specific permission logic
    // For now, return true if user has appropriate role
    return member.isWriter();
  }

  private async checkOrganizationPermission(
    member: OrganizationMember,
    orgId: string,
    action: string
  ): Promise<boolean> {
    // Implement organization-specific permission logic
    return member.organizationId === orgId && member.isEditor();
  }

  private async checkMemberPermission(
    member: OrganizationMember,
    memberId: string,
    action: string
  ): Promise<boolean> {
    // Implement member-specific permission logic
    return member.isEditor();
  }

  private async checkUserPermission(
    member: OrganizationMember,
    userId: string,
    action: string
  ): Promise<boolean> {
    // Implement user-specific permission logic
    return member.isEditor();
  }

  private checkActionPermission(role: OrganizationRole, action: string): boolean {
    const rolePermissions = {
      [OrganizationRole.OWNER]: ['read', 'write', 'delete', 'manage', 'invite'],
      [OrganizationRole.EDITOR]: ['read', 'write', 'manage'],
      [OrganizationRole.WRITER]: ['read', 'write'],
    };

    return rolePermissions[role]?.includes(action) || false;
  }

  private getPermissionsForRole(role: OrganizationRole): string[] {
    const rolePermissions = {
      [OrganizationRole.OWNER]: ['read', 'write', 'delete', 'manage', 'invite'],
      [OrganizationRole.EDITOR]: ['read', 'write', 'manage'],
      [OrganizationRole.WRITER]: ['read', 'write'],
    };

    return rolePermissions[role] || [];
  }
} 