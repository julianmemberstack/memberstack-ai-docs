# Memberstack DOM - Authentication Methods

## AI Assistant Instructions
When implementing Memberstack authentication:
- Always include error handling with try/catch blocks
- Use `onAuthChange()` callback for reactive UI updates
- Include token/session management automatically (handled by SDK)
- Show both programmatic and modal-based authentication
- Reference specific error codes from 09-error-handling.md

## Overview

Memberstack DOM provides comprehensive authentication methods including email/password, passwordless login, social authentication, and pre-built UI modals.

## Email & Password Authentication

### loginMemberEmailPassword()
Authenticate a member using email and password credentials.

**Method Signature:**
```typescript
await memberstack.loginMemberEmailPassword({
  email: string;
  password: string;
}): Promise<LoginMemberEmailPasswordPayload>
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| email | string | ✅ | Member's email address |
| password | string | ✅ | Member's password |

**Response:**
```typescript
{
  data: {
    member: {
      id: string;
      email: string;
      verified: boolean;
      customFields: Record<string, any>;
      planConnections: Array<PlanConnection>;
      // ... additional member properties
    };
    tokens: {
      accessToken: string;
      expires: number; // Unix timestamp
    };
  }
}
```

**Examples:**

Basic Login:
```javascript
const memberstack = window.$memberstackDom;

async function loginUser(email, password) {
  try {
    const result = await memberstack.loginMemberEmailPassword({
      email,
      password
    });
    
    console.log('Login successful:', result.data.member);
    
    // Redirect to dashboard
    window.location.href = '/dashboard';
    
    return result.data.member;
  } catch (error) {
    console.error('Login failed:', error);
    throw new Error(`Login failed: ${error.message}`);
  }
}

// Usage
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const email = formData.get('email');
  const password = formData.get('password');
  
  try {
    await loginUser(email, password);
  } catch (error) {
    document.getElementById('error-message').textContent = error.message;
  }
});
```

With Advanced Error Handling:
```javascript
async function loginWithErrorHandling(email, password) {
  try {
    const result = await memberstack.loginMemberEmailPassword({
      email: email.trim().toLowerCase(),
      password
    });
    
    // Success - member is automatically set in global state
    return {
      success: true,
      member: result.data.member,
      message: 'Login successful!'
    };
    
  } catch (error) {
    console.error('Login error:', error);
    
    // Handle specific error cases
    switch (error.code) {
      case 'INVALID_CREDENTIALS':
        return {
          success: false,
          message: 'Invalid email or password. Please try again.'
        };
      case 'MEMBER_NOT_VERIFIED':
        return {
          success: false,
          message: 'Please verify your email address first.',
          showVerificationOption: true
        };
      case 'ACCOUNT_LOCKED':
        return {
          success: false,
          message: 'Account temporarily locked due to too many failed attempts.'
        };
      default:
        return {
          success: false,
          message: 'Login failed. Please try again later.'
        };
    }
  }
}
```

### signupMemberEmailPassword()
Create a new member account with email and password.

**Method Signature:**
```typescript
await memberstack.signupMemberEmailPassword({
  email: string;
  password: string;
  customFields?: Record<string, any>;
  plans?: Array<{ planId: string }>;
  captchaToken?: string;
  inviteToken?: string;
  metaData?: Record<string, any>;
}): Promise<SignupMemberEmailPasswordPayload>
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| email | string | ✅ | Member's email address |
| password | string | ✅ | Member's password |
| customFields | object | ❌ | Additional member data |
| plans | Array | ❌ | Free plans to assign |
| captchaToken | string | ❌ | hCaptcha token |
| inviteToken | string | ❌ | Team invitation token |
| metaData | object | ❌ | Internal metadata |

**Examples:**

Basic Signup:
```javascript
async function signupUser(formData) {
  try {
    const result = await memberstack.signupMemberEmailPassword({
      email: formData.email,
      password: formData.password
    });
    
    console.log('Signup successful:', result.data.member);
    
    // Show verification message if email verification is required
    if (!result.data.member.verified) {
      alert('Please check your email to verify your account.');
    }
    
    return result.data.member;
  } catch (error) {
    console.error('Signup failed:', error);
    throw error;
  }
}
```

Signup with Custom Fields:
```javascript
async function signupWithProfile(userData) {
  try {
    const result = await memberstack.signupMemberEmailPassword({
      email: userData.email,
      password: userData.password,
      customFields: {
        firstName: userData.firstName,
        lastName: userData.lastName,
        company: userData.company,
        phone: userData.phone,
        source: 'website_signup',
        signupDate: new Date().toISOString()
      }
    });
    
    // Member is automatically logged in after signup
    console.log('New member created:', result.data.member);
    
    return result;
  } catch (error) {
    // Handle signup-specific errors
    if (error.code === 'EMAIL_ALREADY_EXISTS') {
      throw new Error('An account with this email already exists. Try logging in instead.');
    } else if (error.code === 'WEAK_PASSWORD') {
      throw new Error('Password must be at least 8 characters with numbers and letters.');
    }
    throw error;
  }
}
```

