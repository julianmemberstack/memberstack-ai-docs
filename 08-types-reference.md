# Memberstack DOM - TypeScript Types Reference

## AI Assistant Instructions
When providing TypeScript support:
- Use these exact type definitions in code examples
- Import types from `@memberstack/dom` when available
- Include proper error type handling in catch blocks
- Use union types for method parameters with multiple options
- Reference specific interfaces when explaining method signatures

## Overview

This reference provides complete TypeScript type definitions for the Memberstack DOM package. Use these types for better IDE support, type checking, and development experience.

## Core Configuration Types

### DOMConfig
Configuration object for initializing Memberstack DOM.

```typescript
interface DOMConfig {
  publicKey: string;                    // Required: Your Memberstack public key
  appId?: string;                      // Optional: Specific app ID override
  useCookies?: boolean;                // Optional: Enable cookie-based auth storage
  setCookieOnRootDomain?: boolean;     // Optional: Set cookies on root domain
  domain?: string;                     // Optional: Custom API endpoint
  sessionDurationDays?: number;        // Optional: Deprecated - handled automatically
}
```

**Usage:**
```typescript
const config: DOMConfig = {
  publicKey: 'pk_sb_your-key-here',
  useCookies: true,
  setCookieOnRootDomain: true,
  domain: 'https://api.memberstack.com'
};

const memberstack = MemberstackDom.init(config);
```

## Authentication Types

### Login Parameters

```typescript
interface LoginMemberEmailPasswordParams {
  email: string;
  password: string;
}

interface LoginMemberPasswordlessParams {
  passwordlessToken: string;
  email: string;
}

interface LoginWithProviderParams {
  provider: string;                    // 'GOOGLE' | 'FACEBOOK'
  allowSignup?: boolean;               // Allow account creation if no account exists
}
```

### Signup Parameters

```typescript
interface SignupMemberEmailPasswordParams {
  email: string;
  password: string;
  customFields?: Record<string, any>;  // Additional member data
  metaData?: Record<string, any>;      // Internal metadata (rarely used)
  plans?: Array<{ planId: string }>;   // Free plans to assign during signup
  captchaToken?: string;               // hCaptcha token if captcha enabled
  inviteToken?: string;                // Team invitation token
}

interface SignupWithProviderParams {
  provider: string;                    // 'GOOGLE' | 'FACEBOOK'
  customFields?: Record<string, any>;
  plans?: Array<{ planId: string }>;
  allowLogin?: boolean;                // Allow login if account already exists
}
```

### Authentication Response Types

```typescript
interface LoginMemberEmailPasswordPayload {
  data: {
    member: Member;
    tokens: {
      accessToken: string;
      expires: number;                 // Unix timestamp
    };
  };
}

interface SignupMemberEmailPasswordPayload {
  data: {
    member: Member;
    tokens: {
      accessToken: string;
      expires: number;
    };
  };
}

interface LogoutMemberPayload {
  data: {
    redirect?: string;                 // Optional redirect URL after logout
  };
}
```

## Member Types

### Core Member Interface

```typescript
interface Member {
  id: string;                         // Unique member identifier
  email: string;                      // Member's email address
  verified: boolean;                  // Email verification status
  loginRedirectUrl?: string | null;   // Redirect URL after login
  customFields: Record<string, any>;  // Custom field data
  profileImage?: string | null;       // Profile image URL
  metaData: Record<string, any>;      // Internal metadata
  planConnections: PlanConnection[];  // Active plan subscriptions
  createdAt: string;                  // ISO timestamp
  updatedAt: string;                  // ISO timestamp
}

interface PlanConnection {
  id: string;                         // Connection identifier
  planId: string;                     // Reference to plan
  status: PlanConnectionStatus;       // Connection status
  createdAt: string;                  // When connection was created
  updatedAt: string;                  // Last status change
  cancelledAt?: string | null;        // When cancelled (if applicable)
  pausedAt?: string | null;          // When paused (if applicable)
}

type PlanConnectionStatus = 
  | 'ACTIVE'                         // Currently active subscription
  | 'CANCELLED'                      // Cancelled subscription
  | 'PAST_DUE'                      // Payment failed
  | 'TRIALING'                      // In trial period
  | 'PAUSED';                       // Temporarily paused
```

### Member Management Parameters

```typescript
interface UpdateMemberParams {
  customFields?: Record<string, any>; // Only custom fields can be updated
}

interface UpdateMemberAuthParams {
  email?: string;                     // New email address
  oldPassword?: string;               // Current password (required for changes)
  newPassword?: string;               // New password
}

interface UpdateMemberProfileImageParams {
  profileImage: File;                 // Image file to upload
}

interface GetCurrentMemberParams {
  useCache?: boolean;                 // Use cached data vs fresh from server
}
```

