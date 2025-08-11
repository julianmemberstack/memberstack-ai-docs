# Memberstack DOM - Member Journey & Lifecycle

## AI Assistant Instructions
When implementing member journey flows:
- Use `sendMemberVerificationEmail()` for email verification
- Use `sendMemberResetPasswordEmail()` and `resetMemberPassword()` for password reset
- Include `onAuthChange()` callback for reactive UI updates
- Handle URL parameters for tokens (verification, reset, passwordless)
- Show appropriate UI states for unverified members
- Include proper error handling for email delivery failures

## Overview

Member journey management includes email verification, password reset workflows, authentication state changes, and member lifecycle events. These flows ensure secure and user-friendly experiences throughout the member's relationship with your application.

## Email Verification

### sendMemberVerificationEmail()
Send an email verification to the currently authenticated member.

**Method Signature:**
```typescript
await memberstack.sendMemberVerificationEmail(): Promise<SendMemberVerificationEmailPayload>
```

**Response:**
```typescript
{
  data: {
    success: boolean;
    message: string;
  }
}
```

**Examples:**

Basic Email Verification:
```javascript
async function sendVerificationEmail() {
  try {
    const result = await memberstack.sendMemberVerificationEmail();
    
    console.log('Verification email sent:', result.data);
    
    return {
      success: true,
      message: 'Verification email sent! Please check your inbox.'
    };
  } catch (error) {
    console.error('Failed to send verification email:', error);
    
    return {
      success: false,
      message: 'Failed to send verification email. Please try again.'
    };
  }
}

// Verification button handler
document.getElementById('send-verification-btn').addEventListener('click', async () => {
  const result = await sendVerificationEmail();
  
  const messageEl = document.getElementById('verification-message');
  messageEl.textContent = result.message;
  messageEl.className = result.success ? 'message success' : 'message error';
  messageEl.style.display = 'block';
  
  if (result.success) {
    // Disable button temporarily to prevent spam
    const btn = document.getElementById('send-verification-btn');
    btn.disabled = true;
    btn.textContent = 'Email Sent';
    
    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = 'Resend Verification Email';
    }, 60000); // Re-enable after 1 minute
  }
});
```

Verification Status Checker:
```javascript
class EmailVerificationManager {
  constructor() {
    this.memberstack = window.$memberstackDom;
    this.checkInterval = null;
    this.init();
  }
  
  async init() {
    await this.checkVerificationStatus();
    this.setupVerificationUI();
    this.startPeriodicCheck();
  }
  
  async checkVerificationStatus() {
    try {
      const member = await this.memberstack.getCurrentMember({ useCache: false });
      
      if (member.data) {
        this.updateVerificationUI(member.data.verified);
        return member.data.verified;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to check verification status:', error);
      return false;
    }
  }
  
  updateVerificationUI(isVerified) {
    const verificationBanner = document.getElementById('verification-banner');
    const verifiedBadge = document.getElementById('verified-badge');
    const sendVerificationBtn = document.getElementById('send-verification-btn');
    
    if (isVerified) {
      verificationBanner?.classList.add('hidden');
      verifiedBadge?.classList.remove('hidden');
      sendVerificationBtn?.classList.add('hidden');
      this.stopPeriodicCheck();
    } else {
      verificationBanner?.classList.remove('hidden');
      verifiedBadge?.classList.add('hidden');
      sendVerificationBtn?.classList.remove('hidden');
    }
  }
  
  setupVerificationUI() {
    // Send verification email button
    document.getElementById('send-verification-btn')?.addEventListener('click', 
      () => this.handleSendVerification()
    );
    
    // Resend with cooldown
    document.getElementById('resend-verification-btn')?.addEventListener('click',
      () => this.handleResendVerification()
    );
  }
  
  async handleSendVerification() {
    try {
      const result = await this.memberstack.sendMemberVerificationEmail();
      
      this.showMessage('Verification email sent! Please check your inbox.', 'success');
      this.startCooldown();
      
    } catch (error) {
      this.showMessage('Failed to send verification email. Please try again.', 'error');
    }
  }
  
  async handleResendVerification() {
    const confirmed = confirm('Send another verification email?');
    if (confirmed) {
      await this.handleSendVerification();
    }
  }
  
  startCooldown(duration = 60000) {
    const btn = document.getElementById('send-verification-btn');
    if (!btn) return;
    
    btn.disabled = true;
    
    let secondsLeft = duration / 1000;
    const countdown = setInterval(() => {
      btn.textContent = `Resend in ${secondsLeft}s`;
      secondsLeft--;
      
      if (secondsLeft < 0) {
        clearInterval(countdown);
        btn.disabled = false;
        btn.textContent = 'Resend Verification Email';
      }
    }, 1000);
  }
  
  startPeriodicCheck() {
    // Check every 30 seconds if user has verified their email
    this.checkInterval = setInterval(() => {
      this.checkVerificationStatus();
    }, 30000);
  }
  
  stopPeriodicCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
  
  showMessage(message, type) {
    const messageEl = document.getElementById('verification-message');
    if (messageEl) {
      messageEl.textContent = message;
      messageEl.className = `message ${type}`;
      messageEl.style.display = 'block';
      
      setTimeout(() => {
        messageEl.style.display = 'none';
      }, 5000);
    }
  }
}

// Initialize verification manager for logged-in users
document.addEventListener('DOMContentLoaded', () => {
  memberstack.onAuthChange(({ member }) => {
    if (member && !member.verified) {
      new EmailVerificationManager();
    }
  });
});
```

