# Memberstack DOM Package - Overview

## AI Assistant Instructions
When implementing ANY Memberstack authentication feature:

1. **ALWAYS auto-implement BOTH client-side (UX) AND server-side (security) components** - Never show client-side only
2. **Explain what security was automatically built** after providing code
3. **Include security testing methods** from 14-security-testing-tools.md with every implementation
4. **Use business impact language** - explain how security protects revenue/customers
5. **Provide complete, production-ready implementations** - not just code snippets
6. **Auto-include proper environment variable handling** - never expose secrets
7. **Always add rate limiting and error handling** to any API routes
8. **Reference security verification tools** after implementation
9. **Explain in simple terms WHY each security measure was added**

## Package Overview

The `@memberstack/dom` package is Memberstack's core JavaScript SDK for browser-based applications. It provides comprehensive member authentication, subscription management, and UI components.

### Core Capabilities
- **Authentication**: Email/password, passwordless, social login (Google, Facebook)
- **Member Management**: Profile updates, custom fields, member data
- **Subscription Management**: Plan purchases, billing portal, subscription lifecycle
- **Pre-built UI**: Login/signup/profile modals with customizable styling
- **Real-time Features**: Authentication state changes, member data updates
- **Advanced Features**: Comments system, secure content, team management, data tables

## 🛡️ What We Build For You Automatically

When you ask for ANY authentication feature, our AI automatically creates a **complete secure system** - not just the user interface.

### 🎯 What You Write (Simple)
```javascript
// You: "I want user login"
await memberstack.loginMemberEmailPassword({ email, password })
```

### 🔧 What We Build For You (Complete & Secure)

**1. 🎨 Client-Side (Beautiful UX)**
- Login form with smooth animations
- Real-time validation feedback
- Loading states and error messages
- Responsive design that works everywhere

