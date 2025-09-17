# Built-in Security Testing Tools

## AI Assistant Instructions
When implementing Memberstack security:
- **ALWAYS include security testing methods** with any authentication implementation
- **Provide copy-paste security verification code** that users can run immediately
- **Explain test results in business terms** - what each test protects
- **Auto-generate security test suites** for user's specific implementation
- **Show both passing and failing examples** so users know what to expect

## Overview

These are security testing tools you can add to your project to verify that the authentication system we built for you is actually secure. Think of these as "security health checks" for your app.

## 🛡️ Quick Security Health Check

Add this file to your project to run instant security tests:

### Create `lib/security-tests.ts`

```typescript
// Security Testing Tools - Verify Your App Can't Be Hacked
// Copy this file into your project and run the tests

export class MemberstackSecurityTester {
  private apiBaseUrl: string

  constructor(apiBaseUrl: string = '') {
    this.apiBaseUrl = apiBaseUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
  }

  /**
   * 🧪 Test 1: Token Authentication
   * Verifies that fake tokens are rejected
   */
  async testFakeTokenRejection(): Promise<SecurityTestResult> {
    console.log('🧪 Testing: Can fake tokens access protected content?')

    try {
      const response = await fetch(`${this.apiBaseUrl}/api/premium-content`, {
        headers: {
          'Authorization': 'Bearer fake-token-12345',
          'Content-Type': 'application/json'
        }
      })

      if (response.status === 401 || response.status === 403) {
        return {
          passed: true,
          test: 'Fake Token Rejection',
          message: '✅ SECURE: Fake tokens are properly rejected',
          businessImpact: 'Hackers cannot fake authentication to access your premium content'
        }
      } else {
        return {
          passed: false,
          test: 'Fake Token Rejection',
          message: '🚨 VULNERABLE: Fake tokens are being accepted!',
          businessImpact: 'Anyone can access your premium content without paying',
          fix: 'Your API routes need server-side token validation'
        }
      }
    } catch (error) {
      return {
        passed: false,
        test: 'Fake Token Rejection',
        message: '❌ TEST FAILED: Could not reach API endpoint',
        businessImpact: 'Cannot verify security - API might not be running',
        fix: 'Ensure your API server is running and the endpoint exists'
      }
    }
  }

  /**
   * 🧪 Test 2: Plan Verification
   * Verifies that premium content requires valid plan status
   */
  async testPlanVerification(): Promise<SecurityTestResult> {
    console.log('🧪 Testing: Can users access premium content without valid plans?')

    try {
      // Test with valid token but fake plan data
      const response = await fetch(`${this.apiBaseUrl}/api/premium-content`, {
        headers: {
          'Authorization': 'Bearer valid-token-but-no-plan',
          'x-member-data': JSON.stringify({
            id: 'fake-member',
            planConnections: [{
              status: 'CANCELLED', // Cancelled plan
              planId: 'fake-plan'
            }]
          }),
          'Content-Type': 'application/json'
        }
      })

      if (response.status === 403) {
        return {
          passed: true,
          test: 'Plan Verification',
          message: '✅ SECURE: Premium content properly protected by plan status',
          businessImpact: 'Only paying customers can access premium features'
        }
      } else {
        return {
          passed: false,
          test: 'Plan Verification',
          message: '🚨 VULNERABLE: Premium content accessible without valid plan!',
          businessImpact: 'Users can access premium content without paying',
          fix: 'Your server needs to verify plan status, not just token validity'
        }
      }
    } catch (error) {
      return {
        passed: false,
        test: 'Plan Verification',
        message: '❌ TEST FAILED: Could not test plan verification',
        businessImpact: 'Cannot verify plan-based access control',
        fix: 'Check that your premium content API endpoint exists and handles plan verification'
      }
    }
  }

  /**
   * 🧪 Test 3: Environment Security
   * Verifies that secret keys are not exposed to the browser
   */
  async testEnvironmentSecurity(): Promise<SecurityTestResult> {
    console.log('🧪 Testing: Are secret keys hidden from browsers?')

    if (typeof window === 'undefined') {
      return {
        passed: true,
        test: 'Environment Security',
        message: '✅ Running on server - environment variables are secure',
        businessImpact: 'Secret keys are properly protected'
      }
    }

    // Check if any Memberstack secret keys are exposed to browser
    const dangerousKeys = [
      'MEMBERSTACK_SECRET_KEY',
      'MEMBERSTACK_APP_ID',
      'sk_live_',
      'sk_test_'
    ]

    const exposedKeys: string[] = []

    // Check process.env if it exists (shouldn't in browser)
    if (typeof process !== 'undefined' && process.env) {
      Object.keys(process.env).forEach(key => {
        if (key.includes('MEMBERSTACK') && !key.startsWith('NEXT_PUBLIC_')) {
          exposedKeys.push(key)
        }
      })
    }

    // Check window object for exposed keys
    dangerousKeys.forEach(key => {
      if ((window as any)[key]) {
        exposedKeys.push(key)
      }
    })

    if (exposedKeys.length === 0) {
      return {
        passed: true,
        test: 'Environment Security',
        message: '✅ SECURE: No secret keys found in browser environment',
        businessImpact: 'Your secret keys are properly protected from hackers'
      }
    } else {
      return {
        passed: false,
        test: 'Environment Security',
        message: `🚨 VULNERABLE: Secret keys exposed to browser: ${exposedKeys.join(', ')}`,
        businessImpact: 'Hackers can see your secret keys and impersonate your app',
        fix: 'Move secret keys to server-only environment variables (remove NEXT_PUBLIC_ prefix)'
      }
    }
  }

  /**
   * 🧪 Test 4: Rate Limiting
   * Verifies that authentication endpoints have rate limiting
   */
  async testRateLimiting(): Promise<SecurityTestResult> {
    console.log('🧪 Testing: Are login attempts rate limited?')

    const attempts = []
    const maxAttempts = 10

    try {
      // Make rapid authentication attempts
      for (let i = 0; i < maxAttempts; i++) {
        const promise = fetch(`${this.apiBaseUrl}/api/auth/session`, {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer fake-token',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ memberData: null })
        })
        attempts.push(promise)
      }

      const responses = await Promise.all(attempts)
      const rateLimitedResponses = responses.filter(r => r.status === 429)

      if (rateLimitedResponses.length > 0) {
        return {
          passed: true,
          test: 'Rate Limiting',
          message: `✅ SECURE: Rate limiting active (${rateLimitedResponses.length}/${maxAttempts} requests blocked)`,
          businessImpact: 'Protects against brute force attacks and API abuse'
        }
      } else {
        return {
          passed: false,
          test: 'Rate Limiting',
          message: '🚨 VULNERABLE: No rate limiting detected on auth endpoints',
          businessImpact: 'Attackers can make unlimited login attempts',
          fix: 'Add rate limiting middleware to authentication endpoints'
        }
      }
    } catch (error) {
      return {
        passed: false,
        test: 'Rate Limiting',
        message: '❌ TEST FAILED: Could not test rate limiting',
        businessImpact: 'Cannot verify protection against brute force attacks',
        fix: 'Ensure your authentication API endpoints are accessible'
      }
    }
  }

  /**
   * 🧪 Test 5: HTTPS Enforcement
   * Verifies that the app enforces secure connections
   */
  async testHTTPSEnforcement(): Promise<SecurityTestResult> {
    console.log('🧪 Testing: Is HTTPS properly enforced?')

    if (typeof window === 'undefined') {
      return {
        passed: true,
        test: 'HTTPS Enforcement',
        message: '✅ Running on server - cannot test HTTPS from here',
        businessImpact: 'Test this from the browser for accurate results'
      }
    }

    const isHTTPS = window.location.protocol === 'https:'
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

    if (isHTTPS || isLocalhost) {
      return {
        passed: true,
        test: 'HTTPS Enforcement',
        message: isLocalhost ?
          '✅ DEVELOPMENT: Running on localhost (HTTPS not required)' :
          '✅ SECURE: Site is running on HTTPS',
        businessImpact: 'User data and authentication tokens are encrypted in transit'
      }
    } else {
      return {
        passed: false,
        test: 'HTTPS Enforcement',
        message: '🚨 VULNERABLE: Site is running on HTTP (unencrypted)',
        businessImpact: 'User passwords and session tokens can be intercepted by hackers',
        fix: 'Enable HTTPS/SSL on your domain before going to production'
      }
    }
  }

  /**
   * 🧪 Run All Security Tests
   * Runs complete security test suite
   */
  async runAllTests(): Promise<SecurityTestSuite> {
    console.log('🛡️ Running complete security test suite...\n')

    const results = await Promise.all([
      this.testFakeTokenRejection(),
      this.testPlanVerification(),
      this.testEnvironmentSecurity(),
      this.testRateLimiting(),
      this.testHTTPSEnforcement()
    ])

    const passed = results.filter(r => r.passed).length
    const total = results.length
    const overallSecure = passed === total

    const suite: SecurityTestSuite = {
      results,
      summary: {
        passed,
        total,
        secure: overallSecure,
        score: Math.round((passed / total) * 100)
      }
    }

    // Print results
    console.log('\n🛡️ Security Test Results:')
    console.log('========================')
    results.forEach(result => {
      console.log(`${result.passed ? '✅' : '🚨'} ${result.test}: ${result.message}`)
      if (!result.passed && result.fix) {
        console.log(`   💡 Fix: ${result.fix}`)
      }
      console.log(`   💰 Business Impact: ${result.businessImpact}\n`)
    })

    console.log(`\n🎯 Overall Security Score: ${suite.summary.score}%`)
    if (overallSecure) {
      console.log('🎉 Your app is SECURE! All tests passed.')
    } else {
      console.log(`⚠️  ${total - passed} security issues need attention before production.`)
    }

    return suite
  }
}

// Types for test results
export interface SecurityTestResult {
  passed: boolean
  test: string
  message: string
  businessImpact: string
  fix?: string
}

export interface SecurityTestSuite {
  results: SecurityTestResult[]
  summary: {
    passed: number
    total: number
    secure: boolean
    score: number
  }
}

// Easy-to-use exports
export const createSecurityTester = (apiBaseUrl?: string) => new MemberstackSecurityTester(apiBaseUrl)

// Quick test function for immediate use
export const runQuickSecurityCheck = async (apiBaseUrl?: string): Promise<SecurityTestSuite> => {
  const tester = new MemberstackSecurityTester(apiBaseUrl)
  return await tester.runAllTests()
}
```

