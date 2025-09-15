# Memberstack DOM - Complete Implementation Examples

## AI Assistant Instructions
When implementing these examples:
- Copy patterns exactly as shown, adapting only necessary details
- Use proper TypeScript types from 08-types-reference.md
- Include comprehensive error handling from 09-error-handling.md
- Test all authentication flows thoroughly
- Implement proper loading states and user feedback
- Follow security best practices for token handling

## Overview

Real-world implementation examples and common patterns for Memberstack DOM integration, including complete authentication flows, plan management, and advanced features.

## 1. Complete Authentication System (Next.js/React with SSR Support)

> **⚠️ Note:** This example properly handles SSR by dynamically importing Memberstack only on the client side, preventing "localStorage is not defined" errors.

Full-featured authentication component with login, signup, and member management that works with Next.js App Router and Pages Router.

```typescript
// hooks/useMemberstack.ts
import { useState, useEffect, createContext, useContext } from 'react';
import { MemberstackErrorHandler } from './errorHandler';

interface MemberstackContextType {
  member: any | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, customFields?: Record<string, any>) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Record<string, any>) => Promise<void>;
  showModal: (type: string) => void;
}

const MemberstackContext = createContext<MemberstackContextType | null>(null);

export const useMemberstack = () => {
  const context = useContext(MemberstackContext);
  if (!context) {
    throw new Error('useMemberstack must be used within MemberstackProvider');
  }
  return context;
};

// Initialize Memberstack only on client side to prevent SSR errors
let memberstack: any = null;

const initMemberstack = async () => {
  if (typeof window !== 'undefined' && !memberstack) {
    const MemberstackDom = (await import('@memberstack/dom')).default;
    memberstack = MemberstackDom.init({
      publicKey: process.env.NEXT_PUBLIC_MEMBERSTACK_KEY!,
      useCookies: true,
      setCookieOnRootDomain: true
    });
  }
  return memberstack;
};

export const MemberstackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [member, setMember] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      // Initialize Memberstack first
      const ms = await initMemberstack();
      if (!ms) {
        throw new Error('Failed to initialize Memberstack');
      }

      // Get current member
      const currentMember = await ms.getCurrentMember();
      setMember(currentMember.data);
      setError(null);

      // Listen for auth changes
      ms.onAuthChange((member: any, error: any) => {
        if (error) {
          setError(error.message);
          setMember(null);
        } else {
          setMember(member?.data || null);
          setError(null);
        }
        setIsLoading(false);
      });
    } catch (error) {
      // User not logged in - this is expected
      setMember(null);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const ms = await initMemberstack();
      if (!ms) throw new Error('Memberstack not initialized');

      const result = await ms.loginMemberEmailPassword({ email, password });
      setMember(result.data.member);
    } catch (error) {
      MemberstackErrorHandler.handle(error, 'Login');
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, customFields?: Record<string, any>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await memberstack.signupMemberEmailPassword({
        email,
        password,
        customFields: customFields || {}
      });
      setMember(result.data.member);
    } catch (error) {
      MemberstackErrorHandler.handle(error, 'Signup');
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await memberstack.logout();
      setMember(null);
      setError(null);
    } catch (error) {
      MemberstackErrorHandler.handle(error, 'Logout');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: Record<string, any>) => {
    if (!member) throw new Error('No member logged in');
    
    setIsLoading(true);
    try {
      const result = await memberstack.updateMember({ customFields: data });
      setMember(result.data);
    } catch (error) {
      MemberstackErrorHandler.handle(error, 'Profile Update');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const showModal = (type: string) => {
    memberstack.showModal({ type });
  };

  return (
    <MemberstackContext.Provider value={{
      member,
      isLoading,
      error,
      login,
      signup,
      logout,
      updateProfile,
      showModal
    }}>
      {children}
    </MemberstackContext.Provider>
  );
};

// components/AuthForm.tsx
import React, { useState } from 'react';
import { useMemberstack } from '../hooks/useMemberstack';

interface AuthFormProps {
  mode: 'login' | 'signup';
  onModeChange: (mode: 'login' | 'signup') => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ mode, onModeChange }) => {
  const { login, signup, isLoading } = useMemberstack();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (mode === 'signup') {
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
      if (!formData.firstName) {
        newErrors.firstName = 'First name is required';
      }
      if (!formData.lastName) {
        newErrors.lastName = 'Last name is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      if (mode === 'login') {
        await login(formData.email, formData.password);
      } else {
        await signup(formData.email, formData.password, {
          'first-name': formData.firstName,
          'last-name': formData.lastName
        });
      }
      // Success - user will be redirected by auth state change
    } catch (error) {
      // Error handled by MemberstackProvider
      console.error(`${mode} failed:`, error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {mode === 'login' ? 'Sign In' : 'Create Account'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
          <>
            <div>
              <input
                type="text"
                placeholder="First Name"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
            </div>

            <div>
              <input
                type="text"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
            </div>
          </>
        )}

        <div>
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>

        <div>
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
        </div>

        {mode === 'signup' && (
          <div>
            <input
              type="password"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
        </button>
      </form>

      <div className="mt-4 text-center">
        <button
          onClick={() => onModeChange(mode === 'login' ? 'signup' : 'login')}
          className="text-blue-600 hover:text-blue-800"
          disabled={isLoading}
        >
          {mode === 'login' 
            ? "Don't have an account? Sign up" 
            : "Already have an account? Sign in"
          }
        </button>
      </div>
    </div>
  );
};
```