Signup with Plan Assignment:
```javascript
async function signupWithFreePlan(userData, planId) {
  try {
    const result = await memberstack.signupMemberEmailPassword({
      email: userData.email,
      password: userData.password,
      customFields: userData.customFields,
      plans: [{ planId: planId }] // Assign free plan during signup
    });
    
    console.log('Member signed up with plan:', result.data.member.planConnections);
    
    return result;
  } catch (error) {
    if (error.code === 'PLAN_NOT_FREE') {
      throw new Error('Only free plans can be assigned during signup.');
    }
    throw error;
  }
}
```

### logout()
Log out the current member and clear authentication tokens.

**Method Signature:**
```typescript
await memberstack.logout(): Promise<LogoutMemberPayload>
```

**Examples:**

Basic Logout:
```javascript
async function logoutUser() {
  try {
    await memberstack.logout();
    console.log('Logout successful');
    
    // Redirect to home page
    window.location.href = '/';
  } catch (error) {
    console.error('Logout failed:', error);
    // Even if logout API fails, clear local state
    window.location.href = '/';
  }
}

// Logout button handler
document.getElementById('logout-btn').addEventListener('click', logoutUser);
```

With Confirmation:
```javascript
async function logoutWithConfirmation() {
  const confirmed = confirm('Are you sure you want to log out?');
  
  if (confirmed) {
    try {
      const result = await memberstack.logout();
      
      // Handle optional redirect from server
      if (result.data.redirect) {
        window.location.href = result.data.redirect;
      } else {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even on error
      window.location.href = '/login';
    }
  }
}
```

## Passwordless Authentication

### sendMemberLoginPasswordlessEmail()
Send a passwordless login email to a member.

**Method Signature:**
```typescript
await memberstack.sendMemberLoginPasswordlessEmail({
  email: string;
}): Promise<SendMemberLoginPasswordlessEmailPayload>
```

**Example:**
```javascript
async function sendPasswordlessLogin(email) {
  try {
    const result = await memberstack.sendMemberLoginPasswordlessEmail({
      email: email.trim().toLowerCase()
    });
    
    console.log('Passwordless email sent:', result.data);
    
    return {
      success: true,
      message: 'Check your email for a login link!'
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to send login email. Please try again.'
    };
  }
}
```

### loginMemberPasswordless()
Complete passwordless login using token from email.

**Method Signature:**
```typescript
await memberstack.loginMemberPasswordless({
  passwordlessToken: string;
  email: string;
}): Promise<LoginMemberEmailPasswordPayload>
```

**Example:**
```javascript
// Typically called from passwordless login page
async function handlePasswordlessLogin() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const email = urlParams.get('email');
  
  if (!token || !email) {
    alert('Invalid login link');
    window.location.href = '/login';
    return;
  }
  
  try {
    const result = await memberstack.loginMemberPasswordless({
      passwordlessToken: token,
      email: email
    });
    
    console.log('Passwordless login successful:', result.data.member);
    window.location.href = '/dashboard';
    
  } catch (error) {
    console.error('Passwordless login failed:', error);
    alert('Login link expired or invalid. Please try again.');
    window.location.href = '/login';
  }
}

// Run on page load
document.addEventListener('DOMContentLoaded', handlePasswordlessLogin);
```

## Social Authentication

### loginWithProvider()
Authenticate using social providers (Google, Facebook, etc.).

**Method Signature:**
```typescript
await memberstack.loginWithProvider({
  provider: string;
  allowSignup?: boolean;
}): Promise<void> // Opens popup, returns via callback
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| provider | string | ✅ | 'GOOGLE' or 'FACEBOOK' |
| allowSignup | boolean | ❌ | Allow new account creation |

**Example:**
```javascript
async function loginWithGoogle() {
  try {
    // This opens a popup window
    await memberstack.loginWithProvider({
      provider: 'GOOGLE',
      allowSignup: true // Allow new users to sign up
    });
    
    // Success is handled by onAuthChange callback
    console.log('Google login initiated');
  } catch (error) {
    console.error('Social login failed:', error);
    alert('Social login failed. Please try again.');
  }
}

// Social login buttons
document.getElementById('google-login').addEventListener('click', loginWithGoogle);