### Member Response Types

```typescript
interface GetCurrentMemberPayload {
  data: Member | null;                // null if no member authenticated
}

interface UpdateMemberPayload {
  data: Member;                       // Updated member object
}

interface UpdateMemberAuthPayload {
  data: Member;                       // Member with updated auth info
}

interface UpdateMemberProfileImagePayload {
  data: {
    profileImage: string;             // New profile image URL
  };
}

interface DeleteMemberPayload {
  data: {
    success: boolean;
    deletedMemberId: string;
  };
}
```

## Plan Management Types

### Plan Interface

```typescript
interface Plan {
  id: string;                         // Unique plan identifier
  name: string;                       // Plan name
  description: string;                // Plan description
  type: PlanType;                     // Plan type
  prices: Price[];                    // Available pricing options
  features?: string[];                // List of plan features
  status: PlanStatus;                 // Plan availability status
  createdAt: string;
  updatedAt: string;
}

type PlanType = 'FREE' | 'PAID';

type PlanStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

interface Price {
  id: string;                         // Stripe price ID
  amount: number;                     // Price in cents (e.g., 999 = $9.99)
  currency: string;                   // Currency code (e.g., 'usd')
  interval: PriceInterval;            // Billing interval
  intervalCount: number;              // Interval multiplier (e.g., 2 = every 2 months)
  trialPeriodDays?: number;          // Trial period length
}

type PriceInterval = 'day' | 'week' | 'month' | 'year' | 'one_time';
```

### Plan Management Parameters

```typescript
interface AddPlanParams {
  planId: string;                     // Plan ID to add (free plans only)
}

interface RemovePlanParams {
  planId: string;                     // Plan ID to remove
}

interface GetPlanParams {
  planId: string;                     // Plan ID to retrieve
}

interface PurchasePlansWithCheckoutParams {
  priceId: string;                    // Stripe price ID (required)
  couponId?: string;                  // Stripe coupon code
  successUrl?: string;                // Redirect after successful payment
  cancelUrl?: string;                 // Redirect if payment cancelled
  autoRedirect?: boolean;             // Auto-redirect to checkout (default: true)
  metadataForCheckout?: object;       // Additional checkout metadata
}

interface LaunchStripeCustomerPortalParams {
  returnUrl?: string;                 // URL to return after portal session
  autoRedirect?: boolean;             // Auto-redirect to portal (default: true)
  priceIds?: string[];                // Specific prices to allow in portal
  configuration?: object;             // Stripe portal configuration
}
```

### Plan Response Types

```typescript
interface GetPlansPayload {
  data: Plan[];                       // Array of available plans
}

interface GetPlanPayload {
  data: Plan;                         // Single plan object
}

interface AddPlanPayload {
  data: {
    planConnection: PlanConnection;   // Created plan connection
  };
}

interface RemovePlanPayload {
  data: {
    success: boolean;
    message: string;
  };
}

interface PurchasePlansWithCheckoutPayload {
  data: {
    url: string;                      // Stripe checkout URL
  };
}

interface LaunchStripeCustomerPortalPayload {
  data: {
    url: string;                      // Stripe portal URL
  };
}
```

## UI Component Types

### Modal Types

```typescript
type ModalType = 
  | 'LOGIN'                           // Email/password login modal
  | 'SIGNUP'                         // Account creation modal
  | 'FORGOT_PASSWORD'                // Password reset request modal
  | 'RESET_PASSWORD'                 // Password reset completion modal
  | 'PROFILE';                       // Member profile management modal

interface OpenModalParams {
  type: ModalType;
  translations?: MemberstackTranslations;
  [key: string]: any;                // Additional modal options
}

interface MemberstackTranslations {
  login?: {
    title?: string;
    emailPlaceholder?: string;
    passwordPlaceholder?: string;
    submitButton?: string;
    forgotPasswordLink?: string;
    signupLink?: string;
    socialLoginText?: string;
    errorMessages?: Record<string, string>;
  };
  signup?: {
    title?: string;
    emailPlaceholder?: string;
    passwordPlaceholder?: string;
    confirmPasswordPlaceholder?: string;
    submitButton?: string;
    loginLink?: string;
    termsText?: string;
    errorMessages?: Record<string, string>;
  };
  profile?: {
    title?: string;
    saveButton?: string;
    cancelButton?: string;
    sections?: {
      personalInfo?: string;
      security?: string;
      billing?: string;
    };
  };
  forgotPassword?: {
    title?: string;
    emailPlaceholder?: string;
    submitButton?: string;
    backToLoginLink?: string;
    successMessage?: string;
  };
  resetPassword?: {
    title?: string;
    passwordPlaceholder?: string;
    confirmPasswordPlaceholder?: string;
    submitButton?: string;
    successMessage?: string;
  };
}
```

