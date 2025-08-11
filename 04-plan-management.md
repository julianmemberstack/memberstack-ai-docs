# Memberstack DOM - Plan Management

## AI Assistant Instructions
When implementing plan management:
- Use `getPlans()` to display available subscription options
- Use `addPlan()` only for free plans - paid plans require checkout
- Use `purchasePlansWithCheckout()` for all paid plan purchases
- Include `autoRedirect: false` to get checkout URL without redirecting
- Use `launchStripeCustomerPortal()` for subscription management
- Handle plan connections and status in member data

## Overview

Plan management in Memberstack DOM handles subscription plans, billing, and member plan assignments. This includes retrieving available plans, purchasing subscriptions, and managing existing plan connections.

## Retrieving Plan Information

### getPlans()
Get all available plans for your Memberstack application.

**Method Signature:**
```typescript
await memberstack.getPlans(): Promise<GetPlansPayload>
```

**Response:**
```typescript
{
  data: Array<{
    id: string;
    name: string;
    description: string;
    type: "FREE" | "PAID";
    prices: Array<{
      id: string;
      amount: number; // Amount in cents
      currency: string;
      interval: "month" | "year" | "one_time";
      intervalCount: number;
    }>;
    features: Array<string>;
    // ... additional plan properties
  }>
}
```

**Examples:**

Display Available Plans:
```javascript
async function loadPricingPlans() {
  try {
    const result = await memberstack.getPlans();
    const plans = result.data;
    
    console.log(`Found ${plans.length} plans`);
    
    displayPlans(plans);
    return plans;
  } catch (error) {
    console.error('Failed to load plans:', error);
    document.getElementById('plans-error').style.display = 'block';
    return [];
  }
}

function displayPlans(plans) {
  const container = document.getElementById('pricing-plans');
  
  container.innerHTML = plans.map(plan => `
    <div class="plan-card ${plan.type.toLowerCase()}" data-plan-id="${plan.id}">
      <h3>${plan.name}</h3>
      <p class="plan-description">${plan.description}</p>
      
      <div class="plan-pricing">
        ${plan.prices.map(price => `
          <div class="price-option" data-price-id="${price.id}">
            <span class="amount">$${(price.amount / 100).toFixed(2)}</span>
            <span class="interval">/${price.interval}</span>
          </div>
        `).join('')}
      </div>
      
      <div class="plan-features">
        ${plan.features ? plan.features.map(feature => `
          <div class="feature">✓ ${feature}</div>
        `).join('') : ''}
      </div>
      
      <button class="select-plan-btn" 
              data-plan-id="${plan.id}" 
              data-plan-type="${plan.type}">
        ${plan.type === 'FREE' ? 'Select Plan' : 'Subscribe'}
      </button>
    </div>
  `).join('');
  
  // Add event listeners
  container.querySelectorAll('.select-plan-btn').forEach(btn => {
    btn.addEventListener('click', handlePlanSelection);
  });
}

async function handlePlanSelection(event) {
  const planId = event.target.dataset.planId;
  const planType = event.target.dataset.planType;
  
  if (planType === 'FREE') {
    await selectFreePlan(planId);
  } else {
    // For paid plans, need to get price ID
    const priceId = event.target.closest('.plan-card')
                         .querySelector('.price-option').dataset.priceId;
    await purchasePaidPlan(priceId);
  }
}
```

Filter Plans by Type:
```javascript
async function getFreePlans() {
  try {
    const result = await memberstack.getPlans();
    const freePlans = result.data.filter(plan => plan.type === 'FREE');
    
    console.log('Free plans available:', freePlans.length);
    return freePlans;
  } catch (error) {
    console.error('Failed to get free plans:', error);
    return [];
  }
}

async function getPaidPlans() {
  try {
    const result = await memberstack.getPlans();
    const paidPlans = result.data.filter(plan => plan.type === 'PAID');
    
    console.log('Paid plans available:', paidPlans.length);
    return paidPlans;
  } catch (error) {
    console.error('Failed to get paid plans:', error);
    return [];
  }
}
```

### getPlan()
Get details for a specific plan by ID.

**Method Signature:**
```typescript
await memberstack.getPlan({
  planId: string;
}): Promise<GetPlanPayload>
```

