import { Roles } from './roles.decorator';

export function RequireRole(...roles: string[]) {
  return Roles(...roles);
} 