## Advanced Feature Types

### Secure Content Types

```typescript
interface GetSecureContentParams {
  contentId: string;                  // Unique content identifier
}

interface GetSecureContentPayload {
  data: {
    id: string;
    content: string;                  // The actual content
    contentType: ContentType;         // Format of the content
    accessLevel: string;              // Required access level
    metadata?: Record<string, any>;   // Additional content metadata
  };
}

type ContentType = 'HTML' | 'TEXT' | 'JSON' | 'MARKDOWN';
```

### Comments System Types

```typescript
interface GetPostsParams {
  channelKey: string;                 // Comment channel identifier
  order?: 'newest' | 'oldest';       // Sort order (default: 'newest')
  after?: string;                     // Pagination cursor
  limit?: number;                     // Max posts to return (default: 10)
}

interface CreatePostParams {
  channelKey: string;                 // Channel to post in
  content: string;                    // Post content
}

interface UpdatePostParams {
  postId: string;                     // Post to update
  content: string;                    // New content
}

interface DeletePostParams {
  postId: string;                     // Post to delete
}

interface PostVoteParams {
  postId: string;                     // Post to vote on
  vote: 'UP' | 'DOWN' | 'NONE';      // Vote type
}

interface GetThreadsParams {
  postId: string;                     // Parent post ID
  order?: 'newest' | 'oldest';       // Sort order
  after?: string;                     // Pagination cursor
  limit?: number;                     // Max threads to return
}

interface CreateThreadParams {
  postId: string;                     // Parent post ID
  content: string;                    // Thread content
}

interface UpdateThreadParams {
  threadId: string;                   // Thread to update
  content: string;                    // New content
}

interface DeleteThreadParams {
  threadId: string;                   // Thread to delete
}

interface ThreadVoteParams {
  threadId: string;                   // Thread to vote on
  vote: 'UP' | 'DOWN' | 'NONE';      // Vote type
}
```

### Comments Response Types

```typescript
interface Post {
  id: string;                         // Unique post identifier
  channelKey: string;                 // Channel this post belongs to
  content: string;                    // Post content
  author: {
    id: string;
    name: string;
    email: string;
    profileImage?: string;
  };
  createdAt: string;                  // ISO timestamp
  updatedAt: string;                  // ISO timestamp
  upvotes: number;                    // Number of upvotes
  downvotes: number;                  // Number of downvotes
  userVote?: 'UP' | 'DOWN';          // Current user's vote
  threadCount: number;                // Number of replies
  isPinned: boolean;                  // Whether post is pinned
  isEdited: boolean;                  // Whether post has been edited
}

interface Thread {
  id: string;                         // Unique thread identifier
  postId: string;                     // Parent post ID
  content: string;                    // Thread content
  author: {
    id: string;
    name: string;
    email: string;
    profileImage?: string;
  };
  createdAt: string;                  // ISO timestamp
  updatedAt: string;                  // ISO timestamp
  upvotes: number;                    // Number of upvotes
  downvotes: number;                  // Number of downvotes
  userVote?: 'UP' | 'DOWN';          // Current user's vote
  isEdited: boolean;                  // Whether thread has been edited
}

interface GetPostsPayload {
  data: {
    posts: Post[];                    // Array of posts
    hasNextPage: boolean;             // Whether more posts are available
    nextCursor?: string;              // Cursor for next page
    totalCount: number;               // Total number of posts
  };
}

interface GetThreadsPayload {
  data: {
    threads: Thread[];                // Array of threads
    hasNextPage: boolean;             // Whether more threads are available
    nextCursor?: string;              // Cursor for next page
    totalCount: number;               // Total number of threads
  };
}

interface CreatePostPayload {
  data: Post;                         // Created post object
}

interface CreateThreadPayload {
  data: Thread;                       // Created thread object
}

interface UpdatePostPayload {
  data: Post;                         // Updated post object
}

interface UpdateThreadPayload {
  data: Thread;                       // Updated thread object
}
```

### Team Management Types

