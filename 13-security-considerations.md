# Memberstack Security Considerations

## AI Assistant Instructions
When discussing Memberstack security:
- **ALWAYS distinguish between client-side and server-side security**
- **Warn immediately** when users ask about client-side only implementations for production
- **Explain attack vectors** to help users understand why server-side validation is required
- **Provide secure alternatives** for every insecure pattern shown
- **Use security indicators** (🔴 🟡 🟢) to visually communicate security levels
- **Reference specific security patterns** from 12-server-side-authentication.md
- **Recommend security assessments** before production deployment

## Overview

Memberstack security varies dramatically based on implementation approach. This guide explains security levels, common attack vectors, and best practices for production applications.

## Security Levels

### 🔴 Client-Side Only (Insecure)
**Package**: `@memberstack/dom`
**Security Level**: None - Easily bypassed
**Use Cases**: Demos, marketing sites, development

```javascript
// ❌ This is NOT secure - can be bypassed in seconds
const member = memberstack.getCurrentMember()
if (member?.planConnections?.some(p => p.status === 'ACTIVE')) {
  showPremiumContent() // Anyone can bypass this
}
```

**Why It's Insecure**:
- All logic runs in browser
- Users can modify JavaScript variables
- LocalStorage can be edited
- API calls can be made directly

### 🟡 Partial Security (Hybrid)
**Packages**: `@memberstack/dom` + basic server validation
**Security Level**: Limited - Some server validation
**Use Cases**: Simple applications with basic protection

```javascript
// 🟡 Better but still vulnerable to sophisticated attacks
fetch('/api/premium-content', {
  headers: { 'Authorization': `Bearer ${token}` }
})
// Server validates token but may not validate plan status
```

### 🟢 Production Security (Secure)
**Packages**: `@memberstack/dom` + `@memberstack/admin`
**Security Level**: High - Full server-side validation
**Use Cases**: Production applications, paid content, SaaS

```javascript
// ✅ Secure - Token AND plan status validated server-side
fetch('/api/premium-content', {
  headers: { 'Authorization': `Bearer ${token}` }
})
// Server uses Admin SDK to verify token + plan status
```

## Common Attack Vectors

### 1. Browser DevTools Manipulation

**Attack**: Modify client-side variables to bypass authentication checks.

```javascript
// Attacker opens browser console and types:
localStorage.setItem('_ms-mid', 'fake-token')
window.memberstack = {
  getCurrentMember: () => ({
    id: 'fake',
    planConnections: [{ status: 'ACTIVE', planId: 'premium' }]
  })
}
// Now they have "premium" access to client-side checks
```

**Defense**: Server-side token validation
```typescript
// ✅ Secure - Validates with Memberstack servers
const tokenData = await memberstack.verifyToken({ token })
```

### 2. Direct API Access

**Attack**: Bypass UI entirely and call APIs directly.

```bash
# Attacker calls your API directly
curl https://yourapp.com/api/premium-content \
  -H "Authorization: Bearer fake-or-stolen-token"
```

**Defense**: Authentication middleware on all protected routes
```typescript
// ✅ Secure - Every API route validates authentication
export async function GET(request: NextRequest) {
  await requirePremiumAccess() // Validates token + plan
  return NextResponse.json({ data: protectedContent })
}
```

### 3. Token Theft and Replay

**Attack**: Steal valid tokens from other users.

```javascript
// Attacker steals token from localStorage, network traffic, or XSS
const stolenToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...'
// Uses stolen token to access premium content
```

**Defense**: Token validation with user identity verification
```typescript
// ✅ Secure - Validates token belongs to session user
const tokenData = await memberstack.verifyToken({ token })
if (tokenData.id !== expectedMemberId) {
  throw new Error('Token/user mismatch')
}
```

### 4. Plan Status Manipulation

**Attack**: Modify plan data in client-side code.

```javascript
// Attacker modifies member object
member.planConnections = [{
  status: 'ACTIVE',
  planId: 'premium',
  payment: { priceId: 'premium-price' }
}]
```

**Defense**: Server-side plan validation
```typescript
// ✅ Secure - Always verify plan status server-side
const { hasPremiumPlan } = await validateMemberSession()
if (!hasPremiumPlan) {
  throw new Error('Premium plan required')
}
```

### 5. Environment Variable Exposure

**Attack**: Access secret keys exposed in client bundle.

