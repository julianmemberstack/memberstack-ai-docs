# Memberstack DOM Quick Reference

🚨 **Critical Security Warning**: The DOM package alone provides **NO SECURITY** - it's for user experience only. For production applications, you MUST implement server-side validation.

**🟢 For Production Security**: See [12-server-side-authentication.md](12-server-side-authentication.md)

## Initialization
```javascript
import memberstack from '@memberstack/dom';
const ms = memberstack.init({ publicKey: 'pk_...' });
```

## Most Common Methods

⚠️ **All methods below are client-side only and can be bypassed.** Use server-side validation for production.

### Authentication (8 methods) - 🔴 Client-Side UX Only

#### 🔴 `loginMemberEmailPassword({ email, password })`
Returns: `Promise<LoginMemberEmailPasswordPayload>`
```javascript
// 🔴 UX only - can be bypassed
const result = await memberstack.loginMemberEmailPassword({
  email: "user@example.com",
  password: "securePassword123"
});
// 🟢 For production: Validate server-side after login
```

#### 🔴 `signupMemberEmailPassword({ email, password, customFields?, metaData?, plans? })`
Returns: `Promise<SignupMemberEmailPasswordPayload>`
```javascript
// 🔴 UX only - can be bypassed
const result = await memberstack.signupMemberEmailPassword({
  email: "newuser@example.com",
  password: "securePassword123",
  customFields: { firstName: "John", lastName: "Doe" }
});
// 🟢 For production: Validate server-side after signup
```

#### `logout()`
Returns: `Promise<void>`
```javascript
await memberstack.logout();
```

#### `getCurrentMember()`
Returns: `Promise<{ data: Member | null }>`
```javascript
const { data: member } = await memberstack.getCurrentMember();
if (member) {
  console.log('Logged in as:', member.auth.email);
}
```

#### `onAuthChange(callback)`
Returns: `() => void` (unsubscribe function)
```javascript
const unsubscribe = memberstack.onAuthChange((member) => {
  if (member) {
    console.log('Member logged in:', member.auth.email);
  } else {
    console.log('Member logged out');
  }
});
```

#### `sendMemberResetPasswordEmail({ email })`
Returns: `Promise<SendMemberResetPasswordEmailPayload>`
```javascript
await memberstack.sendMemberResetPasswordEmail({
  email: "user@example.com"
});
```

#### `loginWithProvider({ provider })`
Returns: `Promise<void>`
```javascript
await memberstack.loginWithProvider({ provider: 'google' });
```

#### `sendMemberLoginPasswordlessEmail({ email })`
Returns: `Promise<SendMemberLoginPasswordlessEmailPayload>`
```javascript
await memberstack.sendMemberLoginPasswordlessEmail({
  email: "user@example.com"
});
```

### Member Management (7 methods)

#### `updateMember({ customFields?, metaData? })`
Returns: `Promise<UpdateMemberPayload>`
```javascript
await memberstack.updateMember({
  customFields: {
    firstName: "Jane",
    lastName: "Smith",
    phoneNumber: "+1234567890"
  }
});
```

#### `updateMemberAuth({ email?, oldPassword?, newPassword? })`
Returns: `Promise<UpdateMemberAuthPayload>`
```javascript
await memberstack.updateMemberAuth({
  email: "newemail@example.com",
  oldPassword: "currentPassword",
  newPassword: "newSecurePassword"
});
```

#### `getMemberJSON()`
Returns: `Promise<object>`
```javascript
const memberData = await memberstack.getMemberJSON();
```

#### `updateMemberJSON(json)`
Returns: `Promise<UpdateMemberJSONPayload>`
```javascript
await memberstack.updateMemberJSON({
  preferences: { theme: "dark", notifications: true }
});
```

#### `updateMemberProfileImage({ image })`
Returns: `Promise<UpdateProfileImagePayload>`
```javascript
const fileInput = document.getElementById('profile-pic');
await memberstack.updateMemberProfileImage({
  image: fileInput.files[0]
});
```

#### `deleteMember()`
Returns: `Promise<DeleteMemberPayload>`
```javascript
if (confirm('Delete your account?')) {
  await memberstack.deleteMember();
}
```

#### `sendMemberVerificationEmail()`
Returns: `Promise<SendMemberVerificationEmailPayload>`
```javascript
await memberstack.sendMemberVerificationEmail();
```

### Plans & Billing (6 methods)

#### `getPlans()`
Returns: `Promise<{ data: Plan[] }>`
```javascript
const { data: plans } = await memberstack.getPlans();
plans.forEach(plan => {
  console.log(plan.name, plan.prices);
});
```

#### `getPlan({ planId })`
Returns: `Promise<{ data: Plan }>`
```javascript
const { data: plan } = await memberstack.getPlan({
  planId: "pln_abc123"
});
```

#### `purchasePlansWithCheckout({ priceId, successUrl?, cancelUrl? })`
Returns: `Promise<PurchasePlanPayload>`
```javascript
await memberstack.purchasePlansWithCheckout({
  priceId: "prc_your_price_id_here",
  successUrl: window.location.origin + "/success",
  cancelUrl: window.location.origin + "/pricing"
});
```

#### `launchStripeCustomerPortal({ returnUrl? })`
Returns: `Promise<LaunchStripePortalPayload>`
```javascript
await memberstack.launchStripeCustomerPortal({
  returnUrl: window.location.href
});
```

#### `addPlan({ planId })`
Returns: `Promise<AddPlanPayload>`
```javascript
await memberstack.addPlan({ planId: "pln_free_tier" });
```