## 2. Plan Management & Subscription System

Complete subscription management with plan selection, checkout, and customer portal.

```typescript
// hooks/usePlans.ts
import { useState, useEffect } from 'react';
import { useMemberstack } from './useMemberstack';

export const usePlans = () => {
  const { member } = useMemberstack();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const response = await memberstack.getPlans();
      setPlans(response.data);
    } catch (error) {
      console.error('Failed to load plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToPlan = async (planId: string, successUrl?: string, cancelUrl?: string) => {
    try {
      const result = await memberstack.createCheckoutSession({
        planId,
        successUrl: successUrl || `${window.location.origin}/success`,
        cancelUrl: cancelUrl || `${window.location.origin}/plans`
      });
      
      // Redirect to Stripe checkout
      window.location.href = result.data.url;
    } catch (error) {
      throw new Error('Failed to create checkout session');
    }
  };

  const openCustomerPortal = async () => {
    try {
      const result = await memberstack.createCustomerPortalSession({
        returnUrl: window.location.href
      });
      window.location.href = result.data.url;
    } catch (error) {
      throw new Error('Failed to open customer portal');
    }
  };

  const getCurrentPlan = () => {
    if (!member?.planConnections?.length) return null;
    
    const activePlan = member.planConnections.find(
      (connection: any) => connection.status === 'ACTIVE'
    );
    
    return activePlan ? plans.find((plan: any) => plan.id === activePlan.planId) : null;
  };

  const hasActivePlan = () => {
    return member?.planConnections?.some(
      (connection: any) => connection.status === 'ACTIVE'
    ) || false;
  };

  const hasPlanAccess = (requiredPlanIds: string[]) => {
    if (!member?.planConnections?.length) return false;
    
    return member.planConnections.some(
      (connection: any) => 
        connection.status === 'ACTIVE' && 
        requiredPlanIds.includes(connection.planId)
    );
  };

  return {
    plans,
    loading,
    subscribeToPlan,
    openCustomerPortal,
    getCurrentPlan,
    hasActivePlan,
    hasPlanAccess,
    refetch: loadPlans
  };
};

// components/PlanSelector.tsx
import React from 'react';
import { usePlans } from '../hooks/usePlans';
import { useMemberstack } from '../hooks/useMemberstack';

export const PlanSelector: React.FC = () => {
  const { member } = useMemberstack();
  const { plans, loading, subscribeToPlan, getCurrentPlan, hasActivePlan, openCustomerPortal } = usePlans();
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);

  const currentPlan = getCurrentPlan();

  const handlePlanSelection = async (planId: string) => {
    setProcessingPlanId(planId);
    try {
      await subscribeToPlan(planId);
    } catch (error) {
      console.error('Subscription failed:', error);
      alert('Failed to process subscription. Please try again.');
    } finally {
      setProcessingPlanId(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      await openCustomerPortal();
    } catch (error) {
      console.error('Failed to open customer portal:', error);
      alert('Failed to open customer portal. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h2 className="text-3xl font-bold text-center mb-8">Choose Your Plan</h2>

      {hasActivePlan() && (
        <div className="mb-8 p-4 bg-green-100 border border-green-400 rounded-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-800 font-medium">
                Current Plan: {currentPlan?.name || 'Active Subscription'}
              </p>
              <p className="text-green-600 text-sm">
                You have an active subscription
              </p>
            </div>
            <button
              onClick={handleManageSubscription}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Manage Subscription
            </button>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan: any) => {
          const isCurrentPlan = currentPlan?.id === plan.id;
          const isProcessing = processingPlanId === plan.id;
          
          return (
            <div
              key={plan.id}
              className={`border rounded-lg p-6 ${
                isCurrentPlan 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
              <p className="text-gray-600 mb-4">{plan.description}</p>
              
              <div className="mb-4">
                <span className="text-3xl font-bold">${plan.amount}</span>
                <span className="text-gray-500">/{plan.interval}</span>
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features?.map((feature: string, index: number) => (
                  <li key={index} className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePlanSelection(plan.id)}
                disabled={isCurrentPlan || isProcessing || !member}
                className={`w-full py-2 px-4 rounded-md font-medium ${
                  isCurrentPlan
                    ? 'bg-blue-100 text-blue-800 cursor-not-allowed'
                    : !member
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isProcessing 
                  ? 'Processing...' 
                  : isCurrentPlan 
                  ? 'Current Plan' 
                  : !member
                  ? 'Sign In Required'
                  : 'Choose Plan'
                }
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

## 3. Protected Content System

Content gating based on plans and member status.

```typescript
// components/ProtectedContent.tsx
import React, { useState, useEffect } from 'react';
import { useMemberstack } from '../hooks/useMemberstack';
import { usePlans } from '../hooks/usePlans';

interface ProtectedContentProps {
  children: React.ReactNode;
  requiredPlans?: string[];
  fallbackContent?: React.ReactNode;
  showUpgrade?: boolean;
  contentId?: string;
}

export const ProtectedContent: React.FC<ProtectedContentProps> = ({
  children,
  requiredPlans = [],
  fallbackContent,
  showUpgrade = true,
  contentId
}) => {
  const { member, showModal } = useMemberstack();
  const { hasPlanAccess, plans } = usePlans();
  const [secureContent, setSecureContent] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (contentId && member) {
      loadSecureContent();
    }
  }, [contentId, member]);

  const loadSecureContent = async () => {
    if (!contentId) return;
    
    setLoading(true);
    try {
      const result = await memberstack.getSecureContent({ contentId });
      setSecureContent(result.data);
    } catch (error) {
      console.error('Failed to load secure content:', error);
    } finally {
      setLoading(false);
    }
  };

  // Not logged in
  if (!member) {
    return (
      <div className="bg-gray-100 p-6 rounded-lg text-center">
        <h3 className="text-lg font-semibold mb-2">Member Access Required</h3>
        <p className="text-gray-600 mb-4">Please sign in to access this content.</p>
        <button
          onClick={() => showModal('LOGIN')}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
        >
          Sign In
        </button>
      </div>
    );
  }

  // Check plan access
  if (requiredPlans.length > 0 && !hasPlanAccess(requiredPlans)) {
    const requiredPlan = plans.find((plan: any) => requiredPlans.includes(plan.id));
    
    return (
      <div className="bg-yellow-100 border border-yellow-400 p-6 rounded-lg text-center">
        <h3 className="text-lg font-semibold mb-2">Upgrade Required</h3>
        <p className="text-gray-700 mb-4">
          This content requires the {requiredPlan?.name || 'Premium'} plan.
        </p>
        {showUpgrade && (
          <button
            onClick={() => window.location.href = '/plans'}
            className="bg-yellow-600 text-white px-6 py-2 rounded-md hover:bg-yellow-700"
          >
            Upgrade Now
          </button>
        )}
      </div>
    );
  }

  // Loading secure content
  if (contentId && loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Render content
  return (
    <div>
      {contentId && secureContent ? (
        <div dangerouslySetInnerHTML={{ __html: secureContent.content }} />
      ) : (
        children
      )}
    </div>
  );
};

// Higher-order component for protected routes
export const withProtectedRoute = <P extends object>(
  Component: React.ComponentType<P>,
  options: {
    requiredPlans?: string[];
    redirectTo?: string;
  } = {}
) => {
  const ProtectedComponent: React.FC<P> = (props) => {
    const { member } = useMemberstack();
    const { hasPlanAccess } = usePlans();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      // Wait for auth state to settle
      const timer = setTimeout(() => setLoading(false), 100);
      return () => clearTimeout(timer);
    }, []);

    if (loading) {
      return (
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!member) {
      if (options.redirectTo) {
        window.location.href = options.redirectTo;
        return null;
      }
      
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-4">Please sign in to access this page.</p>
            <button
              onClick={() => memberstack.showModal({ type: 'LOGIN' })}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              Sign In
            </button>
          </div>
        </div>
      );
    }

    if (options.requiredPlans && !hasPlanAccess(options.requiredPlans)) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Upgrade Required</h1>
            <p className="text-gray-600 mb-4">This page requires a premium subscription.</p>
            <button
              onClick={() => window.location.href = '/plans'}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              View Plans
            </button>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };

  return ProtectedComponent;
};

