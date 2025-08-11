# Memberstack DOM - Member Management

## AI Assistant Instructions
When implementing member management:
- Use `getCurrentMember()` to check authentication before operations
- Include `useCache: true` for frequent member data access
- Handle custom fields with proper validation
- Show authentication updates (email/password) separately from profile updates
- Include member JSON operations for advanced use cases

## Overview

Member management in Memberstack DOM includes retrieving current member data, updating profiles, managing authentication credentials, and handling custom member information.

## Getting Member Information

### getCurrentMember()
Retrieve the currently authenticated member's information.

**Method Signature:**
```typescript
await memberstack.getCurrentMember({
  useCache?: boolean;
}): Promise<GetCurrentMemberPayload>
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| useCache | boolean | ❌ | Use cached data (faster) vs fresh data from server |

**Response:**
```typescript
{
  data: {
    id: string;
    email: string;
    verified: boolean;
    loginRedirectUrl: string | null;
    customFields: Record<string, any>;
    profileImage: string | null;
    metaData: Record<string, any>;
    planConnections: Array<{
      id: string;
      planId: string;
      status: "ACTIVE" | "CANCELLED" | "PAST_DUE";
      createdAt: string;
      // ... additional plan connection properties
    }>;
  } | null; // null if no member is authenticated
}
```

**Examples:**

Check Current Member:
```javascript
async function getCurrentMember() {
  try {
    const result = await memberstack.getCurrentMember();
    
    if (result.data) {
      console.log('Member is logged in:', result.data.email);
      return result.data;
    } else {
      console.log('No member logged in');
      return null;
    }
  } catch (error) {
    console.error('Failed to get current member:', error);
    return null;
  }
}

// Usage
const member = await getCurrentMember();
if (member) {
  document.getElementById('welcome-message').textContent = 
    `Welcome back, ${member.customFields?.firstName || member.email}!`;
}
```

Using Cache for Performance:
```javascript
// Fast cached access (use for frequent checks)
const cachedMember = await memberstack.getCurrentMember({ useCache: true });

// Fresh data from server (use when you need up-to-date info)
const freshMember = await memberstack.getCurrentMember({ useCache: false });

