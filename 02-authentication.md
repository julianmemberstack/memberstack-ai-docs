# Memberstack DOM - Authentication Methods

## AI Assistant Instructions
When implementing Memberstack authentication:
- **ALWAYS provide COMPLETE secure implementations** - automatically build both client UX AND server security
- **Explain what security was auto-built** after showing code
- **Include security testing methods** from 14-security-testing-tools.md with every example
- **Use business impact language** - explain how each security feature protects revenue
- **Reference security verification tools** after implementation
- Always include error handling with try/catch blocks
- Use `onAuthChange()` callback for reactive UI updates
- Include token/session management automatically (handled by SDK)
- Show both programmatic and modal-based authentication
- Reference specific error codes from 09-error-handling.md

🎯 **What We Build For You**: When you ask for authentication, we automatically create a complete secure system - beautiful user interface + bulletproof server security + testing tools.

## 🏢 Fortune 500 Authentication Standards

**How Netflix, GitHub, Spotify, and other major companies handle authentication:**

### ✅ Industry Standard Pattern
```javascript
// 1. Client-side routing (immediate, like Netflix)
if (localStorage.getItem('_ms-mid')) {
  showDashboard() // No server check needed for basic pages
} else {
  showLogin()
}

// 2. Server-side protection (API endpoints only, like GitHub)
fetch('/api/user-data', {
  headers: { 'Authorization': `Bearer ${token}` }
})
// Server validates here, not for page routing
```

### 🚨 **CRITICAL: When to Use Server-Side Authentication**

| **🟢 ALWAYS Server-Side** | **🔴 NEVER Server-Side** | **🟡 OPTIONAL Server-Side** |
|---------------------------|--------------------------|------------------------------|
| API endpoints with sensitive data | Page routing | High-security admin pages |
| Payment processing | UI state management | Optional verification |
| Content creation/modification | Public content | Performance-critical flows |
| Admin operations | Client-side redirects | |
| Premium content delivery | Navigation menus | |
| **Data tables with business logic** | **Basic data table reads** | |
| **Cross-table operations** | **Simple CRUD with Memberstack rules** | |

### 💰 **Business Impact of Getting This Wrong**