## Password Reset Flow

### sendMemberResetPasswordEmail()
Send a password reset email to a specified email address.

**Method Signature:**
```typescript
await memberstack.sendMemberResetPasswordEmail({
  email: string;
}): Promise<SendMemberResetPasswordEmailPayload>
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| email | string | ✅ | Email address to send reset link to |

**Examples:**

Password Reset Request:
```javascript
async function sendPasswordReset(email) {
  try {
    const result = await memberstack.sendMemberResetPasswordEmail({
      email: email.trim().toLowerCase()
    });
    
    console.log('Password reset email sent:', result.data);
    
    return {
      success: true,
      message: 'Password reset email sent! Please check your inbox and follow the instructions.'
    };
  } catch (error) {
    console.error('Password reset failed:', error);
    
    // Don't reveal if email exists for security
    return {
      success: true, // Always show success to prevent email enumeration
      message: 'If an account with this email exists, you will receive a password reset link.'
    };
  }
}

// Forgot password form
document.getElementById('forgot-password-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const email = formData.get('email');
  
  if (!email) {
    alert('Please enter your email address');
    return;
  }
  
  // Show loading state
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending...';
  
  try {
    const result = await sendPasswordReset(email);
    
    // Show success message
    document.getElementById('reset-success').textContent = result.message;
    document.getElementById('reset-success').style.display = 'block';
    
    // Hide form and show success state
    e.target.style.display = 'none';
    
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
});
```

### resetMemberPassword()
Complete the password reset using a token from the reset email.

**Method Signature:**
```typescript
await memberstack.resetMemberPassword({
  token: string;
  newPassword: string;
}): Promise<ResetMemberPasswordPayload>
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| token | string | ✅ | Password reset token from email |
| newPassword | string | ✅ | New password for the member |

**Examples:**

