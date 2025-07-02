'use client';

import { useState } from 'react';
import { useOrganizationsWithNotifications, useUI } from '@/lib/hooks';
import { Button, Input, Card } from '@/components/ui';
import { ROLES } from '@/lib/store';

interface CreateOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  name: string;
  description: string;
}

interface FormErrors {
  name?: string;
  description?: string;
  general?: string;
}

export default function CreateOrganizationModal({ isOpen, onClose }: CreateOrganizationModalProps) {
  const { createOrganizationWithNotification, inviteMemberWithNotification, createOrganization } = useOrganizationsWithNotifications();
  const { } = useUI();
  
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
      const org = await createOrganization({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      });
      setOrgId(org.id);
      
      // Step 2: Invite members
      for (const m of members.filter(m => m.email.trim())) {
        try {
          await inviteMemberWithNotification(org.id, {
            email: m.email.trim(),
            role: m.role,
          });
        } catch (err: any) {
          // Error handling is now done in the enhanced hook
          console.error(`Failed to invite ${m.email}:`, err);
        }
      }
      setFormData({ name: '', description: '' });
      setMembers([{ email: '', role: ROLES.VIEWER }]);
      setStep(1);
      onClose();
    } catch (error: any) {
      setErrors({ general: error.message || 'Failed to create organization. Please try again.' });
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

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({ name: '', description: '' });
      setErrors({});
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Create New Organization
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Create a new organization to collaborate with your team.
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-800">{errors.general}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 1: Org details */}
              {step === 1 && (
                <>
                  <div>
                    <Input
                      label="Organization Name"
                      type="text"
                      value={formData.name}
                      onChange={handleInputChange('name')}
                      error={errors.name}
                      placeholder="Enter organization name"
                      required
                      leftIcon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={handleInputChange('description')}
                      rows={3}
                      placeholder="Describe your organization..."
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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

                  <div className="flex gap-2 justify-end pt-2">
                    <Button type="button" variant="primary" onClick={handleNext}>Next</Button>
                  </div>
                </>
              )}

              {/* Step 2: Invite members */}
              {step === 2 && (
                <>
                  <div className="space-y-2">
                    {members.map((m, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <Input label="Email" type="email" value={m.email} onChange={e => handleMemberChange(idx, 'email', e.target.value)} error={memberErrors[idx]?.email} placeholder="Email address" required className="flex-1" />
                        <select value={m.role} onChange={e => handleMemberChange(idx, 'role', e.target.value)} className="border rounded p-2">
                          <option value={ROLES.OWNER}>Owner</option>
                          <option value={ROLES.EDITOR}>Editor</option>
                          <option value={ROLES.WRITER}>Writer</option>
                          <option value={ROLES.VIEWER}>Viewer</option>
                        </select>
                        <Button type="button" variant="outline" onClick={() => handleRemoveMember(idx)} disabled={members.length === 1}>Remove</Button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="secondary" onClick={handleAddMember}>Add Another</Button>
                    <Button type="button" variant="outline" onClick={handleBack}>Back</Button>
                    <Button type="button" variant="primary" onClick={handleNext}>Next</Button>
                  </div>
                </>
              )}

              {/* Step 3: Review & Confirm */}
              {step === 3 && (
                <>
                  <Card className="mb-4">
                    <div className="p-4">
                      <h4 className="font-semibold mb-2">Organization</h4>
                      <div><b>Name:</b> {formData.name}</div>
                      <div><b>Description:</b> {formData.description || <span className="text-gray-400">(none)</span>}</div>
                      <h4 className="font-semibold mt-4 mb-2">Invitations</h4>
                      {members.filter(m => m.email.trim()).length === 0 ? <div className="text-gray-500">No invitations</div> : (
                        <ul className="list-disc ml-6">
                          {members.filter(m => m.email.trim()).map((m, idx) => (
                            <li key={idx}>{m.email} ({m.role})</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </Card>

                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={handleBack}>Back</Button>
                    <Button type="submit" variant="primary" loading={isSubmitting}>Create Organization</Button>
                  </div>
                </>
              )}
            </form>
          </div>

          {/* Modal actions */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="w-full sm:w-auto sm:ml-3"
            >
              Create Organization
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="mt-3 w-full sm:mt-0 sm:w-auto"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 