```typescript
interface JoinTeamParams {
  inviteToken: string;                // Team invitation token
}

interface GetTeamParams {
  teamId: string;                     // Team identifier
}

interface GenerateInviteTokenParams {
  teamId: string;                     // Team to generate invite for
}

interface RemoveMemberFromTeamParams {
  teamId: string;                     // Team identifier
  memberId: string;                   // Member to remove
}

interface Team {
  id: string;                         // Unique team identifier
  name: string;                       // Team name
  description?: string;               // Team description
  memberCount: number;                // Number of team members
  maxMembers?: number;                // Maximum allowed members
  ownerId: string;                    // Team owner's member ID
  createdAt: string;                  // ISO timestamp
  updatedAt: string;                  // ISO timestamp
}

interface GetTeamPayload {
  data: Team;                         // Team object
}

interface GenerateInviteTokenPayload {
  data: {
    token: string;                    // Generated invite token
    expiresAt: string;                // Token expiration time
    maxUses?: number;                 // Maximum number of uses
  };
}
```

## Email & Journey Types

### Email Verification Types

```typescript
interface SendMemberVerificationEmailPayload {
  data: {
    success: boolean;
    message: string;
  };
}
```

### Password Reset Types

```typescript
interface SendMemberResetPasswordEmailParams {
  email: string;                      // Email to send reset link to
}

interface ResetMemberPasswordParams {
  token: string;                      // Reset token from email
  newPassword: string;                // New password
}

interface SendMemberResetPasswordEmailPayload {
  data: string;                       // Success message
}

interface ResetMemberPasswordPayload {
  data: {
    success: boolean;
    message: string;
  };
}
```

### Passwordless Authentication Types

```typescript
interface SendMemberLoginPasswordlessEmailParams {
  email: string;                      // Email to send magic link to
}

interface SendMemberLoginPasswordlessEmailPayload {
  data: {
    success: boolean;
  };
}
```

## Event & Analytics Types

```typescript
interface EventParams {
  data: {
    eventName: string;                // Event identifier
    properties: Record<string, any>;  // Event properties
    timestamp?: string;               // Event timestamp (auto-generated if omitted)
    sessionId?: string;               // Session identifier
    userId?: string;                  // User identifier
  };
}
```

## Error Types

```typescript
interface MemberstackError extends Error {
  code: string;                       // Error code identifier
  message: string;                    // Human-readable error message
  details?: any;                      // Additional error details
  statusCode?: number;                // HTTP status code
}

// Common error codes
type AuthErrorCode = 
  | 'INVALID_CREDENTIALS'             // Wrong email/password
  | 'MEMBER_NOT_VERIFIED'            // Email not verified
  | 'ACCOUNT_LOCKED'                 // Too many failed attempts
  | 'INVALID_TOKEN'                  // Invalid auth token
  | 'TOKEN_EXPIRED'                  // Expired token
  | 'EMAIL_ALREADY_EXISTS'           // Email in use during signup
  | 'WEAK_PASSWORD';                 // Password doesn't meet requirements

type PlanErrorCode = 
  | 'PLAN_NOT_FOUND'                 // Plan doesn't exist
  | 'PLAN_NOT_FREE'                  // Tried to add paid plan with addPlan()
  | 'PLAN_ALREADY_ACTIVE'            // Member already has this plan
  | 'INSUFFICIENT_ACCESS'            // Member doesn't have required plan
  | 'PAYMENT_REQUIRED';              // Payment needed for plan

type ContentErrorCode = 
  | 'CONTENT_NOT_FOUND'              // Secure content doesn't exist
  | 'INSUFFICIENT_ACCESS'            // Member lacks required plan
  | 'CONTENT_EXPIRED';               // Content no longer available

type TeamErrorCode = 
  | 'TEAM_NOT_FOUND'                 // Team doesn't exist
  | 'INVALID_INVITE_TOKEN'           // Invalid invitation token
  | 'INVITE_EXPIRED'                 // Invitation has expired
  | 'ALREADY_MEMBER'                 // Already a team member
  | 'TEAM_FULL';                     // Team has reached member limit
```

## Authentication State Types

```typescript
interface AuthChangeCallback {
  (params: { member: Member | null }): void;
}

interface MemberstackOptions {
  token?: string;                     // Override auth token
}
```

## Utility Types

```typescript
// Generic API response wrapper
interface Response<T> {
  data: T;
}

// Paginated response wrapper
interface PaginatedResponse<T> {
  data: T[];
  hasNext: boolean;
  endCursor: string | null;
  totalCount: number;
}

// HTTP method types
enum HttpMethod {
  POST = 'POST',
  GET = 'GET', 
  PATCH = 'PATCH',
  DELETE = 'DELETE'
}

// HTTP headers
enum HttpHeaders {
  AUTHORIZATION = 'Authorization',
  API_KEY = 'X-API-Key',
  APP_ID = 'X-APP-ID',
  API_VERSION = 'X-API-Version',
  USER_AGENT = 'X-User-Agent',
  SESSION_ID = 'X-Session-ID'
}
```