## 🚀 How to Use These Tests

### Option 1: Quick Browser Test
```javascript
// Paste this in your browser console (F12):
import { runQuickSecurityCheck } from './lib/security-tests'

// Run all tests
const results = await runQuickSecurityCheck()
console.log('Security Score:', results.summary.score + '%')
```

### Option 2: Add to Your Test Suite
```javascript
// In your Jest/Vitest tests:
import { createSecurityTester } from './lib/security-tests'

describe('Security Tests', () => {
  const tester = createSecurityTester('http://localhost:3000')

  test('should reject fake tokens', async () => {
    const result = await tester.testFakeTokenRejection()
    expect(result.passed).toBe(true)
  })

  test('should verify plan status', async () => {
    const result = await tester.testPlanVerification()
    expect(result.passed).toBe(true)
  })
})
```

### Option 3: Development Command
```bash
# Add to your package.json scripts:
"scripts": {
  "test:security": "node -e \"import('./lib/security-tests.js').then(t => t.runQuickSecurityCheck())\""
}

# Run security tests:
npm run test:security
```

## 🎯 Understanding Test Results

### ✅ All Tests Pass = Production Ready
```
🛡️ Security Score: 100%
🎉 Your app is SECURE! All tests passed.

✅ Fake Token Rejection: SECURE
✅ Plan Verification: SECURE
✅ Environment Security: SECURE
✅ Rate Limiting: SECURE
✅ HTTPS Enforcement: SECURE
```