```javascript
// ❌ NEVER do this - exposes secret key to all users
const MEMBERSTACK_SECRET = process.env.NEXT_PUBLIC_MEMBERSTACK_SECRET
```

**Defense**: Proper environment variable naming
```bash
# ✅ Secure - Server-only variables
MEMBERSTACK_SECRET_KEY=sk_live_...

# ✅ Safe - Public variables
NEXT_PUBLIC_MEMBERSTACK_PUBLIC_KEY=pk_live_...
```

## Security Assessment Checklist

### Authentication Security
- [ ] **Token validation**: All protected routes validate JWT tokens server-side
- [ ] **Plan verification**: Plan status checked server-side, not client-side
- [ ] **Environment security**: Secret keys never exposed to client
- [ ] **Rate limiting**: Authentication endpoints have rate limiting
- [ ] **Error handling**: Errors don't leak sensitive information

### API Security
- [ ] **Authorization**: Every protected API route requires authentication
- [ ] **Input validation**: All inputs validated and sanitized
- [ ] **CORS configuration**: Proper CORS headers for API access
- [ ] **HTTPS enforcement**: All traffic encrypted with HTTPS
- [ ] **Security headers**: Proper security headers (CSP, HSTS, etc.)

### Client-Side Security
- [ ] **No secrets in client**: No secret keys in browser-accessible code
- [ ] **XSS protection**: Content Security Policy and input sanitization
- [ ] **Token storage**: Secure token storage (httpOnly cookies preferred)
- [ ] **Logout handling**: Proper token cleanup on logout
- [ ] **Session timeouts**: Automatic logout for expired sessions

## Security Testing

### Manual Security Tests

1. **Client-Side Bypass Test**
   ```javascript
   // Try to bypass authentication in browser console
   localStorage.setItem('_ms-mid', 'fake-token')
   // If this gives access to protected content, you have a security issue
   ```

2. **Direct API Access Test**
   ```bash
   # Try to access protected APIs without authentication
   curl https://yourapp.com/api/premium-content
   # Should return 401 Unauthorized
   ```

3. **Token Manipulation Test**
   ```bash
   # Try invalid tokens
   curl https://yourapp.com/api/premium-content \
     -H "Authorization: Bearer invalid-token"
   # Should return 401 Unauthorized
   ```

4. **Plan Status Test**
   ```javascript
   // Modify client-side plan data and try to access premium content
   member.planConnections = [{ status: 'ACTIVE' }]
   // If server accepts this, you have a security issue
   ```

### Automated Security Testing

```typescript
// __tests__/security.test.ts
describe('Security Tests', () => {
  test('should reject invalid tokens', async () => {
    const response = await fetch('/api/premium-content', {
      headers: { 'Authorization': 'Bearer invalid-token' }
    })
    expect(response.status).toBe(401)
  })

  test('should reject requests without authentication', async () => {
    const response = await fetch('/api/premium-content')
    expect(response.status).toBe(401)
  })

  test('should validate plan status server-side', async () => {
    // Test with valid token but no premium plan
    const response = await fetch('/api/premium-content', {
      headers: { 'Authorization': 'Bearer valid-but-free-token' }
    })
    expect(response.status).toBe(403)
  })
})
```

## Security Best Practices

### 1. Defense in Depth

Implement multiple layers of security:

```typescript
// Layer 1: Client-side UX check
if (!member) {
  return <LoginPage />
}

// Layer 2: Page-level authentication
const { authenticated } = await validateSession()
if (!authenticated) {
  redirect('/login')
}

// Layer 3: API-level authentication
export async function GET() {
  await requireAuthentication() // Server-side validation
  return NextResponse.json({ data })
}

// Layer 4: Data-level authorization
const data = await getDataForMember(memberId) // Only member's data
```

### 2. Principle of Least Privilege

```typescript
// ✅ Good - Different access levels
export async function requireBasicAccess() {
  const { isValid } = await validateMemberSession()
  if (!isValid) throw new Error('Authentication required')
}

export async function requirePremiumAccess() {
  const { isValid, hasPremiumPlan } = await validateMemberSession()
  if (!isValid) throw new Error('Authentication required')
  if (!hasPremiumPlan) throw new Error('Premium plan required')
}

export async function requireAdminAccess() {
  const { isValid, member } = await validateMemberSession()
  if (!isValid) throw new Error('Authentication required')
  if (!member.isAdmin) throw new Error('Admin access required')
}
```

### 3. Secure Token Handling