// Practical usage pattern
async function getMemberWithFallback() {
  // Try cached first for speed
  let member = await memberstack.getCurrentMember({ useCache: true });
  
  // If no cached data, get fresh data
  if (!member.data) {
    member = await memberstack.getCurrentMember({ useCache: false });
  }
  
  return member.data;
}
```

Member Profile Component:
```javascript
async function loadMemberProfile() {
  const loadingEl = document.getElementById('profile-loading');
  const profileEl = document.getElementById('member-profile');
  
  try {
    loadingEl.style.display = 'block';
    
    const result = await memberstack.getCurrentMember();
    
    if (result.data) {
      displayMemberProfile(result.data);
    } else {
      // Redirect to login
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('Failed to load profile:', error);
    document.getElementById('profile-error').style.display = 'block';
  } finally {
    loadingEl.style.display = 'none';
  }
}

function displayMemberProfile(member) {
  const profileEl = document.getElementById('member-profile');
  
  profileEl.innerHTML = `
    <div class="profile-header">
      <img src="${member.profileImage || '/default-avatar.png'}" alt="Profile" class="profile-image">
      <div class="profile-info">
        <h2>${member.customFields?.firstName || 'Member'} ${member.customFields?.lastName || ''}</h2>
        <p class="email">${member.email}</p>
        ${!member.verified ? '<span class="unverified">Email not verified</span>' : ''}
      </div>
    </div>
    
    <div class="profile-details">
      <div class="field">
        <label>Member ID:</label>
        <span>${member.id}</span>
      </div>
      
      <div class="field">
        <label>Company:</label>
        <span>${member.customFields?.company || 'Not provided'}</span>
      </div>
      
      <div class="field">
        <label>Phone:</label>
        <span>${member.customFields?.phone || 'Not provided'}</span>
      </div>
      
      <div class="field">
        <label>Active Plans:</label>
        <span>${member.planConnections?.filter(pc => pc.status === 'ACTIVE').length || 0}</span>
      </div>
    </div>
  `;
  
  profileEl.style.display = 'block';
}
```

## Updating Member Information

### updateMember()
Update the current member's custom fields and profile information.

**Method Signature:**
```typescript
await memberstack.updateMember({
  customFields?: Record<string, any>;
}): Promise<UpdateMemberPayload>
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| customFields | object | ❌ | Custom fields to update |

**Response:**
```typescript
{
  data: {
    id: string;
    email: string;
    customFields: Record<string, any>;
    verified: boolean;
    profileImage: string | null;
    // ... other member properties
  }
}
```

**Examples:**

Basic Profile Update:
```javascript
async function updateProfile(formData) {
  try {
    const result = await memberstack.updateMember({
      customFields: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        company: formData.company,
        phone: formData.phone,
        bio: formData.bio,
        preferences: {
          newsletter: formData.newsletter,
          notifications: formData.notifications
        }
      }
    });
    
    console.log('Profile updated:', result.data);
    
    return {
      success: true,
      message: 'Profile updated successfully!',
      member: result.data
    };
  } catch (error) {
    console.error('Profile update failed:', error);
    
    return {
      success: false,
      message: 'Failed to update profile. Please try again.'
    };
  }
}

// Form handler
document.getElementById('profile-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const profileData = {
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    company: formData.get('company'),
    phone: formData.get('phone'),
    bio: formData.get('bio'),
    newsletter: formData.get('newsletter') === 'on',
    notifications: formData.get('notifications') === 'on'
  };
  
  const result = await updateProfile(profileData);
  
  if (result.success) {
    document.getElementById('success-message').textContent = result.message;
    document.getElementById('success-message').style.display = 'block';
  } else {
    document.getElementById('error-message').textContent = result.message;
    document.getElementById('error-message').style.display = 'block';
  }
});
```

Incremental Field Updates:
```javascript
async function updateSingleField(fieldName, value) {
  try {
    // Get current member to preserve existing fields
    const currentMember = await memberstack.getCurrentMember();
    
    if (!currentMember.data) {
      throw new Error('No member logged in');
    }
    
    const result = await memberstack.updateMember({
      customFields: {
        ...currentMember.data.customFields,
        [fieldName]: value,
        lastUpdated: new Date().toISOString()
      }
    });
    
    console.log(`Updated ${fieldName}:`, value);
    return result.data;
  } catch (error) {
    console.error(`Failed to update ${fieldName}:`, error);
    throw error;
  }
}

// Usage examples
await updateSingleField('company', 'New Company Name');
await updateSingleField('preferences', { theme: 'dark', language: 'en' });
```

Complex Profile Update with Validation:
```javascript
class ProfileManager {
  constructor() {
    this.memberstack = window.$memberstackDom;
  }
  
  async updateProfile(profileData) {
    // Validate data before sending
    const validation = this.validateProfileData(profileData);
    if (!validation.valid) {
      throw new Error(validation.message);
    }
    
    // Get current member to merge with updates
    const currentMember = await this.memberstack.getCurrentMember();
    if (!currentMember.data) {
      throw new Error('No member authenticated');
    }
    
    const updatedFields = {
      ...currentMember.data.customFields,
      ...profileData,
      lastProfileUpdate: new Date().toISOString()
    };
    
    try {
      const result = await this.memberstack.updateMember({
        customFields: updatedFields
      });
      
      // Trigger UI updates
      this.onProfileUpdated(result.data);
      
      return result.data;
    } catch (error) {
      console.error('Profile update failed:', error);
      throw new Error('Failed to update profile. Please try again.');
    }
  }
  
  validateProfileData(data) {
    if (data.email && !this.isValidEmail(data.email)) {
      return { valid: false, message: 'Invalid email format' };
    }
    
    if (data.phone && !this.isValidPhone(data.phone)) {
      return { valid: false, message: 'Invalid phone number format' };
    }
    
    if (data.firstName && data.firstName.length > 50) {
      return { valid: false, message: 'First name too long' };
    }
    
    return { valid: true };
  }
  
  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  
  isValidPhone(phone) {
    return /^\+?[\d\s\-\(\)]+$/.test(phone);
  }
  
  onProfileUpdated(member) {
    // Update UI elements
    document.querySelectorAll('[data-member-field]').forEach(el => {
      const field = el.dataset.memberField;
      const value = this.getNestedValue(member.customFields, field);
      if (value !== undefined) {
        el.textContent = value;
      }
    });
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('memberProfileUpdated', {
      detail: { member }
    }));
  }
  
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}

const profileManager = new ProfileManager();
```

### updateMemberProfileImage()
Update the member's profile image.

**Method Signature:**
```typescript
await memberstack.updateMemberProfileImage({
  profileImage: File;
}): Promise<UpdateMemberProfileImagePayload>
```

**Example:**
```javascript
async function updateProfileImage(imageFile) {
  try {
    // Validate file
    if (!imageFile || !imageFile.type.startsWith('image/')) {
      throw new Error('Please select a valid image file');
    }
    
    if (imageFile.size > 5 * 1024 * 1024) { // 5MB limit
      throw new Error('Image file too large. Maximum size is 5MB');
    }
    
    const result = await memberstack.updateMemberProfileImage({
      profileImage: imageFile
    });
    
    console.log('Profile image updated:', result.data.profileImage);
    
    // Update UI
    document.getElementById('profile-image').src = result.data.profileImage;
    
    return result.data.profileImage;
  } catch (error) {
    console.error('Profile image update failed:', error);
    throw error;
  }
}

// File input handler
document.getElementById('profile-image-input').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) {
    try {
      document.getElementById('image-loading').style.display = 'block';
      await updateProfileImage(file);
      document.getElementById('image-success').style.display = 'block';
    } catch (error) {
      document.getElementById('image-error').textContent = error.message;
      document.getElementById('image-error').style.display = 'block';
    } finally {
      document.getElementById('image-loading').style.display = 'none';
    }
  }
});
```

## Authentication Credential Updates

### updateMemberAuth()
Update member's email address and/or password. Requires current password for security.

**Method Signature:**
```typescript
await memberstack.updateMemberAuth({
  email?: string;
  oldPassword?: string;
  newPassword?: string;
}): Promise<UpdateMemberAuthPayload>
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| email | string | ❌ | New email address |
| oldPassword | string | ❌ | Current password (required for any changes) |
| newPassword | string | ❌ | New password |

**Examples:**

Change Password:
```javascript
async function changePassword(oldPassword, newPassword) {
  try {
    const result = await memberstack.updateMemberAuth({
      oldPassword,
      newPassword
    });
    
    console.log('Password changed successfully');
    
    return {
      success: true,
      message: 'Password updated successfully!'
    };
  } catch (error) {
    console.error('Password change failed:', error);
    
    const errorMessages = {
      'INVALID_PASSWORD': 'Current password is incorrect',
      'WEAK_NEW_PASSWORD': 'New password is too weak',
      'SAME_PASSWORD': 'New password must be different from current password'
    };
    
    return {
      success: false,
      message: errorMessages[error.code] || 'Failed to change password'
    };
  }
}

// Password change form
document.getElementById('password-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const oldPassword = formData.get('currentPassword');
  const newPassword = formData.get('newPassword');
  const confirmPassword = formData.get('confirmPassword');
  
  if (newPassword !== confirmPassword) {
    alert('New passwords do not match');
    return;
  }
  
  const result = await changePassword(oldPassword, newPassword);
  
  if (result.success) {
    alert(result.message);
    e.target.reset();
  } else {
    alert(result.message);
  }
});
```

Change Email Address:
```javascript
async function changeEmail(newEmail, currentPassword) {
  try {
    const result = await memberstack.updateMemberAuth({
      email: newEmail.trim().toLowerCase(),
      oldPassword: currentPassword
    });
    
    console.log('Email changed successfully:', result.data.email);
    
    return {
      success: true,
      message: 'Email updated successfully! Please verify your new email address.',
      newEmail: result.data.email
    };
  } catch (error) {
    console.error('Email change failed:', error);
    
    const errorMessages = {
      'INVALID_PASSWORD': 'Current password is incorrect',
      'EMAIL_ALREADY_EXISTS': 'This email address is already in use',
      'INVALID_EMAIL': 'Please enter a valid email address'
    };
    
    return {
      success: false,
      message: errorMessages[error.code] || 'Failed to change email'
    };
  }
}
```

## Advanced Member Data Management

### getMemberJSON()
Get member's JSON data store (key-value storage).

**Method Signature:**
```typescript
await memberstack.getMemberJSON(): Promise<GetMemberJSONPayload>
```

**Example:**
```javascript
async function getMemberData() {
  try {
    const result = await memberstack.getMemberJSON();
    console.log('Member JSON data:', result.data);
    return result.data;
  } catch (error) {
    console.error('Failed to get member JSON:', error);
    return {};
  }
}
```

### updateMemberJSON()
Update member's JSON data store.

**Method Signature:**
```typescript
await memberstack.updateMemberJSON({
  json: object;
}): Promise<GetMemberJSONPayload>
```

**Example:**
```javascript
async function saveMemberData(data) {
  try {
    const result = await memberstack.updateMemberJSON({
      json: {
        preferences: {
          theme: data.theme,
          language: data.language,
          notifications: data.notifications
        },
        appData: {
          lastLogin: new Date().toISOString(),
          loginCount: (data.loginCount || 0) + 1,
          features: data.enabledFeatures
        },
        metadata: {
          version: '1.0',
          updatedAt: new Date().toISOString()
        }
      }
    });
    
    console.log('Member JSON updated:', result.data);
    return result.data;
  } catch (error) {
    console.error('Failed to update member JSON:', error);
    throw error;
  }
}
```

### deleteMember()
Delete the current member's account permanently.

**Method Signature:**
```typescript
await memberstack.deleteMember(): Promise<DeleteMemberPayload>
```

**Example:**
```javascript
async function deleteAccount() {
  const confirmed = confirm(
    'Are you sure you want to delete your account? This action cannot be undone.'
  );
  
  if (!confirmed) return;
  
  const doubleConfirm = prompt(
    'Type "DELETE" to confirm account deletion:'
  );
  
  if (doubleConfirm !== 'DELETE') {
    alert('Account deletion cancelled');
    return;
  }
  
  try {
    await memberstack.deleteMember();
    
    alert('Your account has been successfully deleted.');
    window.location.href = '/';
  } catch (error) {
    console.error('Account deletion failed:', error);
    alert('Failed to delete account. Please contact support.');
  }
}