Password Reset Completion:
```javascript
async function completePasswordReset(token, newPassword) {
  try {
    const result = await memberstack.resetMemberPassword({
      token,
      newPassword
    });
    
    console.log('Password reset completed:', result.data);
    
    return {
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.'
    };
  } catch (error) {
    console.error('Password reset failed:', error);
    
    const errorMessages = {
      'INVALID_TOKEN': 'This password reset link is invalid or has expired. Please request a new one.',
      'EXPIRED_TOKEN': 'This password reset link has expired. Please request a new one.',
      'WEAK_PASSWORD': 'Password is too weak. Please choose a stronger password.',
      'TOKEN_ALREADY_USED': 'This password reset link has already been used.'
    };
    
    return {
      success: false,
      message: errorMessages[error.code] || 'Password reset failed. Please try again.'
    };
  }
}

// Password reset page handler
class PasswordResetHandler {
  constructor() {
    this.token = this.getTokenFromURL();
    this.init();
  }
  
  getTokenFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('token');
  }
  
  init() {
    if (!this.token) {
      this.showInvalidTokenMessage();
      return;
    }
    
    this.setupForm();
  }
  
  showInvalidTokenMessage() {
    document.getElementById('reset-form').style.display = 'none';
    document.getElementById('invalid-token').style.display = 'block';
  }
  
  setupForm() {
    const form = document.getElementById('reset-password-form');
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleFormSubmit(e);
    });
    
    // Password confirmation validation
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    
    confirmPassword.addEventListener('input', () => {
      if (newPassword.value !== confirmPassword.value) {
        confirmPassword.setCustomValidity('Passwords do not match');
      } else {
        confirmPassword.setCustomValidity('');
      }
    });
  }
  
  async handleFormSubmit(event) {
    const formData = new FormData(event.target);
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');
    
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      alert('Password must be at least 8 characters long');
      return;
    }
    
    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Resetting Password...';
    
    try {
      const result = await completePasswordReset(this.token, newPassword);
      
      if (result.success) {
        this.showSuccessMessage(result.message);
      } else {
        this.showErrorMessage(result.message);
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }
  
  showSuccessMessage(message) {
    document.getElementById('reset-form').style.display = 'none';
    
    const successEl = document.getElementById('reset-success');
    successEl.textContent = message;
    successEl.style.display = 'block';
    
    // Redirect to login after delay
    setTimeout(() => {
      window.location.href = '/login?message=password-reset-complete';
    }, 3000);
  }
  
  showErrorMessage(message) {
    const errorEl = document.getElementById('reset-error');
    errorEl.textContent = message;
    errorEl.style.display = 'block';
    
    setTimeout(() => {
      errorEl.style.display = 'none';
    }, 10000);
  }
}

// Initialize on password reset page
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('/reset-password')) {
    new PasswordResetHandler();
  }
});
```

## Passwordless Authentication Flow

### sendMemberLoginPasswordlessEmail()
Send a passwordless login email (magic link).

