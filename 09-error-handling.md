# Memberstack DOM - Error Handling & Troubleshooting

## AI Assistant Instructions
When implementing error handling for Memberstack:
- Always wrap API calls in try/catch blocks
- Use specific error codes for conditional logic
- Provide user-friendly error messages
- Log detailed errors for debugging
- Implement retry mechanisms for network errors
- Reference specific error types from 08-types-reference.md

## Overview

Comprehensive error handling guide for Memberstack DOM package, including error codes, debugging strategies, common issues, and recovery patterns.

## Error Structure

All Memberstack errors follow a consistent structure:

```typescript
interface MemberstackError extends Error {
  code: string;           // Specific error code
  message: string;        // Human-readable message
  details?: any;          // Additional error details
  status?: number;        // HTTP status code (if applicable)
  field?: string;         // Field that caused validation error
  context?: string;       // Additional context information
}
```

## Error Codes Reference

### Authentication Errors

#### AUTH_001 - Invalid Credentials
**Code:** `INVALID_CREDENTIALS`
**Description:** Email/password combination is incorrect
**Common Causes:**
- Wrong email or password
- Account doesn't exist
- Typo in credentials

**Example:**
```typescript
try {
  await memberstack.loginMemberEmailPassword({
    email: 'user@example.com',
    password: 'wrongpassword'
  });
} catch (error) {
  if (error.code === 'INVALID_CREDENTIALS') {
    setError('Email or password is incorrect. Please try again.');
  }
}
```

#### AUTH_002 - Member Not Found
**Code:** `MEMBER_NOT_FOUND`
**Description:** No member exists with the provided email
**Common Causes:**
- Member hasn't signed up yet
- Email typo
- Different email used for signup

#### AUTH_003 - Member Not Verified
**Code:** `MEMBER_NOT_VERIFIED`
**Description:** Member must verify their email before logging in
**Recovery Pattern:**
```typescript
try {
  await memberstack.loginMemberEmailPassword({ email, password });
} catch (error) {
  if (error.code === 'MEMBER_NOT_VERIFIED') {
    // Offer to resend verification email
    const resend = confirm('Please verify your email. Resend verification?');
    if (resend) {
      await memberstack.sendMemberEmailVerification({ email });
      alert('Verification email sent!');
    }
  }
}
```

#### AUTH_004 - Account Disabled
**Code:** `MEMBER_DISABLED`
**Description:** Member account has been disabled by admin
**Common Causes:**
- Admin disabled the account
- Violation of terms
- Security concerns

#### AUTH_005 - Too Many Login Attempts
**Code:** `TOO_MANY_ATTEMPTS`
**Description:** Account temporarily locked due to failed login attempts
**Recovery Pattern:**
```typescript
if (error.code === 'TOO_MANY_ATTEMPTS') {
  setError('Too many failed attempts. Please wait 15 minutes before trying again.');
  // Implement exponential backoff
  setTimeout(() => setCanRetry(true), 15 * 60 * 1000);
}
```

### Validation Errors

#### VAL_001 - Invalid Email Format
**Code:** `INVALID_EMAIL`
**Description:** Email format is invalid
**Field:** `email`

#### VAL_002 - Password Too Weak
**Code:** `WEAK_PASSWORD`
**Description:** Password doesn't meet security requirements
**Field:** `password`
**Details:** Usually includes password requirements

```typescript
try {
  await memberstack.signupMemberEmailPassword({ email, password });
} catch (error) {
  if (error.code === 'WEAK_PASSWORD') {
    setPasswordError(`Password requirements: ${error.details.requirements.join(', ')}`);
  }
}
```

#### VAL_003 - Email Already Exists
**Code:** `EMAIL_EXISTS`
**Description:** Member already exists with this email
**Recovery Pattern:**
```typescript
if (error.code === 'EMAIL_EXISTS') {
  const login = confirm('Account exists. Would you like to log in instead?');
  if (login) {
    // Redirect to login form
    setMode('login');
    setEmail(email); // Pre-fill email
  }
}
```

#### VAL_004 - Required Field Missing
**Code:** `REQUIRED_FIELD`
**Description:** Required field is missing or empty
**Field:** Name of the missing field

### Network & API Errors

#### NET_001 - Network Connection Error
**Code:** `NETWORK_ERROR`
**Description:** Unable to connect to Memberstack servers
**Recovery Pattern:**
```typescript
if (error.code === 'NETWORK_ERROR') {
  setError('Connection failed. Please check your internet and try again.');
  // Implement retry with exponential backoff
  setTimeout(() => retryOperation(), 2000);
}
```

#### NET_002 - API Rate Limit
**Code:** `RATE_LIMIT_EXCEEDED`
**Description:** Too many API requests in a short time
**Status:** `429`

#### NET_003 - Server Error
**Code:** `SERVER_ERROR`
**Description:** Internal server error
**Status:** `5xx`
**Recovery Pattern:**
```typescript
if (error.status >= 500) {
  setError('Server temporarily unavailable. Please try again in a moment.');
  // Implement retry with backoff
  setTimeout(() => retryWithBackoff(), calculateBackoff(attempts));
}
```