**Example:**
```javascript
async function getPlanDetails(planId) {
  try {
    const result = await memberstack.getPlan({ planId });
    console.log('Plan details:', result.data);
    return result.data;
  } catch (error) {
    console.error('Failed to get plan details:', error);
    return null;
  }
}

// Display single plan details
async function showPlanModal(planId) {
  const plan = await getPlanDetails(planId);
  
  if (plan) {
    const modal = document.getElementById('plan-modal');
    modal.querySelector('.modal-title').textContent = plan.name;
    modal.querySelector('.modal-description').textContent = plan.description;
    modal.querySelector('.modal-price').textContent = 
      plan.prices ? `$${(plan.prices[0].amount / 100).toFixed(2)}/${plan.prices[0].interval}` : 'Free';
    
    modal.style.display = 'block';
  }
}
```

## Free Plan Management

### addPlan()
Add a free plan to the current member's account.

**Method Signature:**
```typescript
await memberstack.addPlan({
  planId: string;
}): Promise<AddPlanPayload>
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| planId | string | ✅ | ID of the free plan to add |

**Response:**
```typescript
{
  data: {
    planConnection: {
      id: string;
      planId: string;
      status: "ACTIVE";
      createdAt: string;
    }
  }
}
```

**Examples:**

Add Free Plan:
```javascript
async function selectFreePlan(planId) {
  try {
    // Check if member is authenticated
    const currentMember = await memberstack.getCurrentMember();
    if (!currentMember.data) {
      alert('Please log in to select a plan');
      window.location.href = '/login';
      return;
    }
    
    // Add the free plan
    const result = await memberstack.addPlan({ planId });
    
    console.log('Free plan added:', result.data.planConnection);
    
    // Show success message
    alert('Plan activated successfully!');
    
    // Refresh member data or redirect
    window.location.reload();
    
    return result.data.planConnection;
  } catch (error) {
    console.error('Failed to add free plan:', error);
    
    if (error.code === 'PLAN_NOT_FREE') {
      alert('This plan requires payment. Please use the purchase option.');
    } else if (error.code === 'PLAN_ALREADY_ACTIVE') {
      alert('You already have this plan activated.');
    } else {
      alert('Failed to activate plan. Please try again.');
    }
  }
}
```

Bulk Free Plan Assignment:
```javascript
async function assignMultipleFreePlans(planIds) {
  const results = [];
  
  for (const planId of planIds) {
    try {
      const result = await memberstack.addPlan({ planId });
      results.push({
        planId,
        success: true,
        connection: result.data.planConnection
      });
    } catch (error) {
      results.push({
        planId,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
}

// Usage
const freePlanIds = ['plan_free_starter', 'plan_free_community'];
const results = await assignMultipleFreePlans(freePlanIds);

results.forEach(result => {
  if (result.success) {
    console.log(`✅ Added plan ${result.planId}`);
  } else {
    console.log(`❌ Failed to add plan ${result.planId}: ${result.error}`);
  }
});
```

### removePlan()
Remove a plan from the current member's account.

**Method Signature:**
```typescript
await memberstack.removePlan({
  planId: string;
}): Promise<RemovePlanPayload>
```

**Example:**
```javascript
async function cancelPlan(planId, planName) {
  const confirmed = confirm(`Are you sure you want to cancel ${planName}?`);
  
  if (!confirmed) return;
  
  try {
    const result = await memberstack.removePlan({ planId });
    
    console.log('Plan removed:', result.data);
    alert('Plan cancelled successfully.');
    
    // Refresh the page to update UI
    window.location.reload();
  } catch (error) {
    console.error('Failed to remove plan:', error);
    alert('Failed to cancel plan. Please try again or contact support.');
  }
}

// Cancel button handler
document.querySelectorAll('.cancel-plan-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const planId = e.target.dataset.planId;
    const planName = e.target.dataset.planName;
    cancelPlan(planId, planName);
  });
});
```

## Paid Plan Management

### purchasePlansWithCheckout()
Create a Stripe checkout session for plan purchase.

**Method Signature:**
```typescript
await memberstack.purchasePlansWithCheckout({
  priceId: string;
  couponId?: string;
  successUrl?: string;
  cancelUrl?: string;
  autoRedirect?: boolean;
  metadataForCheckout?: object;
}): Promise<PurchasePlansWithCheckoutPayload>
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| priceId | string | ✅ | Stripe price ID for the plan |
| couponId | string | ❌ | Stripe coupon ID for discounts |
| successUrl | string | ❌ | URL to redirect after successful payment |
| cancelUrl | string | ❌ | URL to redirect if payment is cancelled |
| autoRedirect | boolean | ❌ | Auto-redirect to checkout (default: true) |
| metadataForCheckout | object | ❌ | Additional metadata for the checkout session |

**Response:**
```typescript
{
  data: {
    url: string; // Stripe checkout URL
  }
}
```

**Examples:**

Basic Checkout:
```javascript
async function purchasePlan(priceId, planName) {
  try {
    // Check if member is authenticated
    const currentMember = await memberstack.getCurrentMember();
    if (!currentMember.data) {
      // Redirect to signup with plan pre-selected
      window.location.href = `/signup?plan=${priceId}`;
      return;
    }
    
    // Create checkout session and redirect
    await memberstack.purchasePlansWithCheckout({
      priceId: priceId,
      successUrl: '/dashboard?purchase=success',
      cancelUrl: '/pricing?cancelled=true',
      metadataForCheckout: {
        planName: planName,
        source: 'pricing_page'
      }
    });
    
    // Will auto-redirect to Stripe checkout
  } catch (error) {
    console.error('Checkout failed:', error);
    alert('Failed to start checkout process. Please try again.');
  }
}

// Plan purchase button handler
document.querySelectorAll('.purchase-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const priceId = e.target.dataset.priceId;
    const planName = e.target.dataset.planName;
    purchasePlan(priceId, planName);
  });
});
```

Get Checkout URL Without Redirect:
```javascript
async function getCheckoutUrl(priceId, options = {}) {
  try {
    const result = await memberstack.purchasePlansWithCheckout({
      priceId: priceId,
      autoRedirect: false, // Don't auto-redirect
      successUrl: options.successUrl || '/dashboard',
      cancelUrl: options.cancelUrl || '/pricing',
      couponId: options.couponId,
      metadataForCheckout: options.metadata
    });
    
    console.log('Checkout URL:', result.data.url);
    return result.data.url;
  } catch (error) {
    console.error('Failed to create checkout session:', error);
    throw error;
  }
}

// Usage examples
async function handleCustomCheckout() {
  try {
    const checkoutUrl = await getCheckoutUrl('price_1234567890', {
      couponId: 'discount_code_123',
      metadata: { source: 'custom_flow' }
    });
    
    // Open in new tab
    window.open(checkoutUrl, '_blank');
    
    // Or show in modal
    showCheckoutModal(checkoutUrl);
  } catch (error) {
    alert('Failed to create checkout session');
  }
}
```

Checkout with Coupon:
```javascript
async function purchaseWithDiscount(priceId, couponCode) {
  try {
    await memberstack.purchasePlansWithCheckout({
      priceId: priceId,
      couponId: couponCode,
      successUrl: '/dashboard?discount=applied',
      cancelUrl: '/pricing',
      metadataForCheckout: {
        couponApplied: couponCode,
        discountSource: 'promotional_campaign'
      }
    });
  } catch (error) {
    if (error.code === 'INVALID_COUPON') {
      alert('Invalid coupon code. Please try again.');
    } else {
      alert('Checkout failed. Please try again.');
    }
  }
}

// Coupon form handler
document.getElementById('coupon-form').addEventListener('submit', (e) => {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const priceId = formData.get('priceId');
  const couponCode = formData.get('couponCode');
  
  purchaseWithDiscount(priceId, couponCode);
});
```

## Customer Portal & Billing Management

### launchStripeCustomerPortal()
Launch the Stripe Customer Portal for subscription management.

**Method Signature:**
```typescript
await memberstack.launchStripeCustomerPortal({
  returnUrl?: string;
  autoRedirect?: boolean;
  priceIds?: string[];
  configuration?: object;
}): Promise<LaunchStripeCustomerPortalPayload>
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| returnUrl | string | ❌ | URL to return to after portal session |
| autoRedirect | boolean | ❌ | Auto-redirect to portal (default: true) |
| priceIds | string[] | ❌ | Specific prices to allow in portal |
| configuration | object | ❌ | Stripe portal configuration |

**Examples:**

Basic Customer Portal:
```javascript
async function openBillingPortal() {
  try {
    // Check if member has active subscriptions
    const member = await memberstack.getCurrentMember();
    if (!member.data || !member.data.planConnections?.length) {
      alert('No active subscriptions to manage');
      return;
    }
    
    // Launch customer portal
    await memberstack.launchStripeCustomerPortal({
      returnUrl: '/account/billing',
    });
    
    // Will auto-redirect to Stripe portal
  } catch (error) {
    console.error('Failed to open billing portal:', error);
    
    if (error.code === 'NO_STRIPE_CUSTOMER') {
      alert('No billing information found. Please contact support.');
    } else {
      alert('Unable to access billing portal. Please try again.');
    }
  }
}

// Billing portal button
document.getElementById('manage-billing-btn').addEventListener('click', openBillingPortal);
```

Get Portal URL Without Redirect:
```javascript
async function getBillingPortalUrl() {
  try {
    const result = await memberstack.launchStripeCustomerPortal({
      returnUrl: '/account/billing',
      autoRedirect: false
    });
    
    return result.data.url;
  } catch (error) {
    console.error('Failed to get portal URL:', error);
    return null;
  }
}

// Usage
async function showBillingOptions() {
  const portalUrl = await getBillingPortalUrl();
  
  if (portalUrl) {
    const modal = document.getElementById('billing-modal');
    modal.querySelector('.portal-link').href = portalUrl;
    modal.style.display = 'block';
  }
}
```

## Plan Status & Member Subscriptions

### Check Member Plan Status
```javascript
async function getMemberPlanStatus() {
  try {
    const member = await memberstack.getCurrentMember();
    
    if (!member.data) {
      return { authenticated: false, plans: [] };
    }
    
    const activePlans = member.data.planConnections
      ?.filter(connection => connection.status === 'ACTIVE')
      ?.map(connection => ({
        id: connection.id,
        planId: connection.planId,
        status: connection.status,
        createdAt: connection.createdAt,
        // Add plan details if needed
      })) || [];
    
    return {
      authenticated: true,
      member: member.data,
      plans: activePlans,
      hasPaidPlan: activePlans.some(plan => plan.type === 'PAID'),
      planCount: activePlans.length
    };
  } catch (error) {
    console.error('Failed to get plan status:', error);
    return { authenticated: false, plans: [], error: error.message };
  }
}

// Usage
async function displayMembershipStatus() {
  const status = await getMemberPlanStatus();
  
  const statusEl = document.getElementById('membership-status');
  
  if (!status.authenticated) {
    statusEl.innerHTML = '<p>Please log in to view your membership status.</p>';
    return;
  }
  
  if (status.plans.length === 0) {
    statusEl.innerHTML = `
      <div class="no-plans">
        <h3>No Active Plans</h3>
        <p>You don't have any active subscriptions.</p>
        <a href="/pricing" class="btn">View Plans</a>
      </div>
    `;
  } else {
    statusEl.innerHTML = `
      <div class="active-plans">
        <h3>Active Subscriptions (${status.plans.length})</h3>
        ${status.plans.map(plan => `
          <div class="plan-item">
            <span class="plan-id">${plan.planId}</span>
            <span class="plan-status ${plan.status.toLowerCase()}">${plan.status}</span>
            <span class="plan-date">Since ${new Date(plan.createdAt).toLocaleDateString()}</span>
          </div>
        `).join('')}
        
        <div class="plan-actions">
          <button onclick="openBillingPortal()" class="btn">Manage Billing</button>
        </div>
      </div>
    `;
  }
}
```

### Plan Access Control
```javascript
function checkPlanAccess(requiredPlanId, member) {
  if (!member || !member.planConnections) {
    return false;
  }
  
  return member.planConnections.some(connection => 
    connection.planId === requiredPlanId && connection.status === 'ACTIVE'
  );
}

function checkAnyPlanAccess(requiredPlanIds, member) {
  if (!member || !member.planConnections) {
    return false;
  }
  
  return requiredPlanIds.some(planId => 
    member.planConnections.some(connection =>
      connection.planId === planId && connection.status === 'ACTIVE'
    )
  );
}

// Usage in content gating
async function gatePremiumContent() {
  const member = await memberstack.getCurrentMember();
  
  if (!member.data) {
    // Show login prompt
    document.getElementById('login-prompt').style.display = 'block';
    return;
  }
  
  const hasProAccess = checkPlanAccess('plan_pro_monthly', member.data);
  const hasAnyPaidPlan = checkAnyPlanAccess(['plan_basic', 'plan_pro', 'plan_enterprise'], member.data);
  
  if (hasProAccess) {
    document.getElementById('pro-content').style.display = 'block';
  } else if (hasAnyPaidPlan) {
    document.getElementById('upgrade-prompt').style.display = 'block';
  } else {
    document.getElementById('subscription-prompt').style.display = 'block';
  }
}
```

## Complete Plan Management Example

```javascript
class PlanManager {
  constructor() {
    this.memberstack = window.$memberstackDom;
    this.currentMember = null;
    this.availablePlans = [];
    this.init();
  }
  
  async init() {
    try {
      await this.loadCurrentMember();
      await this.loadAvailablePlans();
      this.setupEventListeners();
      this.updateUI();
    } catch (error) {
      console.error('Failed to initialize plan manager:', error);
    }
  }
  
  async loadCurrentMember() {
    try {
      const result = await this.memberstack.getCurrentMember();
      this.currentMember = result.data;
    } catch (error) {
      console.error('Failed to load current member:', error);
    }
  }
  
  async loadAvailablePlans() {
    try {
      const result = await this.memberstack.getPlans();
      this.availablePlans = result.data;
    } catch (error) {
      console.error('Failed to load plans:', error);
      this.availablePlans = [];
    }
  }
  
  setupEventListeners() {
    // Plan selection buttons
    document.querySelectorAll('.select-plan-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.handlePlanSelection(e));
    });
    
    // Cancel plan buttons
    document.querySelectorAll('.cancel-plan-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.handlePlanCancellation(e));
    });
    
    // Billing portal button
    document.getElementById('billing-portal-btn')?.addEventListener('click', () => {
      this.openBillingPortal();
    });
  }
  
  async handlePlanSelection(event) {
    const planId = event.target.dataset.planId;
    const priceId = event.target.dataset.priceId;
    const planType = event.target.dataset.planType;
    
    if (!this.currentMember) {
      // Redirect to signup with plan preselected
      window.location.href = `/signup?plan=${planId}`;
      return;
    }
    
    try {
      if (planType === 'FREE') {
        await this.addFreePlan(planId);
      } else {
        await this.purchasePaidPlan(priceId);
      }
    } catch (error) {
      this.showError('Failed to select plan: ' + error.message);
    }
  }
  
  async addFreePlan(planId) {
    const result = await this.memberstack.addPlan({ planId });
    
    this.showSuccess('Free plan activated successfully!');
    
    // Reload member data
    await this.loadCurrentMember();
    this.updateUI();
  }
  
  async purchasePaidPlan(priceId) {
    await this.memberstack.purchasePlansWithCheckout({
      priceId: priceId,
      successUrl: window.location.href + '?purchase=success',
      cancelUrl: window.location.href + '?purchase=cancelled',
      metadataForCheckout: {
        source: 'plan_manager'
      }
    });
  }
  
  async handlePlanCancellation(event) {
    const planId = event.target.dataset.planId;
    const planName = event.target.dataset.planName;
    
    const confirmed = confirm(`Cancel ${planName}? You'll lose access to premium features.`);
    
    if (!confirmed) return;
    
    try {
      await this.memberstack.removePlan({ planId });
      
      this.showSuccess('Plan cancelled successfully');
      
      // Reload member data
      await this.loadCurrentMember();
      this.updateUI();
    } catch (error) {
      this.showError('Failed to cancel plan: ' + error.message);
    }
  }
  
  async openBillingPortal() {
    try {
      await this.memberstack.launchStripeCustomerPortal({
        returnUrl: window.location.href
      });
    } catch (error) {
      this.showError('Unable to open billing portal: ' + error.message);
    }
  }
  
  updateUI() {
    this.displayAvailablePlans();
    this.displayCurrentPlans();
    this.updateAccessControls();
  }
  
  displayAvailablePlans() {
    const container = document.getElementById('available-plans');
    if (!container) return;
    
    const memberPlanIds = this.currentMember?.planConnections
      ?.filter(pc => pc.status === 'ACTIVE')
      ?.map(pc => pc.planId) || [];
    
    container.innerHTML = this.availablePlans.map(plan => {
      const isActive = memberPlanIds.includes(plan.id);
      const price = plan.prices?.[0];
      
      return `
        <div class="plan-card ${plan.type.toLowerCase()} ${isActive ? 'active' : ''}">
          <h3>${plan.name}</h3>
          <p>${plan.description}</p>
          
          ${price ? `
            <div class="price">
              $${(price.amount / 100).toFixed(2)}/${price.interval}
            </div>
          ` : '<div class="price">Free</div>'}
          
          ${isActive ? `
            <button class="btn active-plan">Current Plan</button>
            ${plan.type === 'PAID' ? `
              <button class="btn cancel-plan-btn" 
                      data-plan-id="${plan.id}" 
                      data-plan-name="${plan.name}">
                Cancel
              </button>
            ` : ''}
          ` : `
            <button class="btn select-plan-btn"
                    data-plan-id="${plan.id}"
                    data-price-id="${price?.id || ''}"
                    data-plan-type="${plan.type}">
              ${plan.type === 'FREE' ? 'Select Plan' : 'Subscribe'}
            </button>
          `}
        </div>
      `;
    }).join('');
    
    // Re-attach event listeners
    this.setupEventListeners();
  }
  
  displayCurrentPlans() {
    const container = document.getElementById('current-plans');
    if (!container) return;
    
    if (!this.currentMember || !this.currentMember.planConnections?.length) {
      container.innerHTML = '<p>No active plans</p>';
      return;
    }
    
    const activePlans = this.currentMember.planConnections
      .filter(pc => pc.status === 'ACTIVE');
    
    container.innerHTML = `
      <h3>Active Subscriptions</h3>
      ${activePlans.map(connection => {
        const plan = this.availablePlans.find(p => p.id === connection.planId);
        return `
          <div class="active-plan-item">
            <span class="plan-name">${plan?.name || connection.planId}</span>
            <span class="plan-status">${connection.status}</span>
            <span class="plan-date">Since ${new Date(connection.createdAt).toLocaleDateString()}</span>
          </div>
        `;
      }).join('')}
      
      ${activePlans.some(pc => this.availablePlans.find(p => p.id === pc.planId)?.type === 'PAID') ? `
        <button id="billing-portal-btn" class="btn">Manage Billing</button>
      ` : ''}
    `;
  }
  
  updateAccessControls() {
    // Update UI based on member's plan access
    const memberPlanIds = this.currentMember?.planConnections
      ?.filter(pc => pc.status === 'ACTIVE')
      ?.map(pc => pc.planId) || [];
    
    // Show/hide premium content
    document.querySelectorAll('[data-requires-plan]').forEach(el => {
      const requiredPlan = el.dataset.requiresPlan;
      const hasAccess = memberPlanIds.includes(requiredPlan);
      
      el.style.display = hasAccess ? 'block' : 'none';
    });
    
    // Show/hide upgrade prompts
    document.querySelectorAll('[data-show-without-plan]').forEach(el => {
      const requiredPlan = el.dataset.showWithoutPlan;
      const hasAccess = memberPlanIds.includes(requiredPlan);
      
      el.style.display = hasAccess ? 'none' : 'block';
    });
  }
  
  showSuccess(message) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-success';
    alert.textContent = message;
    document.body.appendChild(alert);
    
    setTimeout(() => alert.remove(), 5000);
  }
  
  showError(message) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-error';
    alert.textContent = message;
    document.body.appendChild(alert);
    
    setTimeout(() => alert.remove(), 5000);
  }
}

// Initialize plan manager
document.addEventListener('DOMContentLoaded', () => {
  new PlanManager();
});
```

## Next Steps

- **[05-ui-components.md](05-ui-components.md)** - Using pre-built modals for plan selection
- **[03-member-management.md](03-member-management.md)** - Accessing member plan data
- **[07-advanced-features.md](07-advanced-features.md)** - Plan-gated content and features
- **[09-error-handling.md](09-error-handling.md)** - Handling plan and billing errors