**Example with Complete Flow:**
```javascript
class PasswordlessLoginManager {
  constructor() {
    this.memberstack = window.$memberstackDom;
    this.init();
  }
  
  init() {
    // Handle passwordless login request
    this.setupPasswordlessForm();
    
    // Handle passwordless login completion (from email link)
    this.handlePasswordlessCallback();
  }
  
  setupPasswordlessForm() {
    const form = document.getElementById('passwordless-form');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.sendPasswordlessEmail(e);
    });
  }
  
  async sendPasswordlessEmail(event) {
    const formData = new FormData(event.target);
    const email = formData.get('email');
    
    if (!email) {
      this.showMessage('Please enter your email address', 'error');
      return;
    }
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    
    try {
      const result = await this.memberstack.sendMemberLoginPasswordlessEmail({
        email: email.trim().toLowerCase()
      });
      
      console.log('Passwordless email sent:', result.data);
      
      this.showSuccessState(email);
      
    } catch (error) {
      console.error('Passwordless email failed:', error);
      this.showMessage('Failed to send login link. Please try again.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }
  
  showSuccessState(email) {
    document.getElementById('passwordless-form').style.display = 'none';
    
    const successEl = document.getElementById('passwordless-success');
    successEl.innerHTML = `
      <div class="success-message">
        <h3>Check Your Email</h3>
        <p>We've sent a login link to <strong>${email}</strong></p>
        <p>Click the link in your email to sign in instantly.</p>
        
        <div class="help-text">
          <p>Didn't receive the email?</p>
          <button id="resend-passwordless" class="btn-link">Send another link</button>
          <button id="use-password" class="btn-link">Use password instead</button>
        </div>
      </div>
    `;
    successEl.style.display = 'block';
    
    // Setup help actions
    document.getElementById('resend-passwordless').addEventListener('click', () => {
      document.getElementById('passwordless-form').style.display = 'block';
      successEl.style.display = 'none';
    });
    
    document.getElementById('use-password').addEventListener('click', () => {
      window.location.href = '/login';
    });
  }
  
  async handlePasswordlessCallback() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const email = params.get('email');
    
    if (!token || !email) return;
    
    this.showMessage('Completing login...', 'info');
    
    try {
      const result = await this.memberstack.loginMemberPasswordless({
        passwordlessToken: token,
        email: email
      });
      
      console.log('Passwordless login successful:', result.data.member);
      
      this.showMessage('Login successful! Redirecting...', 'success');
      
      // Redirect after short delay
      setTimeout(() => {
        const redirect = params.get('redirect') || '/dashboard';
        window.location.href = redirect;
      }, 1500);
      
    } catch (error) {
      console.error('Passwordless login failed:', error);
      
      const errorMessages = {
        'INVALID_TOKEN': 'This login link is invalid or has expired.',
        'EXPIRED_TOKEN': 'This login link has expired. Please request a new one.',
        'TOKEN_ALREADY_USED': 'This login link has already been used.'
      };
      
      this.showMessage(
        errorMessages[error.code] || 'Login failed. Please try again.',
        'error'
      );
      
      // Redirect to login page after error
      setTimeout(() => {
        window.location.href = '/login';
      }, 3000);
    }
  }
  
  showMessage(message, type) {
    const messageEl = document.getElementById('passwordless-message');
    if (messageEl) {
      messageEl.textContent = message;
      messageEl.className = `message ${type}`;
      messageEl.style.display = 'block';
    }
  }
}

// Initialize passwordless manager
document.addEventListener('DOMContentLoaded', () => {
  new PasswordlessLoginManager();
});
```

## Authentication State Management

### onAuthChange()
Handle real-time authentication state changes throughout the member journey.