### Plan & Subscription Errors

#### PLAN_001 - Plan Not Found
**Code:** `PLAN_NOT_FOUND`
**Description:** Requested plan doesn't exist or isn't available

#### PLAN_002 - Payment Failed
**Code:** `PAYMENT_FAILED`
**Description:** Stripe checkout or payment processing failed
**Details:** Usually includes Stripe error details

```typescript
try {
  await memberstack.createCheckoutSession({ planId, successUrl, cancelUrl });
} catch (error) {
  if (error.code === 'PAYMENT_FAILED') {
    setError(`Payment failed: ${error.details.stripeError.message}`);
    // Log for debugging
    console.error('Stripe error:', error.details);
  }
}
```

#### PLAN_003 - Subscription Required
**Code:** `SUBSCRIPTION_REQUIRED`
**Description:** Feature requires an active subscription
**Recovery Pattern:**
```typescript
if (error.code === 'SUBSCRIPTION_REQUIRED') {
  const upgrade = confirm('This feature requires a subscription. Upgrade now?');
  if (upgrade) {
    // Redirect to plan selection
    window.location.href = '/plans';
  }
}
```

### Permission & Access Errors

#### PERM_001 - Insufficient Permissions
**Code:** `INSUFFICIENT_PERMISSIONS`
**Description:** Member doesn't have required permissions for this action

#### PERM_002 - Plan Access Denied
**Code:** `PLAN_ACCESS_DENIED`
**Description:** Member's current plan doesn't allow this feature

#### PERM_003 - Content Gated
**Code:** `CONTENT_GATED`
**Description:** Content requires specific plan or permission
**Recovery Pattern:**
```typescript
try {
  const content = await memberstack.getSecureContent({ contentId });
} catch (error) {
  if (error.code === 'CONTENT_GATED') {
    showUpgradeModal(error.details.requiredPlan);
  }
}
```

## Universal Error Handler

Implement a centralized error handler for consistent error management:

```typescript
class MemberstackErrorHandler {
  private static showUserMessage(message: string, type: 'error' | 'warning' | 'info') {
    // Your UI notification system
    toast.show(message, type);
  }

  private static logError(error: MemberstackError, context: string) {
    console.group(`Memberstack Error: ${error.code}`);
    console.error('Message:', error.message);
    console.error('Context:', context);
    console.error('Details:', error.details);
    console.error('Stack:', error.stack);
    console.groupEnd();
  }

  static handle(error: MemberstackError, context: string = 'Unknown'): void {
    this.logError(error, context);

    // Handle specific error types
    switch (error.code) {
      case 'INVALID_CREDENTIALS':
        this.showUserMessage('Invalid email or password. Please try again.', 'error');
        break;

      case 'MEMBER_NOT_VERIFIED':
        this.showUserMessage('Please verify your email address to continue.', 'warning');
        break;

      case 'NETWORK_ERROR':
        this.showUserMessage('Connection issue. Please check your internet and retry.', 'error');
        break;

      case 'RATE_LIMIT_EXCEEDED':
        this.showUserMessage('Too many requests. Please wait a moment and try again.', 'warning');
        break;

      case 'PAYMENT_FAILED':
        this.showUserMessage('Payment could not be processed. Please try again.', 'error');
        break;

      case 'SUBSCRIPTION_REQUIRED':
        this.showUserMessage('This feature requires a subscription upgrade.', 'info');
        break;

      default:
        this.showUserMessage('Something went wrong. Please try again.', 'error');
        break;
    }
  }
}

// Usage in your application
try {
  await memberstack.loginMemberEmailPassword({ email, password });
} catch (error) {
  MemberstackErrorHandler.handle(error, 'User Login');
}
```

## Retry Mechanisms

### Exponential Backoff Implementation

```typescript
class RetryHandler {
  private static async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static async withRetry<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    baseDelay: number = 1000,
    context: string = 'Operation'
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Don't retry on certain error types
        if (error.code && this.shouldNotRetry(error.code)) {
          throw error;
        }

        if (attempt === maxAttempts) {
          console.error(`${context} failed after ${maxAttempts} attempts:`, error);
          throw error;
        }

        // Calculate exponential backoff delay
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.warn(`${context} attempt ${attempt} failed, retrying in ${delay}ms:`, error.message);
        
        await this.delay(delay);
      }
    }

    throw lastError;
  }

  private static shouldNotRetry(errorCode: string): boolean {
    const noRetryErrors = [
      'INVALID_CREDENTIALS',
      'MEMBER_NOT_FOUND',
      'EMAIL_EXISTS',
      'INSUFFICIENT_PERMISSIONS',
      'INVALID_EMAIL',
      'WEAK_PASSWORD'
    ];
    return noRetryErrors.includes(errorCode);
  }
}

// Usage example
const loginWithRetry = async (email: string, password: string) => {
  return RetryHandler.withRetry(
    () => memberstack.loginMemberEmailPassword({ email, password }),
    3, // max attempts
    1000, // base delay
    'Member Login'
  );
};
```

## Common Debugging Patterns

### Debug Mode Setup