## Complete TypeScript Usage Example

```typescript
import MemberstackDom from '@memberstack/dom';
import type {
  DOMConfig,
  Member,
  LoginMemberEmailPasswordParams,
  SignupMemberEmailPasswordParams,
  MemberstackError,
  AuthChangeCallback
} from '@memberstack/dom';

class TypedMemberstackManager {
  private memberstack: any;
  private currentMember: Member | null = null;
  
  constructor(config: DOMConfig) {
    this.memberstack = MemberstackDom.init(config);
    this.setupAuthListener();
  }
  
  private setupAuthListener(): void {
    const authCallback: AuthChangeCallback = ({ member }) => {
      this.currentMember = member;
      this.handleAuthStateChange(member);
    };
    
    this.memberstack.onAuthChange(authCallback);
  }
  
  private handleAuthStateChange(member: Member | null): void {
    if (member) {
      console.log('Member logged in:', member.email);
      this.updateUIForAuthenticatedUser(member);
    } else {
      console.log('Member logged out');
      this.updateUIForAnonymousUser();
    }
  }
  
  async login(params: LoginMemberEmailPasswordParams): Promise<Member> {
    try {
      const result = await this.memberstack.loginMemberEmailPassword(params);
      return result.data.member;
    } catch (error) {
      const memberstackError = error as MemberstackError;
      
      switch (memberstackError.code) {
        case 'INVALID_CREDENTIALS':
          throw new Error('Invalid email or password');
        case 'MEMBER_NOT_VERIFIED':
          throw new Error('Please verify your email first');
        default:
          throw new Error('Login failed');
      }
    }
  }
  
  async signup(params: SignupMemberEmailPasswordParams): Promise<Member> {
    try {
      const result = await this.memberstack.signupMemberEmailPassword(params);
      return result.data.member;
    } catch (error) {
      const memberstackError = error as MemberstackError;
      
      switch (memberstackError.code) {
        case 'EMAIL_ALREADY_EXISTS':
          throw new Error('An account with this email already exists');
        case 'WEAK_PASSWORD':
          throw new Error('Password is too weak');
        default:
          throw new Error('Signup failed');
      }
    }
  }
  
  async getCurrentMember(useCache: boolean = false): Promise<Member | null> {
    try {
      const result = await this.memberstack.getCurrentMember({ useCache });
      return result.data;
    } catch (error) {
      console.error('Failed to get current member:', error);
      return null;
    }
  }
  
  private updateUIForAuthenticatedUser(member: Member): void {
    // Type-safe UI updates
    const nameElement = document.getElementById('member-name');
    if (nameElement) {
      nameElement.textContent = member.customFields?.firstName || member.email;
    }
    
    // Show/hide elements based on plan status
    const hasPaidPlan = member.planConnections.some(
      (connection): boolean => connection.status === 'ACTIVE'
    );
    
    this.toggleElements('[data-requires-paid-plan]', hasPaidPlan);
    this.toggleElements('[data-auth="logged-in"]', true);
    this.toggleElements('[data-auth="logged-out"]', false);
  }
  
  private updateUIForAnonymousUser(): void {
    this.toggleElements('[data-auth="logged-in"]', false);
    this.toggleElements('[data-auth="logged-out"]', true);
    this.toggleElements('[data-requires-paid-plan]', false);
  }
  
  private toggleElements(selector: string, show: boolean): void {
    document.querySelectorAll(selector).forEach((element: Element) => {
      (element as HTMLElement).style.display = show ? 'block' : 'none';
    });
  }
}

// Usage
const config: DOMConfig = {
  publicKey: 'pk_sb_your-key-here',
  useCookies: true
};

const memberstackManager = new TypedMemberstackManager(config);

// Type-safe method calls
async function handleLogin(email: string, password: string): Promise<void> {
  try {
    const member = await memberstackManager.login({ email, password });
    console.log('Logged in as:', member.email);
  } catch (error) {
    console.error('Login error:', error.message);
  }
}
```

## Next Steps

- **[09-error-handling.md](09-error-handling.md)** - Complete error handling guide
- **[10-examples.md](10-examples.md)** - Real-world TypeScript examples
- **[02-authentication.md](02-authentication.md)** - Authentication implementation with types