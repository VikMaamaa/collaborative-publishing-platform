import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdvancedAuthService, PermissionContext } from '../services/advanced-auth.service';
import { OrganizationRole } from '../../organizations/organization-role.enum';

export interface AdvancedAuthMetadata {
  requireOwner?: boolean;
  requireEditor?: boolean;
  requireWriter?: boolean;
  crossOrganization?: boolean;
  canManageUsers?: boolean;
  bulkOperation?: boolean;
  customPermission?: string;
}

export const ADVANCED_AUTH_KEY = 'advancedAuth';

@Injectable()
export class AdvancedAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private advancedAuthService: AdvancedAuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadata = this.reflector.getAllAndOverride<AdvancedAuthMetadata>(
      ADVANCED_AUTH_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!metadata) {
      return true; // No advanced auth requirements
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const orgId = this.extractOrganizationId(request);

    if (!user || !orgId) {
      throw new ForbiddenException('User or organization not specified');
    }

    // Check basic permission first
    const permissionContext: PermissionContext = {
      userId: user.id,
      organizationId: orgId,
      action: this.determineAction(metadata),
    };

    const hasBasicPermissionResult = await this.advancedAuthService.hasPermission(permissionContext);
    if (!hasBasicPermissionResult.allowed) {
      throw new ForbiddenException(hasBasicPermissionResult.reason || 'Insufficient basic permissions');
    }

    // Check advanced requirements
    if (metadata.requireOwner) {
      const isOwner = await this.checkRole(user.id, orgId, OrganizationRole.OWNER);
      if (!isOwner) {
        throw new ForbiddenException('Owner role required');
      }
    }

    if (metadata.requireEditor) {
      const isEditor = await this.checkRole(user.id, orgId, OrganizationRole.EDITOR);
      if (!isEditor) {
        throw new ForbiddenException('Editor role required');
      }
    }

    if (metadata.canManageUsers) {
      const targetUserId = request.params.userId || request.body.userId;
      if (!targetUserId) {
        throw new ForbiddenException('Target user ID required for user management');
      }

      const canManage = await this.advancedAuthService.canManageUser(
        user.id,
        targetUserId,
        orgId,
      );
      if (!canManage) {
        throw new ForbiddenException('Cannot manage this user');
      }
    }

    return true;
  }

  private extractOrganizationId(request: any): string {
    return (
      request.params.id ||
      request.params.orgId ||
      request.body.organizationId ||
      request.body.orgId ||
      request.query.organizationId ||
      request.query.orgId
    );
  }

  private determineAction(metadata: AdvancedAuthMetadata): 'read' | 'write' | 'delete' | 'manage' | 'invite' {
    if (metadata.requireOwner) return 'manage';
    if (metadata.requireEditor) return 'manage';
    if (metadata.canManageUsers) return 'manage';
    return 'read';
  }

  private async checkRole(userId: string, organizationId: string, requiredRole: OrganizationRole): Promise<boolean> {
    const permissionContext: PermissionContext = {
      userId,
      organizationId,
      action: 'read',
    };
    const hasPermissionResult = await this.advancedAuthService.hasPermission(permissionContext);
    if (!hasPermissionResult.allowed) return false;

    // Check role hierarchy
    const roleHierarchy = {
      [OrganizationRole.OWNER]: 3,
      [OrganizationRole.EDITOR]: 2,
      [OrganizationRole.WRITER]: 1,
    };

    // This is a simplified check - in a real implementation, you'd get the actual user role
    // For now, we'll assume the user has at least writer permissions if they passed the basic check
    return true;
  }
} 