```typescript
const memberstack = MemberstackDom.init({
  publicKey: 'pk_sb_your-key-here',
  debug: process.env.NODE_ENV === 'development'
});

// Enable verbose logging
memberstack.onAuthChange((member, error) => {
  console.group('Auth State Change');
  console.log('Member:', member);
  console.log('Error:', error);
  console.log('Timestamp:', new Date().toISOString());
  console.groupEnd();
});
```

### Network Request Inspection

```typescript
// Monitor all Memberstack network requests
const originalFetch = window.fetch;
window.fetch = function(...args) {
  if (args[0].toString().includes('memberstack')) {
    console.group('Memberstack API Call');
    console.log('URL:', args[0]);
    console.log('Options:', args[1]);
    console.groupEnd();
  }
  return originalFetch.apply(this, args);
};
```

## Troubleshooting Common Issues

### Issue 1: Authentication Not Persisting

**Symptoms:**
- User gets logged out on page refresh
- Authentication state resets

**Solutions:**
```typescript
// Ensure cookies are enabled
const memberstack = MemberstackDom.init({
  publicKey: 'pk_sb_your-key-here',
  useCookies: true,
  setCookieOnRootDomain: true
});

// Wait for auth state before rendering
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  memberstack.getCurrentMember()
    .then(() => setIsLoading(false))
    .catch(() => setIsLoading(false));
}, []);
```

### Issue 2: CORS Errors

**Symptoms:**
- "Access-Control-Allow-Origin" errors
- Blocked by CORS policy

**Solutions:**
```typescript
// Ensure domain is correctly configured
const memberstack = MemberstackDom.init({
  publicKey: 'pk_sb_your-key-here',
  domain: 'https://api.memberstack.com' // Use official domain
});

// Check allowed origins in Memberstack dashboard
// Add your domain to allowed origins
```

### Issue 3: Plan Connection Issues

**Symptoms:**
- User shows as logged in but no plan access
- Plan-specific features not working

**Debugging:**
```typescript
const debugMemberPlan = async () => {
  try {
    const member = await memberstack.getCurrentMember();
    console.group('Member Plan Debug');
    console.log('Member ID:', member.data.id);
    console.log('Plan Connections:', member.data.planConnections);
    console.log('Active Plans:', member.data.planConnections.filter(pc => pc.status === 'ACTIVE'));
    console.groupEnd();
  } catch (error) {
    console.error('Debug failed:', error);
  }
};
```

### Issue 4: Modal Not Appearing

**Symptoms:**
- `showModal()` doesn't display anything
- Modal appears behind other content

**Solutions:**
```typescript
// Ensure proper z-index
const memberstack = MemberstackDom.init({
  publicKey: 'pk_sb_your-key-here'
});

// Check modal container
document.addEventListener('DOMContentLoaded', () => {
  // Ensure modal container exists
  if (!document.querySelector('#memberstack-modal-container')) {
    const container = document.createElement('div');
    container.id = 'memberstack-modal-container';
    container.style.zIndex = '10000';
    document.body.appendChild(container);
  }
});
```

## Error Recovery Patterns

### Graceful Degradation

```typescript
const withFallback = async <T>(
  primary: () => Promise<T>,
  fallback: () => T,
  errorMessage: string = 'Feature temporarily unavailable'
): Promise<T> => {
  try {
    return await primary();
  } catch (error) {
    console.warn(errorMessage, error);
    return fallback();
  }
};

// Usage
const memberData = await withFallback(
  () => memberstack.getCurrentMember(),
  () => ({ data: null }), // Fallback to null member
  'Could not load member data'
);
```

### Progressive Enhancement

```typescript
const enhanceWithMemberData = async (baseComponent: React.ComponentType) => {
  try {
    const member = await memberstack.getCurrentMember();
    return React.createElement(EnhancedComponent, { member: member.data });
  } catch (error) {
    console.warn('Member enhancement failed, using base component:', error);
    return React.createElement(baseComponent);
  }
};
```

## Best Practices Summary

1. **Always Use Try/Catch**: Wrap all Memberstack API calls
2. **Specific Error Handling**: Check error codes for targeted responses
3. **User-Friendly Messages**: Convert technical errors to user-friendly text
4. **Retry Logic**: Implement for network-related errors
5. **Logging**: Log detailed errors for debugging
6. **Graceful Degradation**: Provide fallbacks when features fail
7. **Progress Indication**: Show loading states during operations
8. **Validation**: Validate inputs before API calls
9. **State Management**: Handle authentication state changes properly
10. **Testing**: Test error scenarios in development

## Testing Error Scenarios

```typescript
// Mock error responses for testing
const mockMemberstackError = (code: string, message: string) => {
  const error = new Error(message);
  error.code = code;
  return error;
};

// Test error handling
describe('Error Handling', () => {
  test('handles invalid credentials', async () => {
    memberstack.loginMemberEmailPassword = jest.fn()
      .mockRejectedValue(mockMemberstackError('INVALID_CREDENTIALS', 'Invalid email or password'));
    
    const result = await attemptLogin('test@example.com', 'wrong');
    expect(result.error).toBe('Email or password is incorrect. Please try again.');
  });
});
```