**Advanced State Management Example:**
```javascript
class MemberJourneyManager {
  constructor() {
    this.memberstack = window.$memberstackDom;
    this.currentMember = null;
    this.journeyState = 'anonymous';
    this.setupAuthListener();
  }
  
  setupAuthListener() {
    this.memberstack.onAuthChange(({ member }) => {
      const previousMember = this.currentMember;
      this.currentMember = member;
      
      this.updateJourneyState(member, previousMember);
      this.handleStateTransition(member, previousMember);
    });
  }
  
  updateJourneyState(member, previousMember) {
    if (!member) {
      this.journeyState = 'anonymous';
    } else if (!member.verified) {
      this.journeyState = 'unverified';
    } else if (!member.planConnections?.length) {
      this.journeyState = 'verified_free';
    } else {
      this.journeyState = 'verified_paid';
    }
    
    console.log('Journey state changed to:', this.journeyState);
  }
  
  handleStateTransition(member, previousMember) {
    // Handle login
    if (!previousMember && member) {
      this.handleMemberLogin(member);
    }
    
    // Handle logout
    if (previousMember && !member) {
      this.handleMemberLogout(previousMember);
    }
    
    // Handle verification status change
    if (member && previousMember) {
      if (!previousMember.verified && member.verified) {
        this.handleEmailVerified(member);
      }
    }
    
    // Update UI for current state
    this.updateJourneyUI();
  }
  
  handleMemberLogin(member) {
    console.log('Member logged in:', member.email);
    
    // Show welcome message
    const welcomeMessage = member.customFields?.firstName 
      ? `Welcome back, ${member.customFields.firstName}!`
      : 'Welcome back!';
    
    this.showNotification(welcomeMessage, 'success');
    
    // Track login event
    this.trackEvent('member_login', {
      member_id: member.id,
      verified: member.verified,
      plan_count: member.planConnections?.length || 0
    });
    
    // Handle post-login redirects
    this.handlePostLoginRedirect(member);
  }
  
  handleMemberLogout(previousMember) {
    console.log('Member logged out:', previousMember.email);
    
    this.showNotification('You have been logged out', 'info');
    
    // Track logout event
    this.trackEvent('member_logout', {
      member_id: previousMember.id,
      session_duration: Date.now() - (previousMember.loginTime || Date.now())
    });
    
    // Redirect to home
    if (window.location.pathname.startsWith('/dashboard') || 
        window.location.pathname.startsWith('/account')) {
      window.location.href = '/';
    }
  }
  
  handleEmailVerified(member) {
    console.log('Email verified for:', member.email);
    
    this.showNotification('Email verified successfully!', 'success');
    
    // Track verification event
    this.trackEvent('email_verified', {
      member_id: member.id
    });
    
    // Show onboarding or next steps
    this.showPostVerificationFlow(member);
  }
  
  handlePostLoginRedirect(member) {
    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get('redirect');
    
    if (redirect) {
      window.location.href = decodeURIComponent(redirect);
      return;
    }
    
    // Default redirects based on member state
    switch (this.journeyState) {
      case 'unverified':
        if (!window.location.pathname.includes('/verify')) {
          window.location.href = '/verify-email';
        }
        break;
      case 'verified_free':
        if (window.location.pathname === '/login') {
          window.location.href = '/dashboard';
        }
        break;
      case 'verified_paid':
        if (window.location.pathname === '/login') {
          window.location.href = '/dashboard';
        }
        break;
    }
  }
  
  showPostVerificationFlow(member) {
    // Show welcome modal or onboarding
    if (!member.planConnections?.length) {
      // Offer plan selection
      setTimeout(() => {
        const showPlans = confirm('Welcome! Would you like to see our subscription plans?');
        if (showPlans) {
          window.location.href = '/pricing';
        }
      }, 2000);
    }
  }
  
  updateJourneyUI() {
    // Update navigation
    this.updateNavigation();
    
    // Update page content based on journey state
    this.updatePageContent();
    
    // Update banners and notifications
    this.updateBanners();
  }
  
  updateNavigation() {
    const nav = document.getElementById('main-navigation');
    if (!nav) return;
    
    // Remove all journey-specific nav items
    nav.querySelectorAll('.journey-nav').forEach(item => item.remove());
    
    // Add navigation based on current state
    switch (this.journeyState) {
      case 'anonymous':
        this.addNavItem(nav, 'Login', '/login', 'journey-nav');
        this.addNavItem(nav, 'Sign Up', '/signup', 'journey-nav');
        break;
      case 'unverified':
        this.addNavItem(nav, 'Verify Email', '/verify-email', 'journey-nav');
        this.addNavItem(nav, 'Logout', '#logout', 'journey-nav');
        break;
      case 'verified_free':
        this.addNavItem(nav, 'Dashboard', '/dashboard', 'journey-nav');
        this.addNavItem(nav, 'Upgrade', '/pricing', 'journey-nav');
        this.addNavItem(nav, 'Account', '/account', 'journey-nav');
        break;
      case 'verified_paid':
        this.addNavItem(nav, 'Dashboard', '/dashboard', 'journey-nav');
        this.addNavItem(nav, 'Account', '/account', 'journey-nav');
        this.addNavItem(nav, 'Billing', '/billing', 'journey-nav');
        break;
    }
  }
  
  updateBanners() {
    // Remove existing banners
    document.querySelectorAll('.journey-banner').forEach(banner => banner.remove());
    
    // Show relevant banners
    switch (this.journeyState) {
      case 'unverified':
        this.showVerificationBanner();
        break;
      case 'verified_free':
        if (this.shouldShowUpgradeBanner()) {
          this.showUpgradeBanner();
        }
        break;
    }
  }
  
  showVerificationBanner() {
    const banner = document.createElement('div');
    banner.className = 'journey-banner verification-banner';
    banner.innerHTML = `
      <div class="banner-content">
        <span class="banner-icon">📧</span>
        <span class="banner-text">Please verify your email address to access all features.</span>
        <button id="resend-verification-banner" class="banner-btn">Resend Email</button>
        <button class="banner-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;
    
    document.body.insertBefore(banner, document.body.firstChild);
    
    // Handle resend button
    document.getElementById('resend-verification-banner').addEventListener('click', async () => {
      try {
        await this.memberstack.sendMemberVerificationEmail();
        this.showNotification('Verification email sent!', 'success');
      } catch (error) {
        this.showNotification('Failed to send verification email', 'error');
      }
    });
  }
  
  addNavItem(nav, text, href, className = '') {
    const item = document.createElement('a');
    item.href = href;
    item.textContent = text;
    item.className = className;
    
    if (href === '#logout') {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        this.memberstack.logout();
      });
    }
    
    nav.appendChild(item);
  }
  
  shouldShowUpgradeBanner() {
    // Logic to determine if upgrade banner should be shown
    const lastShown = localStorage.getItem('upgrade_banner_last_shown');
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    return !lastShown || parseInt(lastShown) < oneDayAgo;
  }
  
  showUpgradeBanner() {
    const banner = document.createElement('div');
    banner.className = 'journey-banner upgrade-banner';
    banner.innerHTML = `
      <div class="banner-content">
        <span class="banner-text">Unlock premium features with a paid plan!</span>
        <button onclick="window.location.href='/pricing'" class="banner-btn">View Plans</button>
        <button class="banner-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;
    
    document.body.insertBefore(banner, document.body.firstChild);
    
    // Track banner shown
    localStorage.setItem('upgrade_banner_last_shown', Date.now().toString());
  }
  
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto-remove after delay
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }
  
  trackEvent(eventName, properties = {}) {
    // Integration with analytics service
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, properties);
    }
    
    console.log('Event tracked:', eventName, properties);
  }
  
  updatePageContent() {
    // Update page-specific content based on journey state
    const stateElements = document.querySelectorAll('[data-journey-state]');
    
    stateElements.forEach(element => {
      const requiredState = element.dataset.journeyState;
      element.style.display = requiredState === this.journeyState ? 'block' : 'none';
    });
  }
}

// Initialize journey manager
document.addEventListener('DOMContentLoaded', () => {
  new MemberJourneyManager();
});
```

**HTML for Journey States:**
```html
<!-- Content shown only for anonymous users -->
<div data-journey-state="anonymous">
  <h1>Welcome! Sign up to get started.</h1>
  <button data-ms-action="signup">Create Account</button>
</div>

<!-- Content for unverified users -->
<div data-journey-state="unverified">
  <h1>Please verify your email</h1>
  <p>Check your inbox and click the verification link.</p>
  <button id="send-verification-btn">Resend Verification</button>
</div>

<!-- Content for verified free users -->
<div data-journey-state="verified_free">
  <h1>Welcome to your dashboard!</h1>
  <div class="upgrade-prompt">
    <p>Upgrade to unlock premium features</p>
    <a href="/pricing">View Plans</a>
  </div>
</div>

<!-- Content for verified paid users -->
<div data-journey-state="verified_paid">
  <h1>Premium Dashboard</h1>
  <div class="premium-features">
    <!-- Premium content here -->
  </div>
</div>
```

## Next Steps

- **[02-authentication.md](02-authentication.md)** - Authentication methods and flows
- **[03-member-management.md](03-member-management.md)** - Member profile and data management
- **[05-ui-components.md](05-ui-components.md)** - Pre-built UI components for journeys
- **[09-error-handling.md](09-error-handling.md)** - Handling email and verification errors