document.getElementById('facebook-login').addEventListener('click', async () => {
  try {
    await memberstack.loginWithProvider({
      provider: 'FACEBOOK',
      allowSignup: false // Only allow existing users
    });
  } catch (error) {
    console.error('Facebook login failed:', error);
  }
});
```

### signupWithProvider()
Create new account using social providers.

**Method Signature:**
```typescript
await memberstack.signupWithProvider({
  provider: string;
  customFields?: Record<string, any>;
  plans?: Array<{ planId: string }>;
  allowLogin?: boolean;
}): Promise<void>
```

**Example:**
```javascript
async function signupWithGoogle(customFields = {}) {
  try {
    await memberstack.signupWithProvider({
      provider: 'GOOGLE',
      allowLogin: true, // Allow login if account exists
      customFields: {
        source: 'google_signup',
        ...customFields
      }
    });
    
    console.log('Google signup initiated');
  } catch (error) {
    console.error('Google signup failed:', error);
  }
}
```

## Authentication State Management

### onAuthChange()
Listen for authentication state changes (login, logout, data updates).

**Method Signature:**
```typescript
memberstack.onAuthChange(({ member }) => void): void
```

**Examples:**

Basic Auth State Listener:
```javascript
memberstack.onAuthChange(({ member }) => {
  if (member) {
    console.log('User logged in:', member.email);
    
    // Update UI for authenticated state
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('member-section').style.display = 'block';
    document.getElementById('member-email').textContent = member.email;
    
    // Show member-specific content
    updateMemberUI(member);
  } else {
    console.log('User logged out');
    
    // Update UI for unauthenticated state  
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('member-section').style.display = 'none';
    
    // Clear sensitive data
    clearMemberUI();
  }
});
```

Advanced Auth Handler:
```javascript
memberstack.onAuthChange(({ member }) => {
  updateAuthenticationUI(member);
  updateNavigationMenu(member);
  handleRouteAccess(member);
  updatePlanAccessUI(member);
});

function updateAuthenticationUI(member) {
  const elements = {
    loginBtn: document.getElementById('login-btn'),
    signupBtn: document.getElementById('signup-btn'), 
    logoutBtn: document.getElementById('logout-btn'),
    profileBtn: document.getElementById('profile-btn'),
    memberName: document.getElementById('member-name')
  };
  
  if (member) {
    // Show authenticated UI
    elements.loginBtn?.classList.add('hidden');
    elements.signupBtn?.classList.add('hidden');
    elements.logoutBtn?.classList.remove('hidden');
    elements.profileBtn?.classList.remove('hidden');
    
    if (elements.memberName) {
      elements.memberName.textContent = member.customFields?.firstName || member.email;
    }
  } else {
    // Show unauthenticated UI
    elements.loginBtn?.classList.remove('hidden');
    elements.signupBtn?.classList.remove('hidden');
    elements.logoutBtn?.classList.add('hidden');
    elements.profileBtn?.classList.add('hidden');
  }
}

function handleRouteAccess(member) {
  const currentPath = window.location.pathname;
  const protectedRoutes = ['/dashboard', '/profile', '/billing', '/admin'];
  const authRoutes = ['/login', '/signup'];
  
  // Redirect unauthenticated users from protected routes
  if (!member && protectedRoutes.some(route => currentPath.startsWith(route))) {
    window.location.href = '/login?redirect=' + encodeURIComponent(currentPath);
  }
  
  // Redirect authenticated users away from auth routes
  if (member && authRoutes.includes(currentPath)) {
    const redirectUrl = new URLSearchParams(window.location.search).get('redirect');
    window.location.href = redirectUrl || '/dashboard';
  }
}

function updatePlanAccessUI(member) {
  const premiumElements = document.querySelectorAll('[data-plan-required]');
  
  premiumElements.forEach(element => {
    const requiredPlan = element.dataset.planRequired;
    const hasAccess = member?.planConnections?.some(pc => 
      pc.planId === requiredPlan && pc.status === 'ACTIVE'
    );
    
    if (hasAccess) {
      element.classList.remove('plan-locked');
    } else {
      element.classList.add('plan-locked');
    }
  });
}
```

## Complete Authentication Flow Example

```javascript
class MemberstackAuth {
  constructor() {
    this.memberstack = window.$memberstackDom;
    this.currentMember = null;
    this.setupAuthListener();
    this.setupEventListeners();
  }
  
  setupAuthListener() {
    this.memberstack.onAuthChange(({ member }) => {
      this.currentMember = member;
      this.handleAuthStateChange(member);
    });
  }
  
  setupEventListeners() {
    // Login form
    document.getElementById('login-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleLogin(e);
    });
    