#### `removePlan({ planId })`
Returns: `Promise<RemovePlanPayload>`
```javascript
await memberstack.removePlan({ planId: "pln_abc123" });
```

### UI Components (2 methods)

#### `openModal({ type })`
Returns: `Promise<void>`
```javascript
// Open login modal
await memberstack.openModal({ type: 'LOGIN' });

// Open signup modal
await memberstack.openModal({ type: 'SIGNUP' });

// Open profile modal
await memberstack.openModal({ type: 'PROFILE' });
```

#### `hideModal()`
Returns: `void`
```javascript
memberstack.hideModal();
```

### Advanced Features (5 methods)

#### `getSecureContent({ contentId })`
Returns: `Promise<SecureContentPayload>`
```javascript
const content = await memberstack.getSecureContent({
  contentId: "content_abc123"
});
```

#### `joinTeam({ inviteToken })`
Returns: `Promise<JoinTeamPayload>`
```javascript
await memberstack.joinTeam({
  inviteToken: "inv_xyz789"
});
```

#### `getTeam()`
Returns: `Promise<{ data: Team }>`
```javascript
const { data: team } = await memberstack.getTeam();
```

#### `generateInviteToken({ teamId })`
Returns: `Promise<{ token: string }>`
```javascript
const { token } = await memberstack.generateInviteToken({
  teamId: "team_abc123"
});
```

#### `removeMemberFromTeam({ memberId, teamId })`
Returns: `Promise<RemoveMemberPayload>`
```javascript
await memberstack.removeMemberFromTeam({
  memberId: "mem_xyz789",
  teamId: "team_abc123"
});
```

## Plan Detection & Content Gating

### Check if user has specific paid plan
```javascript
// Check using payment.priceId (for paid plans)
const hasPremiumPlan = member?.planConnections?.some(planConnection =>
  planConnection.payment?.priceId === 'prc_your_price_id_here' &&
  planConnection.status === 'ACTIVE'
) || false;

// Check using planId (for free plans)
const hasFreePlan = member?.planConnections?.some(planConnection =>
  planConnection.planId === 'pln_your_plan_id_here' &&
  planConnection.status === 'ACTIVE'
) || false;
```

### Content gating example
```javascript
async function gateContent() {
  const { data: member } = await memberstack.getCurrentMember();
  
  const hasPremiumAccess = member?.planConnections?.some(pc =>
    pc.payment?.priceId === 'prc_premium_monthly' &&
    pc.status === 'ACTIVE'
  );
  
  if (hasPremiumAccess) {
    document.getElementById('premium-content').style.display = 'block';
  } else {
    document.getElementById('upgrade-prompt').style.display = 'block';
  }
}
```

## Error Handling Pattern

Always wrap Memberstack calls in try/catch blocks:

```javascript
try {
  const { data: member } = await memberstack.getCurrentMember();
  // Handle success
} catch (error) {
  if (error.code === 'INVALID_CREDENTIALS') {
    // Handle invalid login
  } else if (error.code === 'NETWORK_ERROR') {
    // Handle network issues
  } else {
    // Handle other errors
  }
}
```

## Data Tables

### Query Records with Filtering
```javascript
const { data } = await memberstack.queryDataRecords({
  table: "products",
  query: {
    where: { 
      category: "electronics",
      price: { lte: 1000 }
    },
    orderBy: { price: "asc" },
    take: 10
  }
});
```

### Create Record
```javascript
const newRecord = await memberstack.createDataRecord({
  table: "products",
  data: {
    name: "iPhone 15",
    price: 999,
    inStock: true
  }
});
```

### Update Record with Like/Bookmark
```javascript
// Add like (member reference)
await memberstack.updateDataRecord({
  recordId: "post_123",
  data: {
    likedBy: {
      connect: { self: true }  // Like the post
    }
  }
});

// Regular field update
await memberstack.updateDataRecord({
  recordId: "prod_123",
  data: {
    price: 899,
    inStock: false
  }
});
```

## 🛡️ Production Security (Required)

### Server-Side Authentication Setup
```bash
# Install both packages
npm install @memberstack/dom @memberstack/admin
```

### Environment Variables
```bash
# Client-side (safe to expose)
NEXT_PUBLIC_MEMBERSTACK_PUBLIC_KEY=pk_live_...

# Server-side (NEVER expose to client)
MEMBERSTACK_SECRET_KEY=sk_live_...
MEMBERSTACK_APP_ID=app_...
```

### 🟢 Server-Side Token Validation
```typescript
import memberstackAdmin from '@memberstack/admin'

const memberstack = memberstackAdmin.init(process.env.MEMBERSTACK_SECRET_KEY!)

export async function validateToken(token: string) {
  try {
    const tokenData = await memberstack.verifyToken({
      token,
      audience: process.env.MEMBERSTACK_APP_ID
    })
    return { isValid: true, memberId: tokenData.id }
  } catch {
    return { isValid: false }
  }
}
```

### 🟢 Protected API Route
```typescript
// app/api/premium-content/route.ts
export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')

  const { isValid } = await validateToken(token)
  if (!isValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({ data: 'Protected content' })
}
```

### Security Checklist
- [ ] Server-side token validation on all protected routes
- [ ] Plan status verification server-side
- [ ] Secret keys never exposed to client
- [ ] Rate limiting on auth endpoints

## Complete Documentation

For all 57 methods and detailed parameters, see:
- **🛡️ Security Guide**: [12-server-side-authentication.md](12-server-side-authentication.md)
- **🛡️ Security Best Practices**: [13-security-considerations.md](13-security-considerations.md)
- Full reference: `.memberstack/complete.md`
- Search index: `.memberstack/index.json`