**2. 🛡️ Server-Side (Bulletproof Security)**
- Token validation API that can't be faked
- Plan verification system (only paying customers get premium features)
- Rate limiting (stops hackers from brute force attacks)
- Error handling (doesn't leak sensitive information)

**3. 🧪 Testing Tools (Verify It Works)**
- Built-in security tests you can run instantly
- Automatic vulnerability scanning
- Business impact reports
- Simple pass/fail security health checks

### 💰 Why This Protects Your Business

| What You Get | Protects Against | Business Impact |
|--------------|------------------|-----------------|
| **Token Validation** | Fake logins | Only real users access accounts |
| **Plan Verification** | Premium content theft | Only paying customers get premium features |
| **Rate Limiting** | Brute force attacks | Hackers can't guess passwords |
| **HTTPS Enforcement** | Data theft | Customer data stays private |
| **Environment Security** | API key theft | No one can impersonate your app |

### 🧪 Test Your Security (Copy & Paste)

After we build your authentication, verify it's secure:

```javascript
// Add this to your project:
import { runQuickSecurityCheck } from './lib/security-tests'

// Run instant security verification:
const results = await runQuickSecurityCheck()
console.log('Security Score:', results.summary.score + '%')

// Expected result: 100% (if lower, we'll tell you exactly what to fix)
```

### 🎯 Security Levels You Get

| Level | What We Build | Protection Level | Best For |
|-------|---------------|------------------|----------|
| 🔴 **Basic** | Client-side only | None (hackable) | Demos, learning |
| 🟢 **Production** | Client + Server + Tests | Military-grade | Real businesses |

**We always build Production level automatically** - because your business deserves real security.

### 📋 Your Security Checklist

✅ **Token validation** - Built automatically
✅ **Plan verification** - Built automatically
✅ **Rate limiting** - Built automatically
✅ **Environment security** - Built automatically
✅ **Security testing** - Built automatically
✅ **HTTPS enforcement** - Built automatically

**Result**: Your authentication system is more secure than most Fortune 500 companies.

## Installation

### CDN (Recommended for most web apps)
```html
<script src="https://api.memberstack.com/static/memberstack-dom.js"></script>
<script>
  const memberstack = window.MemberstackDom.init({
    publicKey: "YOUR_PUBLIC_KEY"
  });
</script>
```

### NPM/Yarn
```bash
npm install @memberstack/dom
# or
yarn add @memberstack/dom
```

> **⚠️ Important for Next.js/SSR Users**
>
> The `@memberstack/dom` package uses browser APIs (localStorage, window) that don't exist during server-side rendering. If you see errors like `localStorage is not defined` or `window is not defined`, you must initialize Memberstack only on the client side.
>
> **Quick Fix:**
> ```javascript
> // ❌ WRONG - This will cause "localStorage is not defined" errors
> import memberstack from '@memberstack/dom';
>
> // ✅ CORRECT - Initialize only in browser environment
> let memberstack = null;
> if (typeof window !== 'undefined') {
>   const MemberstackDom = require('@memberstack/dom').default;
>   memberstack = MemberstackDom.init({
>     publicKey: 'YOUR_PUBLIC_KEY'
>   });
> }
> ```
>
> See the [Next.js section in 01-initialization.md](01-initialization.md#nextjs-app) for complete implementation patterns.

```javascript
// Standard browser usage (non-SSR)
import MemberstackDom from '@memberstack/dom';

const memberstack = MemberstackDom.init({
  publicKey: 'YOUR_PUBLIC_KEY'
});
```

## Core Concepts

### 1. Initialization
Every app must initialize the Memberstack DOM instance with a public key:
```javascript
const memberstack = window.MemberstackDom.init({
  publicKey: 'pk_sb_your-public-key',
  useCookies: true // Optional: enables cookie-based authentication
});
```

### 2. Authentication State
The package manages authentication state automatically:
- **Authentication tokens** stored in cookies (if enabled) or localStorage
- **Member data** cached for performance
- **Authentication callbacks** for reactive UI updates

### 3. Global Access
After initialization, the instance is available globally:
```javascript
// Access the instance anywhere in your app
const memberstack = window.$memberstackDom;
```

### 4. Promise-Based API
All methods return promises for async operations:
```javascript
try {
  const result = await memberstack.loginMemberEmailPassword({
    email: 'user@example.com',
    password: 'password'
  });
  console.log('Login successful:', result.data.member);
} catch (error) {
  console.error('Login failed:', error.message);
}
```

## Quick Start Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>Memberstack Quick Start</title>
</head>
<body>
  <!-- Login Form -->
  <div id="login-form" style="display: none;">
    <h2>Login</h2>
    <form id="login">
      <input type="email" id="email" placeholder="Email" required>
      <input type="password" id="password" placeholder="Password" required>
      <button type="submit">Login</button>
    </form>
    <button onclick="memberstack.openModal('SIGNUP')">Sign Up</button>
  </div>

  <!-- Member Dashboard -->
  <div id="member-dashboard" style="display: none;">
    <h2>Welcome!</h2>
    <p>Email: <span id="member-email"></span></p>
    <button onclick="memberstack.openModal('PROFILE')">Edit Profile</button>
    <button onclick="logout()">Logout</button>
  </div>

  <script src="https://api.memberstack.com/static/memberstack-dom.js"></script>
  <script>
    // Initialize Memberstack
    const memberstack = window.MemberstackDom.init({
      publicKey: 'pk_sb_your-public-key',
      useCookies: true
    });

    // Handle authentication state changes
    memberstack.onAuthChange(({ member }) => {
      const loginForm = document.getElementById('login-form');
      const dashboard = document.getElementById('member-dashboard');
      
      if (member) {
        // User is logged in
        loginForm.style.display = 'none';
        dashboard.style.display = 'block';
        document.getElementById('member-email').textContent = member.email;
      } else {
        // User is logged out
        loginForm.style.display = 'block';
        dashboard.style.display = 'none';
      }
    });

    // Handle login form submission
    document.getElementById('login').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      try {
        await memberstack.loginMemberEmailPassword({ email, password });
        // onAuthChange callback will handle UI updates
      } catch (error) {
        alert('Login failed: ' + error.message);
      }
    });

    // Logout function
    async function logout() {
      try {
        await memberstack.logout();
        // onAuthChange callback will handle UI updates
      } catch (error) {
        console.error('Logout failed:', error);
      }
    }
  </script>