// Usage example
const PremiumDashboard = withProtectedRoute(
  ({ data }) => <div>Premium Dashboard Content</div>,
  { requiredPlans: ['premium-plan-id'] }
);
```

## 4. Member Profile Management

Complete profile system with image upload and custom fields.

```typescript
// components/MemberProfile.tsx
import React, { useState, useEffect } from 'react';
import { useMemberstack } from '../hooks/useMemberstack';

export const MemberProfile: React.FC = () => {
  const { member, updateProfile, isLoading } = useMemberstack();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    bio: '',
    company: '',
    website: ''
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (member?.customFields) {
      setFormData({
        firstName: member.customFields['first-name'] || '',
        lastName: member.customFields['last-name'] || '',
        phone: member.customFields.phone || '',
        bio: member.customFields.bio || '',
        company: member.customFields.company || '',
        website: member.customFields.website || ''
      });
      
      if (member.profileImage) {
        setImagePreview(member.profileImage);
      }
    }
  }, [member]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (message.text) setMessage({ type: '', text: '' });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    
    try {
      // Update custom fields
      const customFields = {
        'first-name': formData.firstName,
        'last-name': formData.lastName,
        phone: formData.phone,
        bio: formData.bio,
        company: formData.company,
        website: formData.website
      };
      
      await updateProfile(customFields);
      
      // Upload profile image if selected
      if (profileImage) {
        await memberstack.updateMemberProfileImage({ file: profileImage });
      }
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
      console.error('Profile update failed:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handlePasswordChange = () => {
    memberstack.showModal({ type: 'PASSWORD_RESET' });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Profile Settings</h2>

      {message.text && (
        <div className={`p-4 rounded-md mb-6 ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-400' 
            : 'bg-red-100 text-red-800 border border-red-400'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleProfileUpdate} className="space-y-6">
        {/* Profile Image */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover border"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500 text-2xl">
                  {formData.firstName?.[0] || member?.email?.[0] || '?'}
                </span>
              </div>
            )}
          </div>
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              id="profile-image"
            />
            <label
              htmlFor="profile-image"
              className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Change Photo
            </label>
          </div>
        </div>

        {/* Basic Information */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            value={member?.email || ''}
            readOnly
            className="w-full px-3 py-2 border rounded-md bg-gray-100 text-gray-600"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bio
          </label>
          <textarea
            value={formData.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Tell us about yourself..."
          />
        </div>

        {/* Company & Website */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company
            </label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => handleInputChange('company', e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://..."
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={updating}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {updating ? 'Updating...' : 'Save Changes'}
          </button>
          
          <button
            type="button"
            onClick={handlePasswordChange}
            className="border border-gray-300 px-6 py-2 rounded-md hover:bg-gray-50"
          >
            Change Password
          </button>
        </div>
      </form>
    </div>
  );
};
```

## 5. Next.js App Router Integration

Complete integration with Next.js 13+ App Router and server components.

```typescript
// app/layout.tsx
import { MemberstackProvider } from '../providers/MemberstackProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <MemberstackProvider>
          {children}
        </MemberstackProvider>
      </body>
    </html>
  );
}

// app/dashboard/layout.tsx
'use client';

import { withProtectedRoute } from '../../components/ProtectedContent';

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
};

export default withProtectedRoute(DashboardLayout);

// app/dashboard/premium/page.tsx
'use client';

import { withProtectedRoute } from '../../../components/ProtectedContent';

const PremiumPage = () => {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Premium Features</h2>
      <div className="bg-white p-6 rounded-lg shadow">
        <p>This content is only available to premium subscribers.</p>
      </div>
    </div>
  );
};

export default withProtectedRoute(PremiumPage, {
  requiredPlans: ['premium-plan-id']
});

// app/api/webhook/memberstack/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const signature = request.headers.get('x-memberstack-signature');
    
    // Verify webhook signature
    if (!verifyMemberstackSignature(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    
    // Handle different webhook events
    switch (body.type) {
      case 'member.created':
        await handleMemberCreated(body.data.member);
        break;
      case 'member.subscription.created':
        await handleSubscriptionCreated(body.data.member, body.data.subscription);
        break;
      case 'member.subscription.cancelled':
        await handleSubscriptionCancelled(body.data.member, body.data.subscription);
        break;
      default:
        console.log('Unhandled webhook event:', body.type);
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

function verifyMemberstackSignature(body: any, signature: string | null): boolean {
  // Implement signature verification using your webhook secret
  // This is a simplified example
  return signature === process.env.MEMBERSTACK_WEBHOOK_SECRET;
}

async function handleMemberCreated(member: any) {
  // Sync member data to your database
  console.log('New member created:', member.email);
}

async function handleSubscriptionCreated(member: any, subscription: any) {
  // Handle new subscription
  console.log('New subscription:', subscription.planId, 'for member:', member.email);
}

async function handleSubscriptionCancelled(member: any, subscription: any) {
  // Handle subscription cancellation
  console.log('Subscription cancelled:', subscription.planId, 'for member:', member.email);
}
```

## 6. Vue.js 3 + Pinia Integration

Complete Vue.js setup with Pinia state management.

```typescript
// stores/memberstack.ts
import { defineStore } from 'pinia';
import { MemberstackDom } from '@memberstack/dom';

const memberstack = MemberstackDom.init({
  publicKey: import.meta.env.VITE_MEMBERSTACK_KEY,
  useCookies: true,
  setCookieOnRootDomain: true
});

export const useMemberstackStore = defineStore('memberstack', {
  state: () => ({
    member: null as any,
    isLoading: true,
    error: null as string | null
  }),

  getters: {
    isLoggedIn: (state) => !!state.member,
    hasActivePlan: (state) => 
      state.member?.planConnections?.some((pc: any) => pc.status === 'ACTIVE') || false,
    currentPlan: (state) => {
      if (!state.member?.planConnections?.length) return null;
      const activePlan = state.member.planConnections.find(
        (pc: any) => pc.status === 'ACTIVE'
      );
      return activePlan || null;
    }
  },

  actions: {
    async initialize() {
      try {
        const currentMember = await memberstack.getCurrentMember();
        this.member = currentMember.data;
        this.error = null;
      } catch (error) {
        this.member = null;
        this.error = null; // Not logged in is not an error
      } finally {
        this.isLoading = false;
      }

      // Listen for auth changes
      memberstack.onAuthChange((member, error) => {
        if (error) {
          this.error = error.message;
          this.member = null;
        } else {
          this.member = member?.data || null;
          this.error = null;
        }
      });
    },

    async login(email: string, password: string) {
      this.isLoading = true;
      this.error = null;
      
      try {
        const result = await memberstack.loginMemberEmailPassword({ email, password });
        this.member = result.data.member;
        return result;
      } catch (error: any) {
        this.error = error.message;
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async signup(email: string, password: string, customFields = {}) {
      this.isLoading = true;
      this.error = null;
      
      try {
        const result = await memberstack.signupMemberEmailPassword({
          email,
          password,
          customFields
        });
        this.member = result.data.member;
        return result;
      } catch (error: any) {
        this.error = error.message;
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async logout() {
      try {
        await memberstack.logout();
        this.member = null;
        this.error = null;
      } catch (error: any) {
        this.error = error.message;
        throw error;
      }
    },

    showModal(type: string) {
      memberstack.showModal({ type });
    }
  }
});

// composables/useMemberstack.ts
import { useMemberstackStore } from '../stores/memberstack';
import { storeToRefs } from 'pinia';

export const useMemberstack = () => {
  const store = useMemberstackStore();
  const { member, isLoading, error, isLoggedIn, hasActivePlan, currentPlan } = storeToRefs(store);

  return {
    // State
    member,
    isLoading,
    error,
    isLoggedIn,
    hasActivePlan,
    currentPlan,

    // Actions
    initialize: store.initialize,
    login: store.login,
    signup: store.signup,
    logout: store.logout,
    showModal: store.showModal
  };
};

// components/AuthForm.vue
<template>
  <div class="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
    <h2 class="text-2xl font-bold mb-6 text-center">
      {{ mode === 'login' ? 'Sign In' : 'Create Account' }}
    </h2>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div v-if="mode === 'signup'" class="grid grid-cols-2 gap-4">
        <div>
          <input
            v-model="formData.firstName"
            type="text"
            placeholder="First Name"
            class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            :disabled="isLoading"
          />
        </div>
        <div>
          <input
            v-model="formData.lastName"
            type="text"
            placeholder="Last Name"
            class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            :disabled="isLoading"
          />
        </div>
      </div>

      <div>
        <input
          v-model="formData.email"
          type="email"
          placeholder="Email"
          class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          :disabled="isLoading"
          required
        />
      </div>

      <div>
        <input
          v-model="formData.password"
          type="password"
          placeholder="Password"
          class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          :disabled="isLoading"
          required
        />
      </div>

      <button
        type="submit"
        :disabled="isLoading"
        class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {{ isLoading ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Create Account') }}
      </button>
    </form>

    <div class="mt-4 text-center">
      <button
        @click="$emit('toggle-mode')"
        class="text-blue-600 hover:text-blue-800"
        :disabled="isLoading"
      >
        {{ mode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Sign in" }}
      </button>
    </div>

    <div v-if="error" class="mt-4 p-3 bg-red-100 border border-red-400 rounded text-red-700">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useMemberstack } from '../composables/useMemberstack';

interface Props {
  mode: 'login' | 'signup';
}

const props = defineProps<Props>();
const emit = defineEmits(['toggle-mode']);

const { login, signup, isLoading, error } = useMemberstack();

const formData = reactive({
  email: '',
  password: '',
  firstName: '',
  lastName: ''
});

const handleSubmit = async () => {
  try {
    if (props.mode === 'login') {
      await login(formData.email, formData.password);
    } else {
      await signup(formData.email, formData.password, {
        'first-name': formData.firstName,
        'last-name': formData.lastName
      });
    }
    // Success - router will handle navigation
  } catch (error) {
    // Error handled by store
    console.error(`${props.mode} failed:`, error);
  }
};
</script>
```

## Best Practices Summary

1. **State Management**: Use proper state management (React Context, Pinia, etc.)
2. **Error Handling**: Implement comprehensive error handling with user feedback
3. **Loading States**: Show loading indicators during async operations
4. **Type Safety**: Use TypeScript for better development experience
5. **Security**: Never expose sensitive data, validate all inputs
6. **User Experience**: Provide clear feedback and intuitive interfaces
7. **Testing**: Test all authentication flows and edge cases
8. **Performance**: Implement proper caching and optimization
9. **Accessibility**: Ensure components are accessible
10. **Documentation**: Document custom implementations for team members