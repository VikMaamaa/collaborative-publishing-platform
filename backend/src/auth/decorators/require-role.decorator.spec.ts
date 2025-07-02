import { RequireRole } from './require-role.decorator';
import { Roles } from './roles.decorator';

// Mock the Roles decorator
jest.mock('./roles.decorator', () => ({
  Roles: jest.fn(),
}));

describe('RequireRole Decorator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call Roles decorator with single role', () => {
    const role = 'owner';
    const mockRolesResult = jest.fn();
    (Roles as jest.Mock).mockReturnValue(mockRolesResult);

    const result = RequireRole(role);

    expect(Roles).toHaveBeenCalledWith(role);
    expect(result).toBe(mockRolesResult);
  });

  it('should work with different role types', () => {
    const roles = ['owner', 'editor', 'writer'];
    
    roles.forEach(role => {
      RequireRole(role);
      expect(Roles).toHaveBeenCalledWith(role);
    });
  });

  it('should handle empty string role', () => {
    const role = '';
    RequireRole(role);
    
    expect(Roles).toHaveBeenCalledWith(role);
  });
}); 