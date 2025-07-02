import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UsersService } from '../../users/users.service';
import { OrganizationsService } from '../../organizations/organizations.service';
import { OrganizationMember } from '../../organizations/organization-member.entity';
import { OrganizationRole } from '../../organizations/organization-role.enum';

@Injectable()
export class OrganizationGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private usersService: UsersService,
    private organizationsService: OrganizationsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const req = context.switchToHttp().getRequest();
      const user = req.user;
      const orgId = req.params['orgId'] || req.params['id'] || req.body['organizationId'] || req.query['organizationId'];
      const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [context.getHandler(), context.getClass()]) || [];
      
      if (!requiredRoles || requiredRoles.length === 0) {
        return true;
      }

      if (!user || !orgId) {
        throw new ForbiddenException('User or organization not specified');
      }

      // Check if the organization exists and is active
      const organization = await this.organizationsService['organizationRepository'].findOne({
        where: { id: orgId, isActive: true },
      });
      if (!organization) {
        throw new ForbiddenException('Organization not found or inactive');
      }

      // Fetch the user's role in the organization
      const role = await this.usersService.getUserRoleInOrganization(user.id, orgId);
      
      if (!role) {
        throw new ForbiddenException('Insufficient role for this organization');
      }

      // Check if user has any of the required roles using hierarchy
      const hasPermission = requiredRoles.some(requiredRole => 
        this.hasRolePermission(role, requiredRole)
      );

      if (!hasPermission) {
        throw new ForbiddenException('Insufficient role for this organization');
      }
      
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new ForbiddenException('Access denied');
    }
  }

  private hasRolePermission(userRole: OrganizationRole, requiredRole: string): boolean {
    const roleHierarchy = {
      [OrganizationRole.OWNER]: 3,
      [OrganizationRole.EDITOR]: 2,
      [OrganizationRole.WRITER]: 1,
    };

    const userRoleLevel = roleHierarchy[userRole];
    
    // Convert string role to OrganizationRole enum
    const requiredRoleEnum = Object.values(OrganizationRole).find(
      role => role === requiredRole
    ) as OrganizationRole;
    
    const requiredRoleLevel = roleHierarchy[requiredRoleEnum];

    // If the required role is not a valid OrganizationRole, deny access
    if (requiredRoleLevel === undefined) {
      return false;
    }

    return userRoleLevel >= requiredRoleLevel;
  }
} 