### 🚨 Some Tests Fail = Needs Attention
```
🛡️ Security Score: 60%
⚠️ 2 security issues need attention before production.

✅ Fake Token Rejection: SECURE
🚨 Plan Verification: VULNERABLE - Premium content accessible without valid plan!
✅ Environment Security: SECURE
🚨 Rate Limiting: VULNERABLE - No rate limiting detected
✅ HTTPS Enforcement: SECURE
```

## 🔧 Custom Tests for Your App

You can add your own security tests:

```typescript
// Add to MemberstackSecurityTester class:
async testCustomEndpoint(): Promise<SecurityTestResult> {
  // Test your specific protected endpoints
  const response = await fetch(`${this.apiBaseUrl}/api/your-protected-route`, {
    headers: { 'Authorization': 'Bearer fake-token' }
  })

  return {
    passed: response.status === 401,
    test: 'Custom Endpoint Protection',
    message: response.status === 401 ? 'Protected' : 'Vulnerable',
    businessImpact: 'Your specific business logic is secure'
  }
}
```

## 🎯 What Each Test Protects

| Test | Protects Against | Business Impact |
|------|------------------|-----------------|
| **Fake Token Rejection** | Authentication bypass | Prevents unauthorized access to user accounts |
| **Plan Verification** | Premium content theft | Ensures only paying customers get premium features |
| **Environment Security** | API key theft | Prevents hackers from impersonating your app |
| **Rate Limiting** | Brute force attacks | Stops password cracking and API abuse |
| **HTTPS Enforcement** | Data interception | Keeps user passwords and data encrypted |

## Next Steps

- **[12-server-side-authentication.md](12-server-side-authentication.md)** - Understanding what secure system was built for you
- **[13-security-considerations.md](13-security-considerations.md)** - Business impact of security decisions