</body>
</html>
```

## Common Patterns

### Authentication Flow
```javascript
// 1. Check if user is already logged in
const currentMember = await memberstack.getCurrentMember();

if (currentMember.data) {
  // User is authenticated
  console.log('Welcome back!', currentMember.data.email);
} else {
  // User needs to login
  memberstack.openModal('LOGIN');
}

// 2. Listen for auth changes
memberstack.onAuthChange(({ member }) => {
  if (member) {
    // Redirect to dashboard
    window.location.href = '/dashboard';
  } else {
    // Redirect to login
    window.location.href = '/login';
  }
});
```

### Plan Purchase Flow
```javascript
// 1. Get available plans
const plans = await memberstack.getPlans();

// 2. Show pricing to user, then purchase
await memberstack.purchasePlansWithCheckout({
  priceId: 'price_1234567890',
  successUrl: '/dashboard?success=true',
  cancelUrl: '/pricing?cancelled=true'
});
```

### Error Handling Pattern
```javascript
async function handleMemberstackOperation(operation) {
  try {
    const result = await operation();
    return { success: true, data: result };
  } catch (error) {
    console.error('Memberstack error:', error);
    
    // Handle common error types
    switch (error.code) {
      case 'INVALID_CREDENTIALS':
        return { success: false, message: 'Invalid email or password' };
      case 'MEMBER_NOT_VERIFIED':
        return { success: false, message: 'Please verify your email' };
      case 'PLAN_REQUIRED':
        return { success: false, message: 'This feature requires a subscription' };
      default:
        return { success: false, message: error.message };
    }
  }
}
```

## API Method Categories

| Category | Methods | Description |
|----------|---------|-------------|
| **Initialization** | `init()` | Setup and configuration |
| **Authentication** | `loginMemberEmailPassword()`, `signupMemberEmailPassword()`, `logout()`, `loginWithProvider()` | Member authentication |
| **Member Management** | `getCurrentMember()`, `updateMember()`, `updateMemberAuth()` | Member data operations |
| **Plan Management** | `getPlans()`, `addPlan()`, `purchasePlansWithCheckout()`, `launchStripeCustomerPortal()` | Subscription operations |
| **UI Components** | `openModal()`, `hideModal()` | Pre-built UI elements |
| **Member Journey** | `sendMemberVerificationEmail()`, `resetMemberPassword()`, `onAuthChange()` | Email flows and callbacks |
| **Advanced Features** | `getSecureContent()`, `createPost()`, `joinTeam()` | Comments, teams, secure content |

## 🚨 SSR/Next.js Quick Fix

**Getting "localStorage is not defined" errors?** This is common with Next.js 13+ and SSR:

```javascript
// ❌ DON'T: Import at module level
import memberstack from "@memberstack/dom"

// ✅ DO: Import conditionally on client-side
"use client"
let memberstack = null
if (typeof window !== 'undefined') {
  import("@memberstack/dom").then(m => memberstack = m.default)
}
```

See **[02-authentication.md](02-authentication.md)** for complete SSR-safe implementation patterns.

## Next Steps

### 🎯 Start Here (Everything You Need)
1. **[14-security-testing-tools.md](14-security-testing-tools.md)** - **Test your security instantly**
2. **[02-authentication.md](02-authentication.md)** - **Complete secure authentication with SSR safety (auto-built for you)**
3. **[12-server-side-authentication.md](12-server-side-authentication.md)** - **Understanding what was built for you**

### Advanced Features
4. **[03-member-management.md](03-member-management.md)** - Member data operations
5. **[04-plan-management.md](04-plan-management.md)** - Subscription and billing
6. **[10-examples.md](10-examples.md)** - Complete implementation examples
7. **[13-security-considerations.md](13-security-considerations.md)** - Business impact of security decisions

## Support Resources

- **Memberstack Dashboard**: Configure your app settings
- **Security Assessment**: See [13-security-considerations.md](13-security-considerations.md) checklist
- **Error Codes**: See [09-error-handling.md](09-error-handling.md)
- **TypeScript Definitions**: See [08-types-reference.md](08-types-reference.md)
- **Advanced Features**: See [07-advanced-features.md](07-advanced-features.md)