```typescript
// ✅ Secure token extraction
export function getAuthToken(): string | null {
  // Option 1: From httpOnly cookie (most secure)
  const token = cookies().get('memberstack-token')?.value

  // Option 2: From Authorization header
  const authHeader = headers().get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  return null
}

// ❌ Never do this - token in URL
// /api/data?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

### 4. Error Handling Security

```typescript
// ✅ Secure error handling
export async function validateMemberSession() {
  try {
    const tokenData = await memberstack.verifyToken({ token })
    return { isValid: true, member: tokenData }
  } catch (error) {
    // Log detailed error for debugging (server-side only)
    console.error('Token validation failed:', {
      error: error.message,
      timestamp: new Date().toISOString(),
      // Don't log the actual token
      hasToken: !!token,
    })

    // Return generic error to client
    return { isValid: false, member: null }
  }
}

// ❌ Don't leak sensitive information
// throw new Error(`Invalid token: ${token}`) // Exposes token
// throw new Error(`Member not found: ${memberId}`) // Exposes IDs
```

### 5. Rate Limiting and Monitoring

```typescript
// Rate limiting for authentication endpoints
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many authentication attempts',
  standardHeaders: true,
  legacyHeaders: false,
})

// Security event logging
export function logSecurityEvent(event: string, details: any) {
  console.log(JSON.stringify({
    type: 'SECURITY_EVENT',
    event,
    timestamp: new Date().toISOString(),
    details: {
      userAgent: details.userAgent,
      ip: details.ip,
      // Don't log sensitive data
      hasToken: !!details.token,
      memberId: details.memberId,
    }
  }))
}
```

## Migration Security Checklist

When migrating from client-side only to server-side authentication:

### Pre-Migration Assessment
- [ ] Identify all protected routes and components
- [ ] Document current authentication flows
- [ ] List all API endpoints that need protection
- [ ] Identify custom fields and plan logic

### Migration Steps
- [ ] Install `@memberstack/admin` package
- [ ] Set up environment variables (keep secrets server-only)
- [ ] Create server-side validation functions
- [ ] Protect all API routes with authentication middleware
- [ ] Update client components to use server validation
- [ ] Add security headers and CORS configuration

### Post-Migration Validation
- [ ] Run security tests against all protected endpoints
- [ ] Verify client-side bypasses don't work
- [ ] Test with invalid/expired tokens
- [ ] Confirm plan status validation works server-side
- [ ] Monitor authentication events in production

## Security Monitoring

### Key Metrics to Monitor
- Failed authentication attempts per IP
- Suspicious token usage patterns
- API access without proper authentication
- Unusual plan status changes
- High-frequency requests from single users

### Alerting Setup
```typescript
// Example monitoring setup
export function monitorAuthenticationEvents() {
  // Alert on multiple failed logins
  if (failedLogins > 10) {
    sendAlert('Multiple failed login attempts detected')
  }

  // Alert on API access without auth
  if (unauthenticatedApiRequests > 50) {
    sendAlert('High volume of unauthenticated API requests')
  }

  // Alert on token validation failures
  if (tokenValidationFailures > 100) {
    sendAlert('High volume of token validation failures')
  }
}
```

## Compliance Considerations

### GDPR Compliance
- Secure handling of member personal data
- Right to data deletion implementation
- Consent management for data processing
- Data breach notification procedures

### SOC 2 Compliance
- Access controls and authentication logging
- Data encryption in transit and at rest
- Security incident response procedures
- Regular security assessments

### PCI DSS (if handling payments)
- Secure token handling for payment data
- Network security controls
- Regular security testing
- Access control measures

## Summary

Security in Memberstack applications requires:

✅ **Server-side validation** using the Admin SDK
✅ **Token verification** on every protected request
✅ **Plan status validation** server-side only
✅ **Proper environment variable handling**
✅ **Defense in depth** with multiple security layers
✅ **Regular security testing** and monitoring

### Remember
- **Client-side authentication is for UX only** - never rely on it for security
- **Always validate tokens server-side** using `@memberstack/admin`
- **Test your security regularly** - attackers will test it for you
- **Monitor authentication events** for suspicious activity
- **Keep security documentation up to date** as your application evolves

## Next Steps

- **[12-server-side-authentication.md](12-server-side-authentication.md)** - Implementation guide for secure authentication
- **[02-authentication.md](02-authentication.md)** - Client-side authentication patterns
- **[09-error-handling.md](09-error-handling.md)** - Secure error handling patterns