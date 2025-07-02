'use client';

import { useState } from 'react';
import { useAuth, useUI } from '@/lib/hooks';
import { Button, Input, SkeletonCard } from '@/components/ui';
import { User } from '@/types';
import { apiClient } from '@/lib/api';
import { useRouter } from 'next/navigation';
import DashboardLayout, { 
  DashboardGrid, 
  DashboardCard, 
  DashboardSection 
} from '@/components/layout/DashboardLayout';

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ProfileFormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  username?: string;
  general?: string;
}

interface PasswordFormErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  general?: string;
}

export default function UserProfile() {
  const { user, updateUser, logout } = useAuth();
  const { addNotification, openConfirmModal } = useUI();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'account'>('profile');
  const [isLoading, setIsLoading] = useState(false);
  
  // Profile form state
  const [profileData, setProfileData] = useState<ProfileFormData>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    username: user?.username || '',
  });
  const [profileErrors, setProfileErrors] = useState<ProfileFormErrors>({});
  
  // Password form state
  const [passwordData, setPasswordData] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState<PasswordFormErrors>({});

  const validateProfileForm = (): boolean => {
    const newErrors: ProfileFormErrors = {};

    if (!profileData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!profileData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!profileData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!profileData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (profileData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(profileData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    setProfileErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = (): boolean => {
    const newErrors: PasswordFormErrors = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordData.newPassword)) {
      newErrors.newPassword = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateProfileForm()) {
      return;
    }

    try {
      setIsLoading(true);
      setProfileErrors({});
      
      await updateUser({
        firstName: profileData.firstName.trim(),
        lastName: profileData.lastName.trim(),
        email: profileData.email.trim(),
        username: profileData.username.trim(),
      });
      
      // Show success notification
      addNotification({
        type: 'success',
        message: 'Profile updated successfully!',
        duration: 3000,
      });
    } catch (error: any) {
      console.error('Profile update error:', error);
      setProfileErrors({
        general: error.message || 'Failed to update profile. Please try again.',
      });
      
      // Show error notification
      addNotification({
        type: 'error',
        message: error.message || 'Failed to update profile. Please try again.',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }

    try {
      setIsLoading(true);
      setPasswordErrors({});
      
      if (!user) throw new Error('No user logged in');
      
      await apiClient.changePassword(user.id, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      
      // Clear form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      // Show success notification
      addNotification({
        type: 'success',
        message: 'Password changed successfully!',
        duration: 3000,
      });
    } catch (error: any) {
      console.error('Password change error:', error);
      setPasswordErrors({
        general: error.message || 'Failed to change password. Please try again.',
      });
      
      // Show error notification
      addNotification({
        type: 'error',
        message: error.message || 'Failed to change password. Please try again.',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileInputChange = (field: keyof ProfileFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setProfileData(prev => ({
      ...prev,
      [field]: e.target.value,
    }));
    
    // Clear field-specific error when user starts typing
    if (profileErrors[field]) {
      setProfileErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handlePasswordInputChange = (field: keyof PasswordFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: e.target.value,
    }));
    
    // Clear field-specific error when user starts typing
    if (passwordErrors[field]) {
      setPasswordErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  if (!user) {
    return (
      <DashboardLayout>
        <SkeletonCard title={true} subtitle={true} content={true} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardSection 
        title="Account Settings"
        subtitle="Manage your account information and preferences"
      >

        <DashboardCard>
          {/* Navigation Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'profile'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'password'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Password
              </button>
              <button
                onClick={() => setActiveTab('account')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'account'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Account
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                {profileErrors.general && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-sm text-red-800">{profileErrors.general}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <Input
                    label="First Name"
                    type="text"
                    value={profileData.firstName}
                    onChange={handleProfileInputChange('firstName')}
                    error={profileErrors.firstName}
                    placeholder="Enter your first name"
                  />

                  <Input
                    label="Last Name"
                    type="text"
                    value={profileData.lastName}
                    onChange={handleProfileInputChange('lastName')}
                    error={profileErrors.lastName}
                    placeholder="Enter your last name"
                  />
                </div>

                <Input
                  label="Email Address"
                  type="email"
                  value={profileData.email}
                  onChange={handleProfileInputChange('email')}
                  error={profileErrors.email}
                  placeholder="Enter your email address"
                />

                <Input
                  label="Username"
                  type="text"
                  value={profileData.username}
                  onChange={handleProfileInputChange('username')}
                  error={profileErrors.username}
                  placeholder="Enter your username"
                />

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    loading={isLoading}
                  >
                    Update Profile
                  </Button>
                </div>
              </form>
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                {passwordErrors.general && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-sm text-red-800">{passwordErrors.general}</p>
                  </div>
                )}

                <Input
                  label="Current Password"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordInputChange('currentPassword')}
                  error={passwordErrors.currentPassword}
                  placeholder="Enter your current password"
                />

                <Input
                  label="New Password"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={handlePasswordInputChange('newPassword')}
                  error={passwordErrors.newPassword}
                  placeholder="Enter your new password"
                />

                <Input
                  label="Confirm New Password"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordInputChange('confirmPassword')}
                  error={passwordErrors.confirmPassword}
                  placeholder="Confirm your new password"
                />

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    loading={isLoading}
                  >
                    Change Password
                  </Button>
                </div>
              </form>
            )}

            {/* Account Tab */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-md p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-500">User ID:</span>
                      <span className="ml-2 text-sm text-gray-900">{user.id}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Member since:</span>
                      <span className="ml-2 text-sm text-gray-900">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Last updated:</span>
                      <span className="ml-2 text-sm text-gray-900">
                        {new Date(user.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Danger Zone</h3>
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <h4 className="text-sm font-medium text-red-800">Delete Account</h4>
                    <p className="text-sm text-red-700 mt-1">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <div className="mt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          openConfirmModal({
                            title: 'Delete Account',
                            message: 'Are you sure you want to delete your account? This action cannot be undone.',
                            confirmLabel: 'Delete',
                            cancelLabel: 'Cancel',
                            onConfirm: async () => {
                              try {
                                if (!user) throw new Error('No user logged in');
                                await apiClient.deleteAccount(user.id);
                                addNotification({
                                  type: 'success',
                                  message: 'Account deleted successfully. You will be logged out.',
                                  duration: 4000,
                                });
                                logout();
                                router.push('/');
                              } catch (error: any) {
                                addNotification({
                                  type: 'error',
                                  message: error.message || 'Failed to delete account. Please try again.',
                                  duration: 4000,
                                });
                              }
                            },
                          });
                        }}
                        className="border-red-300 text-red-700 hover:bg-red-50"
                      >
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <Button
                    variant="outline"
                    onClick={logout}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    Sign Out
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DashboardCard>
        </DashboardSection>
      </DashboardLayout>
  );
} 