document.getElementById('delete-account-btn').addEventListener('click', deleteAccount);
```

## Complete Member Management Example

```javascript
class MemberProfileManager {
  constructor() {
    this.memberstack = window.$memberstackDom;
    this.currentMember = null;
    this.init();
  }
  
  async init() {
    try {
      await this.loadMemberProfile();
      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to initialize profile manager:', error);
    }
  }
  
  async loadMemberProfile() {
    try {
      const result = await this.memberstack.getCurrentMember();
      
      if (result.data) {
        this.currentMember = result.data;
        this.displayProfile(result.data);
      } else {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      this.showError('Failed to load profile data');
    }
  }
  
  setupEventListeners() {
    // Profile form
    document.getElementById('profile-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleProfileUpdate(e);
    });
    
    // Password form
    document.getElementById('password-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handlePasswordChange(e);
    });
    
    // Email form
    document.getElementById('email-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleEmailChange(e);
    });
    
    // Profile image
    document.getElementById('profile-image-input')?.addEventListener('change', (e) => {
      this.handleImageUpload(e);
    });
  }
  
  displayProfile(member) {
    // Populate form fields
    const fields = {
      'firstName': member.customFields?.firstName || '',
      'lastName': member.customFields?.lastName || '',
      'company': member.customFields?.company || '',
      'phone': member.customFields?.phone || '',
      'bio': member.customFields?.bio || '',
      'email-display': member.email
    };
    
    Object.entries(fields).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) {
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
          element.value = value;
        } else {
          element.textContent = value;
        }
      }
    });
    
    // Profile image
    const profileImg = document.getElementById('profile-image');
    if (profileImg) {
      profileImg.src = member.profileImage || '/default-avatar.png';
    }
    
    // Verification status
    const verificationStatus = document.getElementById('verification-status');
    if (verificationStatus) {
      verificationStatus.textContent = member.verified ? 'Verified' : 'Not Verified';
      verificationStatus.className = member.verified ? 'verified' : 'unverified';
    }
  }
  
  async handleProfileUpdate(event) {
    const formData = new FormData(event.target);
    const profileData = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      company: formData.get('company'),
      phone: formData.get('phone'),
      bio: formData.get('bio')
    };
    
    this.setFormLoading('profile-form', true);
    
    try {
      const result = await this.memberstack.updateMember({
        customFields: {
          ...this.currentMember.customFields,
          ...profileData,
          lastUpdated: new Date().toISOString()
        }
      });
      
      this.currentMember = result.data;
      this.showSuccess('Profile updated successfully!');
    } catch (error) {
      this.showError('Failed to update profile');
    } finally {
      this.setFormLoading('profile-form', false);
    }
  }
  
  async handlePasswordChange(event) {
    const formData = new FormData(event.target);
    const oldPassword = formData.get('currentPassword');
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');
    
    if (newPassword !== confirmPassword) {
      this.showError('New passwords do not match');
      return;
    }
    
    this.setFormLoading('password-form', true);
    
    try {
      await this.memberstack.updateMemberAuth({
        oldPassword,
        newPassword
      });
      
      this.showSuccess('Password updated successfully!');
      event.target.reset();
    } catch (error) {
      const message = error.code === 'INVALID_PASSWORD' 
        ? 'Current password is incorrect' 
        : 'Failed to change password';
      this.showError(message);
    } finally {
      this.setFormLoading('password-form', false);
    }
  }
  
  async handleEmailChange(event) {
    const formData = new FormData(event.target);
    const newEmail = formData.get('newEmail');
    const password = formData.get('password');
    
    this.setFormLoading('email-form', true);
    
    try {
      const result = await this.memberstack.updateMemberAuth({
        email: newEmail,
        oldPassword: password
      });
      
      this.currentMember = result.data;
      this.showSuccess('Email updated successfully! Please verify your new email.');
      this.displayProfile(result.data);
      event.target.reset();
    } catch (error) {
      const message = error.code === 'EMAIL_ALREADY_EXISTS'
        ? 'This email is already in use'
        : 'Failed to change email';
      this.showError(message);
    } finally {
      this.setFormLoading('email-form', false);
    }
  }
  
  async handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      const imageUrl = await this.memberstack.updateMemberProfileImage({
        profileImage: file
      });
      
      document.getElementById('profile-image').src = imageUrl.data.profileImage;
      this.showSuccess('Profile image updated!');
    } catch (error) {
      this.showError('Failed to update profile image');
    }
  }
  
  setFormLoading(formId, loading) {
    const form = document.getElementById(formId);
    const submitBtn = form?.querySelector('button[type="submit"]');
    
    if (submitBtn) {
      submitBtn.disabled = loading;
      submitBtn.textContent = loading ? 'Saving...' : 'Save Changes';
    }
  }
  
  showSuccess(message) {
    this.showMessage(message, 'success');
  }
  
  showError(message) {
    this.showMessage(message, 'error');
  }
  
  showMessage(message, type) {
    const messageEl = document.getElementById('message');
    if (messageEl) {
      messageEl.textContent = message;
      messageEl.className = `message ${type}`;
      messageEl.style.display = 'block';
      
      setTimeout(() => {
        messageEl.style.display = 'none';
      }, 5000);
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new MemberProfileManager();
});
```

## Next Steps

- **[04-plan-management.md](04-plan-management.md)** - Managing member subscriptions and plans
- **[06-member-journey.md](06-member-journey.md)** - Email verification and member lifecycle
- **[07-advanced-features.md](07-advanced-features.md)** - Advanced member features like teams
- **[08-types-reference.md](08-types-reference.md)** - TypeScript definitions for member objects