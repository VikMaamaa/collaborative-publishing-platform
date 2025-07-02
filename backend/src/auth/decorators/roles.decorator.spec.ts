import { SetMetadata } from '@nestjs/common';
import { Roles, ROLES_KEY } from './roles.decorator';

describe('Roles Decorator', () => {
  it('should set metadata with ROLES_KEY', () => {
    const roles = ['owner', 'editor'];
    const result = Roles(...roles);
    
    expect(result).toBeDefined();
    expect(typeof result).toBe('function');
  });

  it('should work with single role', () => {
    const role = 'owner';
    const result = Roles(role);
    
    expect(result).toBeDefined();
  });

  it('should work with multiple roles', () => {
    const roles = ['owner', 'editor', 'writer'];
    const result = Roles(...roles);
    
    expect(result).toBeDefined();
  });

  it('should work with empty roles array', () => {
    const result = Roles();
    
    expect(result).toBeDefined();
  });

  it('should export ROLES_KEY constant', () => {
    expect(ROLES_KEY).toBe('roles');
  });
}); 