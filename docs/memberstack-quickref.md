# Memberstack DOM Quick Reference

## Initialization
```javascript
import memberstack from '@memberstack/dom';
const ms = memberstack.init({ publicKey: 'pk_...' });
```

## Most Common Methods

### Authentication (8 methods)

#### `loginMemberEmailPassword({ email, password })`
Returns: `Promise<LoginMemberEmailPasswordPayload>`
```javascript
const result = await memberstack.loginMemberEmailPassword({
  email: "user@example.com",
  password: "securePassword123"
});
```

#### `signupMemberEmailPassword({ email, password, customFields?, metaData?, plans? })`
Returns: `Promise<SignupMemberEmailPasswordPayload>`
```javascript
const result = await memberstack.signupMemberEmailPassword({
  email: "newuser@example.com",
  password: "securePassword123",
  customFields: { firstName: "John", lastName: "Doe" }
});
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

#### `purchasePlansWithCheckout({ priceIds, successUrl?, cancelUrl? })`
Returns: `Promise<PurchasePlanPayload>`
```javascript
await memberstack.purchasePlansWithCheckout({
  priceIds: ["pri_abc123"],
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

## Complete Documentation

For all 36+ methods and detailed parameters, see:
- Full reference: `.memberstack/complete.md`
- Search index: `.memberstack/index.json`