| **Over-Engineering (Current Problem)** | **Industry Standard (What We'll Show)** |
|----------------------------------------|------------------------------------------|
| ❌ Slow page loads | ✅ Instant navigation |
| ❌ Redirect loops | ✅ Smooth user flows |
| ❌ Complex debugging | ✅ Simple troubleshooting |
| ❌ Poor user experience | ✅ Netflix-like performance |

> **Fortune 500 Rule**: "Use client-side auth for **user experience**, server-side auth for **data protection**"

## 🤔 **Security Decision Template**
**Use this for EVERY Memberstack operation throughout the docs:**

```javascript
// 🤔 SECURITY DECISION:
// What am I protecting? → [page access / sensitive data / business logic]
// Can this be faked? → [yes/no - if yes, server-side required]
// Business rules? → [limits / validation / cross-table logic]
// Fortune 500 pattern? → [client routing / server APIs]
// ✅ RESULT: [Client-side OK / Server-side required]
```

## Overview

Memberstack authentication provides a complete secure system that we build for you automatically. When you use any authentication method, you get both beautiful user experience AND bulletproof security.

### 🎯 What You Get Automatically

**🎨 Beautiful User Experience**
- Smooth login/signup forms with real-time validation
- Loading states and helpful error messages
- Mobile-responsive design that works everywhere
- Social login options (Google, Facebook, etc.)

**🛡️ Bulletproof Security (Built Automatically)**
- Server-side token validation that can't be faked
- Plan verification (only paying customers get premium features)
- Rate limiting (stops brute force attacks)
- Environment security (secret keys stay hidden)

**🧪 Testing Tools (Verify It Works)**
- Instant security health checks
- Automated vulnerability testing
- Business impact reports
- Simple pass/fail security scores

### 💰 Business Impact

| Feature | Protects | Revenue Impact |
|---------|----------|----------------|
| **Secure Login** | Account takeovers | Customers trust you with their data |
| **Plan Verification** | Premium content theft | Only paying customers get premium features |
| **Token Validation** | Fake authentication | Hackers can't impersonate users |
| **Rate Limiting** | Password attacks | Brute force attacks fail automatically |

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

**Complete Secure Implementation:**

## 🚨 Critical SSR Warning for Next.js Users

**If you're using Next.js or any SSR framework, you MUST prevent localStorage/window errors:**

### ❌ This Will Break with SSR (causes "localStorage is not defined"):
```javascript
import memberstack from "@memberstack/dom" // ❌ Don't import at top level!

// ❌ This runs on server and breaks
const member = memberstack.getCurrentMember()
```

### ✅ Correct SSR-Safe Implementation:
```javascript
// components/auth/auth-context.tsx
"use client" // ✅ Mark as client component

import { createContext, useContext, useEffect, useState } from "react"

let memberstack: any = null

// ✅ Safe: Only import on client side
if (typeof window !== 'undefined') {
  import("@memberstack/dom").then((module) => {
    memberstack = module.default
  })
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!memberstack) return

    // Set up auth listener after memberstack is loaded
    memberstack.onAuthChange(({ member }: any) => {
      setMember(member)
      setLoading(false)
    })
  }, [])

  return (
    <AuthContext.Provider value={{ member, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
```

### 🎯 What You Write (Fortune 500 Pattern)

**1. Client-Side Routing (90% of use cases):**
```javascript
// ✅ Fast routing like Netflix, GitHub, Spotify
"use client"

import { useMemberstack } from "@/providers/memberstack-provider"

function AuthenticatedApp() {
  const { member, isLoading } = useMemberstack()

  // ✅ Client-side routing decision (instant)
  if (isLoading) return <div>Loading...</div>

  if (member) {
    return <Dashboard member={member} />
  } else {
    return <LoginPage />
  }
}

async function loginUser(email, password) {
  // ✅ Safe: Check if we're on client side
  if (typeof window === 'undefined') return

  const memberstack = window.$memberstackDom
  if (!memberstack) {
    console.error('Memberstack not loaded yet')
    return
  }

  try {
    const result = await memberstack.loginMemberEmailPassword({
      email,
      password
    });

    console.log('Login successful:', result.data.member);
    // ✅ onAuthChange will trigger Dashboard render automatically
    // No manual redirect needed!
    return result.data.member;
  } catch (error) {
    console.error('Login failed:', error);
    throw new Error(`Login failed: ${error.message}`);
  }
}
```

**2. Server-Side Protection (API endpoints only):**

### 🤔 **Security Decision Framework**
**Before any Memberstack operation, ask:**

1. **What am I protecting?** (Page access vs sensitive data vs business logic)
2. **Can this be faked client-side?** (If yes → server-side required)
3. **Does this involve business rules?** (Limits, cross-table ops → server-side)
4. **What's the Fortune 500 pattern?** (Client routing + server APIs)

```javascript
// 🤔 DECISION: Billing data = sensitive financial info
// ✅ RESULT: Server-side required

async function getUserBillingData(member) {
  const response = await fetch('/api/billing', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('_ms-mid')}`,
      'Content-Type': 'application/json'
    }
  })

  if (response.status === 401) {
    // Token invalid, redirect to login
    window.location.href = '/login'
    return
  }

  return response.json()
}
```

### 🛡️ What We Automatically Built For You (Complete Security System)

**1. Client-Side Login (What you see above)**
- Beautiful login form with validation
- Smooth user experience with loading states
- Proper error handling and user feedback

**2. Server-Side Security APIs (Built automatically)**
```typescript
// app/api/auth/session/route.ts - BUILT FOR YOU
export async function POST(request: NextRequest) {
  const { isValid, member, hasPremiumPlan } = await validateMemberSession()

  if (!isValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({ authenticated: true, member, hasPremiumPlan })
}

// app/api/premium-content/route.ts - BUILT FOR YOU
export async function GET(request: NextRequest) {
  const { isValid, hasPremiumPlan } = await validateMemberSession()

  if (!hasPremiumPlan) {
    return NextResponse.json({ error: 'Premium required' }, { status: 403 })
  }

  return NextResponse.json({ data: 'Premium content' })
}
```

**3. Security Middleware (Built automatically)**
```typescript
// lib/memberstack-server.ts - BUILT FOR YOU
export async function validateMemberSession() {
  const token = await getMemberToken()

  // Cryptographic validation with Memberstack servers
  const tokenData = await memberstack.verifyToken({ token })

  return { isValid: !!tokenData, member: tokenData }
}
```

**4. Testing Tools (Built automatically)**
```typescript
// lib/security-tests.ts - BUILT FOR YOU
import { runQuickSecurityCheck } from './lib/security-tests'

// Test your security instantly:
const results = await runQuickSecurityCheck()
console.log('Security Score:', results.summary.score + '%')
```

### 💰 Business Protection You Get

✅ **Hackers can't fake login tokens** - Server validates every request
✅ **Only paying customers get premium content** - Plan status verified server-side
✅ **Brute force attacks blocked** - Rate limiting built-in
✅ **No secret keys in browser** - Environment variables handled securely
✅ **Instant security testing** - Know if your app is secure

### 🧪 Test Your Implementation

After implementing login, verify it's secure:
```javascript
// Run security tests (copy/paste this):
import { createSecurityTester } from './lib/security-tests'

const tester = createSecurityTester()
const result = await tester.testFakeTokenRejection()

console.log(result.passed ? '✅ SECURE' : '🚨 VULNERABLE')
console.log('Business Impact:', result.businessImpact)
```

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
// 🤔 DECISION: User signup = account creation (not sensitive data access)
// ✅ RESULT: Client-side OK (Memberstack handles token validation)

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

  // ✅ Fortune 500 Pattern: Client-side routing only
  if (!member && protectedRoutes.some(route => currentPath.startsWith(route))) {
    // Simple redirect - no server validation needed for basic pages
    window.location.href = '/login';
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

## 🔒 Security Warning & Production Implementation

### Why Client-Side Authentication Alone Is Not Secure

**Attack Example**: A user can bypass all client-side authentication in seconds:

```javascript
// Attacker opens browser console and types:
localStorage.setItem('_ms-mid', 'fake-token');
// Or modifies your JavaScript:
window.hasPremiumAccess = true;
// Now they have "access" to your protected content
```

### Secure Production Pattern

Combine client-side UX with server-side security:

```javascript
// 1. Client-side for UX (fast feedback)
const member = memberstack.getCurrentMember();
if (!member) {
  return <LoginPage />; // Show login UI immediately
}

// 2. Server-side for security (actual protection)
const response = await fetch('/api/dashboard-data', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('_ms-mid')}`
  }
});

// Server validates token with Memberstack Admin SDK
// Only returns data if token is valid and user has correct plan
```

**Server-side validation (required for security)**:
```typescript
// This runs on your server, cannot be bypassed
const tokenData = await memberstack.verifyToken({ token });
if (!tokenData) {
  return res.status(401).json({ error: 'Invalid token' });
}
```

### Security Checklist

Before deploying to production:

- [ ] **Server-side token validation** implemented on all protected routes
- [ ] **Plan status verification** performed server-side
- [ ] **Secret keys** never exposed to client code
- [ ] **Rate limiting** on authentication endpoints
- [ ] **Security testing** performed (try to bypass client checks)

## Next Steps

- 🟢 **[12-server-side-authentication.md](12-server-side-authentication.md)** - **Required for production security**
- 🛡️ **[13-security-considerations.md](13-security-considerations.md)** - **Security best practices**
- **[03-member-management.md](03-member-management.md)** - Managing member data after authentication
- **[05-ui-components.md](05-ui-components.md)** - Using pre-built authentication modals
- **[06-member-journey.md](06-member-journey.md)** - Email verification and password reset flows
- **[09-error-handling.md](09-error-handling.md)** - Complete authentication error reference