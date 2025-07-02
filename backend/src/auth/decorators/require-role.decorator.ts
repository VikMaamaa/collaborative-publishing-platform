import { Roles } from './roles.decorator';

export function RequireRole(role: string) {
  return Roles(role);
} 