    // Signup form
    document.getElementById('signup-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSignup(e);
    });
    
    // Logout button
    document.getElementById('logout-btn')?.addEventListener('click', () => {
      this.handleLogout();
    });
    
    // Social login buttons
    document.getElementById('google-login')?.addEventListener('click', () => {
      this.handleSocialLogin('GOOGLE');
    });
  }
  
  async handleLogin(event) {
    const formData = new FormData(event.target);
    const email = formData.get('email');
    const password = formData.get('password');
    
    this.setLoading('login-form', true);
    this.clearErrors();
    
    try {
      await this.memberstack.loginMemberEmailPassword({ email, password });
      // Auth state change will handle UI updates
    } catch (error) {
      this.showError('login-error', this.getErrorMessage(error));
    } finally {
      this.setLoading('login-form', false);
    }
  }
  
  async handleSignup(event) {
    const formData = new FormData(event.target);
    const userData = {
      email: formData.get('email'),
      password: formData.get('password'),
      customFields: {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName')
      }
    };
    
    this.setLoading('signup-form', true);
    this.clearErrors();
    
    try {
      await this.memberstack.signupMemberEmailPassword(userData);
      // Show verification message if needed
    } catch (error) {
      this.showError('signup-error', this.getErrorMessage(error));
    } finally {
      this.setLoading('signup-form', false);
    }
  }
  
  async handleLogout() {
    try {
      await this.memberstack.logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout locally
      window.location.href = '/';
    }
  }
  
  async handleSocialLogin(provider) {
    try {
      await this.memberstack.loginWithProvider({
        provider,
        allowSignup: true
      });
    } catch (error) {
      this.showError('social-error', 'Social login failed. Please try again.');
    }
  }
  
  handleAuthStateChange(member) {
    this.updateUI(member);
    this.handleRedirects(member);
  }
  
  updateUI(member) {
    // Update authentication UI elements
    document.querySelectorAll('[data-auth="logged-out"]').forEach(el => {
      el.style.display = member ? 'none' : 'block';
    });
    
    document.querySelectorAll('[data-auth="logged-in"]').forEach(el => {
      el.style.display = member ? 'block' : 'none';
    });
    
    // Update member-specific content
    if (member) {
      document.querySelectorAll('[data-member="email"]').forEach(el => {
        el.textContent = member.email;
      });
      
      document.querySelectorAll('[data-member="name"]').forEach(el => {
        el.textContent = member.customFields?.firstName || member.email.split('@')[0];
      });
    }
  }
  
  handleRedirects(member) {
    const currentPath = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    
    if (member && ['/login', '/signup'].includes(currentPath)) {
      // Redirect authenticated users away from auth pages
      const redirect = urlParams.get('redirect') || '/dashboard';
      window.location.href = redirect;
    } else if (!member && this.isProtectedRoute(currentPath)) {
      // Redirect unauthenticated users to login
      window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
    }
  }
  
  isProtectedRoute(path) {
    const protectedRoutes = ['/dashboard', '/profile', '/billing', '/settings'];
    return protectedRoutes.some(route => path.startsWith(route));
  }
  
  getErrorMessage(error) {
    const errorMessages = {
      'INVALID_CREDENTIALS': 'Invalid email or password',
      'EMAIL_ALREADY_EXISTS': 'An account with this email already exists',
      'WEAK_PASSWORD': 'Password must be stronger',
      'MEMBER_NOT_VERIFIED': 'Please verify your email address'
    };
    
    return errorMessages[error.code] || error.message || 'An error occurred';
  }
  
  setLoading(formId, loading) {
    const form = document.getElementById(formId);
    const submitBtn = form?.querySelector('button[type="submit"]');
    
    if (submitBtn) {
      submitBtn.disabled = loading;
      submitBtn.textContent = loading ? 'Loading...' : submitBtn.dataset.originalText || 'Submit';
      
      if (!submitBtn.dataset.originalText) {
        submitBtn.dataset.originalText = submitBtn.textContent;
      }
    }
  }
  
  showError(errorId, message) {
    const errorEl = document.getElementById(errorId);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    }
  }
  
  clearErrors() {
    document.querySelectorAll('.error-message').forEach(el => {
      el.style.display = 'none';
    });
  }
}

// Initialize authentication handling
document.addEventListener('DOMContentLoaded', () => {
  new MemberstackAuth();
});
```

## Next Steps

- **[03-member-management.md](03-member-management.md)** - Managing member data after authentication
- **[05-ui-components.md](05-ui-components.md)** - Using pre-built authentication modals
- **[06-member-journey.md](06-member-journey.md)** - Email verification and password reset flows
- **[09-error-handling.md](09-error-handling.md)** - Complete authentication error reference