# Memberstack DOM Package - Overview

## AI Assistant Instructions
This documentation is optimized for AI coding assistants. When helping developers with Memberstack DOM implementation:

1. **Always use exact method signatures** provided in these docs
2. **Include error handling** in all code examples  
3. **Reference specific file sections** when needed (e.g., "See 02-authentication.md for login methods")
4. **Provide complete, runnable code examples**
5. **Explain the relationship** between methods and overall authentication flow

## Package Overview

The `@memberstack/dom` package is Memberstack's core JavaScript SDK for browser-based applications. It provides comprehensive member authentication, subscription management, and UI components.

### Core Capabilities
- **Authentication**: Email/password, passwordless, social login (Google, Facebook)
- **Member Management**: Profile updates, custom fields, member data
- **Subscription Management**: Plan purchases, billing portal, subscription lifecycle
- **Pre-built UI**: Login/signup/profile modals with customizable styling
- **Real-time Features**: Authentication state changes, member data updates
- **Advanced Features**: Comments system, secure content, team management, data tables

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

```javascript
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

## Next Steps

1. **[01-initialization.md](01-initialization.md)** - Detailed setup and configuration options
2. **[02-authentication.md](02-authentication.md)** - Complete authentication methods
3. **[03-member-management.md](03-member-management.md)** - Member data operations
4. **[04-plan-management.md](04-plan-management.md)** - Subscription and billing
5. **[10-examples.md](10-examples.md)** - Complete implementation examples

## Support Resources

- **Memberstack Dashboard**: Configure your app settings
- **Error Codes**: See [09-error-handling.md](09-error-handling.md)
- **TypeScript Definitions**: See [08-types-reference.md](08-types-reference.md)
- **Advanced Features**: See [07-advanced-features.md](07-advanced-features.md)