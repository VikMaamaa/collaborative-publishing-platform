'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/store/hooks';
import { createOrganization, inviteMember } from '@/store/organizationsSlice';
import { useUI } from '@/lib/hooks';
import { Button, Input, Card } from '@/components/ui';
import { ROLES } from '@/constants/roles';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SEOHead, { SEOConfigs } from '@/components/seo/SEOHead';

interface FormData {
  name: string;
  description: string;
}

interface FormErrors {
  name?: string;
  description?: string;
  general?: string;
}

export default function CreateOrganizationPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { addNotification } = useUI();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
  });
  const [members, setMembers] = useState([{ email: '', role: ROLES.VIEWER }]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [memberErrors, setMemberErrors] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Organization name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Organization name must be at least 2 characters';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Organization name must be less than 50 characters';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateMembers = () => {
    const errs = members.map((m) => {
      const e: any = {};
      if (!m.email.trim()) e.email = 'Email is required';
      else if (!/^\S+@\S+\.\S+$/.test(m.email.trim())) e.email = 'Invalid email';
      if (!m.role) e.role = 'Role is required';
      return e;
    });
    setMemberErrors(errs);
    return errs.every(e => Object.keys(e).length === 0);
  };

  const handleNext = () => {
    if (step === 1 && validateForm()) setStep(2);
    else if (step === 2 && validateMembers()) setStep(3);
  };
  const handleBack = () => setStep(step - 1);

  const handleAddMember = () => setMembers([...members, { email: '', role: ROLES.VIEWER }]);
  const handleRemoveMember = (idx: number) => setMembers(members.filter((_, i) => i !== idx));
  const handleMemberChange = (idx: number, field: 'email' | 'role', value: string) => {
    setMembers(members.map((m, i) => i === idx ? { ...m, [field]: value } : m));
    setMemberErrors(memberErrors.map((e, i) => i === idx ? { ...e, [field]: undefined } : e));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1 && validateForm()) return setStep(2);
    if (step === 2 && validateMembers()) return setStep(3);
    if (step !== 3) return;
    setIsSubmitting(true);
    setErrors({});
    try {
      // Step 1: Create org
      const result = await dispatch(createOrganization({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      }));
      let createdOrgId = null;
      if (result.payload && typeof result.payload === 'object' && 'id' in result.payload) {
        createdOrgId = result.payload.id;
        setOrgId(createdOrgId);
      }
      // Step 2: Invite members
      if (createdOrgId) {
        await Promise.all(
          members
            .filter(m => m.email.trim())
            .map(m =>
              dispatch(inviteMember({
                organizationId: createdOrgId,
                email: m.email.trim(),
                role: m.role,
              }))
            )
        );
      }
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        message: `Organization "${formData.name}" created successfully!`,
        duration: 5000,
      });
      setFormData({ name: '', description: '' });
      setMembers([{ email: '', role: ROLES.VIEWER }]);
      setStep(1);
      router.push('/organizations');
    } catch (error: any) {
      setErrors({ general: error.message || 'Failed to create organization. Please try again.' });
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        message: error.message || 'Failed to create organization. Please try again.',
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value,
    }));
    
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const steps = [
    { id: 1, title: 'Organization Details', icon: '🏢' },
    { id: 2, title: 'Invite Members', icon: '👥' },
    { id: 3, title: 'Review & Create', icon: '✅' }
  ];

  return (
    <ProtectedRoute>
      <SEOHead {...SEOConfigs.dashboard} />
      <DashboardLayout>
        <div className="max-w-4xl mx-auto py-8 px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Create New Organization</h1>
                <p className="text-gray-600 mt-2">Set up your organization and invite team members</p>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push('/organizations')}
              >
                Cancel
              </Button>
            </div>
            
            {/* Step indicator */}
            <div className="mt-6 flex items-center justify-center space-x-4">
              {steps.map((s, index) => (
                <div key={s.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium ${
                    step >= s.id 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step > s.id ? '✓' : s.id}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-2 ${
                      step > s.id ? 'bg-blue-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form content */}
          <Card className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-800 font-medium">{errors.general}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 1: Organization Details */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <div className="text-6xl mb-4">🏢</div>
                    <h2 className="text-2xl font-semibold text-gray-900">Organization Details</h2>
                    <p className="text-gray-600 mt-2">Let's start with the basic information about your organization.</p>
                  </div>

                  <div className="space-y-6">
                    <Input
                      label="Organization Name *"
                      type="text"
                      value={formData.name}
                      onChange={handleInputChange('name')}
                      error={errors.name}
                      placeholder="Enter your organization name"
                      required
                      className="text-lg"
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description (Optional)
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={handleInputChange('description')}
                        rows={4}
                        placeholder="Describe your organization's purpose, goals, or any other relevant information..."
                        className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 ${
                          errors.description ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {errors.description && (
                        <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        {formData.description.length}/500 characters
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Invite Members */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <div className="text-6xl mb-4">👥</div>
                    <h2 className="text-2xl font-semibold text-gray-900">Invite Team Members</h2>
                    <p className="text-gray-600 mt-2">Invite people to join your organization and assign their roles.</p>
                  </div>

                  <div className="space-y-6">
                    {members.map((member, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                        <div className="flex gap-4 items-start">
                          <div className="flex-1 space-y-4">
                            <Input
                              label={`Member ${idx + 1} Email *`}
                              type="email"
                              value={member.email}
                              onChange={(e) => handleMemberChange(idx, 'email', e.target.value)}
                              error={memberErrors[idx]?.email}
                              placeholder="Enter email address"
                              required
                            />
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Role *
                              </label>
                              <select
                                value={member.role}
                                onChange={(e) => handleMemberChange(idx, 'role', e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                              >
                                <option value={ROLES.OWNER}>Owner - Full access</option>
                                <option value={ROLES.EDITOR}>Editor - Can edit and publish</option>
                                <option value={ROLES.WRITER}>Writer - Can create and edit</option>
                                <option value={ROLES.VIEWER}>Viewer - Read-only access</option>
                              </select>
                            </div>
                          </div>
                          {members.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(idx)}
                              className="mt-8 p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={handleAddMember}
                      className="w-full py-4 px-6 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:text-gray-800 hover:border-gray-400 transition-colors"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>Add Another Member</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Review & Confirm */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <div className="text-6xl mb-4">✅</div>
                    <h2 className="text-2xl font-semibold text-gray-900">Review & Create</h2>
                    <p className="text-gray-600 mt-2">Please review your organization details before creating.</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                          <span className="mr-2">🏢</span>
                          Organization Details
                        </h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-700">Name:</span>
                            <span className="text-gray-900">{formData.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-700">Description:</span>
                            <span className="text-gray-900">
                              {formData.description || <span className="text-gray-400 italic">(none)</span>}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                          <span className="mr-2">👥</span>
                          Team Members ({members.filter(m => m.email.trim()).length})
                        </h3>
                        {members.filter(m => m.email.trim()).length === 0 ? (
                          <p className="text-gray-500 italic">No members to invite</p>
                        ) : (
                          <div className="space-y-2">
                            {members.filter(m => m.email.trim()).map((member, idx) => (
                              <div key={idx} className="flex justify-between items-center py-2 px-3 bg-white rounded">
                                <span className="text-gray-900">{member.email}</span>
                                <span className="text-sm text-gray-600 capitalize">{member.role}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation buttons */}
              <div className="flex justify-between pt-8 border-t border-gray-200">
                <div>
                  {step > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                      disabled={isSubmitting}
                      className="px-8 py-3"
                    >
                      ← Back
                    </Button>
                  )}
                </div>
                <div className="flex space-x-4">
                  {step < 3 ? (
                    <Button
                      type="button"
                      variant="primary"
                      onClick={handleNext}
                      disabled={isSubmitting}
                      className="px-8 py-3"
                    >
                      Next →
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      variant="primary"
                      loading={isSubmitting}
                      disabled={isSubmitting}
                      className="px-10 py-3"
                    >
                      {isSubmitting ? 'Creating...' : 'Create Organization'}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
} 