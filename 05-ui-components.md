# Memberstack DOM - UI Components

## AI Assistant Instructions
When implementing Memberstack UI components:
- Use `openModal()` for pre-built authentication flows
- Use `hideModal()` to programmatically close modals
- Show loading states with `_showLoader()` and `_hideLoader()` (internal methods)
- Display messages with `_showMessage()` (internal method)
- Customize modal appearance through Memberstack dashboard settings
- Include translations parameter for multi-language support

## Overview

Memberstack DOM includes pre-built UI components for common authentication and member management flows. These components are styled according to your Memberstack app settings and provide a complete user experience without custom development.

## Modal Components

### openModal()
Open pre-built Memberstack modals for various user flows.

**Method Signature:**
```typescript
memberstack.openModal(type: ModalType, options?: {
  translations?: MemberstackTranslations;
  [key: string]: any;
}): Promise<any>
```

**Modal Types:**
| Type | Description | When to Use |
|------|-------------|-------------|
| `'LOGIN'` | Email/password and social login | When user needs to authenticate |
| `'SIGNUP'` | Account creation with email/password | For new user registration |
| `'FORGOT_PASSWORD'` | Password reset request | When user forgets password |
| `'RESET_PASSWORD'` | Set new password with token | Password reset confirmation page |
| `'PROFILE'` | Member profile management | Logged-in users managing account |

**Examples:**

Basic Modal Usage:
```javascript
// Login modal
document.getElementById('login-btn').addEventListener('click', () => {
  memberstack.openModal('LOGIN');
});

// Signup modal
document.getElementById('signup-btn').addEventListener('click', () => {
  memberstack.openModal('SIGNUP');
});

// Profile modal (requires authenticated member)
document.getElementById('profile-btn').addEventListener('click', () => {
  memberstack.openModal('PROFILE');
});

// Forgot password modal
document.getElementById('forgot-password-link').addEventListener('click', (e) => {
  e.preventDefault();
  memberstack.openModal('FORGOT_PASSWORD');
});
```

Modal with Promise Handling:
```javascript
async function showLoginModal() {
  try {
    const result = await memberstack.openModal('LOGIN');
    console.log('Login modal completed:', result);
    
    // Modal resolved - user logged in successfully
    // The onAuthChange callback will handle UI updates
    
  } catch (error) {
    console.log('Login modal cancelled or failed:', error);
    // User closed modal or authentication failed
  }
}

// Usage with async/await
document.getElementById('login-btn').addEventListener('click', showLoginModal);
```

Modal Flow Chain:
```javascript
function setupAuthFlow() {
  // Login button opens login modal
  document.getElementById('login-btn').addEventListener('click', async () => {
    try {
      await memberstack.openModal('LOGIN');
      // Success handled by onAuthChange
    } catch (error) {
      console.log('Login cancelled');
    }
  });
  
  // Signup button opens signup modal
  document.getElementById('signup-btn').addEventListener('click', async () => {
    try {
      await memberstack.openModal('SIGNUP');
      // Success handled by onAuthChange
    } catch (error) {
      console.log('Signup cancelled');
    }
  });
  
  // Forgot password link in login modal opens forgot password modal
  // This is handled automatically by the pre-built modals
}
```

### hideModal()
Programmatically close any open Memberstack modal.

**Method Signature:**
```typescript
memberstack.hideModal(): void
```

**Examples:**

Close Modal Programmatically:
```javascript
// Close modal after external event
function closeModalOnEscape(event) {
  if (event.key === 'Escape') {
    memberstack.hideModal();
  }
}

document.addEventListener('keydown', closeModalOnEscape);

// Close modal after successful operation
async function performExternalLogin() {
  // Some external authentication logic
  const success = await externalAuthService.login();
  
  if (success) {
    // Close any open Memberstack modals
    memberstack.hideModal();
  }
}

// Auto-close modal after timeout (not recommended for auth flows)
function autoCloseModal(timeoutMs = 30000) {
  setTimeout(() => {
    memberstack.hideModal();
  }, timeoutMs);
}
```

Modal State Management:
```javascript
class ModalManager {
  constructor() {
    this.modalStack = [];
    this.isModalOpen = false;
    this.setupModalHandling();
  }
  
  setupModalHandling() {
    // Track modal state changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          const modalElements = document.querySelectorAll('[data-ms-modal]');
          this.isModalOpen = modalElements.length > 0;
          
          if (this.isModalOpen) {
            document.body.classList.add('modal-open');
          } else {
            document.body.classList.remove('modal-open');
          }
        }
      });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
  }
  
  async openModalWithTracking(type, options = {}) {
    this.modalStack.push({ type, timestamp: Date.now() });
    
    try {
      const result = await memberstack.openModal(type, options);
      this.modalStack.pop();
      return result;
    } catch (error) {
      this.modalStack.pop();
      throw error;
    }
  }
  
  closeAllModals() {
    memberstack.hideModal();
    this.modalStack = [];
  }
  
  getCurrentModal() {
    return this.modalStack[this.modalStack.length - 1] || null;
  }
}

const modalManager = new ModalManager();
```

## Modal Customization

### Translations
Customize modal text for different languages or branding.

**Translation Interface:**
```typescript
interface MemberstackTranslations {
  login?: {
    title?: string;
    emailPlaceholder?: string;
    passwordPlaceholder?: string;
    submitButton?: string;
    forgotPasswordLink?: string;
    signupLink?: string;
  };
  signup?: {
    title?: string;
    emailPlaceholder?: string;
    passwordPlaceholder?: string;
    submitButton?: string;
    loginLink?: string;
  };
  // ... more modal translations
}
```

**Examples:**

Custom Text Translations:
```javascript
const customTranslations = {
  login: {
    title: 'Welcome Back!',
    emailPlaceholder: 'Enter your email address',
    passwordPlaceholder: 'Enter your password',
    submitButton: 'Sign In',
    forgotPasswordLink: 'Forgot your password?',
    signupLink: "Don't have an account? Sign up"
  },
  signup: {
    title: 'Create Your Account',
    emailPlaceholder: 'Your email address',
    passwordPlaceholder: 'Create a password',
    submitButton: 'Create Account',
    loginLink: 'Already have an account? Sign in'
  },
  profile: {
    title: 'Account Settings',
    saveButton: 'Save Changes',
    cancelButton: 'Cancel'
  }
};

// Use translations with modals
document.getElementById('login-btn').addEventListener('click', () => {
  memberstack.openModal('LOGIN', {
    translations: customTranslations
  });
});

document.getElementById('signup-btn').addEventListener('click', () => {
  memberstack.openModal('SIGNUP', {
    translations: customTranslations
  });
});
```

Multi-Language Support:
```javascript
const translations = {
  en: {
    login: {
      title: 'Login',
      emailPlaceholder: 'Email address',
      passwordPlaceholder: 'Password',
      submitButton: 'Sign In'
    }
  },
  es: {
    login: {
      title: 'Iniciar Sesión',
      emailPlaceholder: 'Dirección de correo',
      passwordPlaceholder: 'Contraseña',
      submitButton: 'Acceder'
    }
  },
  fr: {
    login: {
      title: 'Connexion',
      emailPlaceholder: 'Adresse e-mail',
      passwordPlaceholder: 'Mot de passe',
      submitButton: 'Se connecter'
    }
  }
};

function getLanguage() {
  return navigator.language.split('-')[0] || 'en';
}

function openLocalizedModal(type) {
  const language = getLanguage();
  const modalTranslations = translations[language] || translations.en;
  
  memberstack.openModal(type, {
    translations: modalTranslations
  });
}

// Usage
document.getElementById('login-btn').addEventListener('click', () => {
  openLocalizedModal('LOGIN');
});
```

### Modal Styling
While modal styling is primarily controlled through the Memberstack dashboard, you can add custom CSS to complement the design.

**CSS Customization:**
```css
/* Target Memberstack modal containers */
[data-ms-modal] {
  /* Custom modal container styles */
  z-index: 10000;
}

[data-ms-modal] .modal-content {
  /* Custom content area styles */
  border-radius: 12px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
}

[data-ms-modal] .modal-header {
  /* Custom header styles */
  border-bottom: 1px solid #e5e5e5;
}

[data-ms-modal] .modal-footer {
  /* Custom footer styles */
  border-top: 1px solid #e5e5e5;
}

/* Custom button styles */
[data-ms-modal] .btn-primary {
  background: linear-gradient(45deg, #007ace, #0056b3);
  border: none;
}

[data-ms-modal] .btn-primary:hover {
  background: linear-gradient(45deg, #0056b3, #004085);
}

/* Dark theme support */
@media (prefers-color-scheme: dark) {
  [data-ms-modal] {
    --ms-modal-bg: #1a1a1a;
    --ms-text-color: #ffffff;
    --ms-border-color: #333333;
  }
}
```

## Internal UI Utilities

### Loading States
Display loading indicators during operations (internal methods).

**Method Signatures:**
```typescript
memberstack._showLoader(element?: HTMLElement): void
memberstack._hideLoader(element?: HTMLElement): void
```

**Examples:**

Global Loading Indicator:
```javascript
// Show global loading overlay
memberstack._showLoader();

// Perform operation
try {
  await memberstack.loginMemberEmailPassword({ email, password });
} finally {
  // Hide global loading overlay
  memberstack._hideLoader();
}
```

Element-Specific Loading:
```javascript
const button = document.getElementById('login-btn');

// Show loading state on specific element
button.textContent = 'Signing In...';
button.disabled = true;
memberstack._showLoader(button);

try {
  await memberstack.loginMemberEmailPassword({ email, password });
} finally {
  // Hide element loading state
  memberstack._hideLoader(button);
  button.textContent = 'Sign In';
  button.disabled = false;
}
```

### Message Display
Show success or error messages to users (internal method).

**Method Signature:**
```typescript
memberstack._showMessage(message: string, isError: boolean): void
```

**Examples:**

Success Messages:
```javascript
// Show success message
memberstack._showMessage('Profile updated successfully!', false);

// Show error message
memberstack._showMessage('Login failed. Please try again.', true);
```

Custom Message Handling:
```javascript
function showCustomMessage(message, type = 'info') {
  // Use Memberstack's built-in messaging
  memberstack._showMessage(message, type === 'error');
  
  // Or implement custom message display
  const messageEl = document.getElementById('custom-messages');
  if (messageEl) {
    messageEl.innerHTML = `
      <div class="message message-${type}">
        ${message}
        <button onclick="this.parentElement.remove()">×</button>
      </div>
    `;
  }
}

// Usage
showCustomMessage('Welcome to our platform!', 'success');
showCustomMessage('Please fix the errors below', 'error');
showCustomMessage('Your session will expire soon', 'warning');
```

## Complete UI Integration Example

```javascript
class MemberstackUI {
  constructor() {
    this.memberstack = window.$memberstackDom;
    this.currentModal = null;
    this.setupEventHandlers();
    this.setupAuthListener();
    this.setupCustomStyling();
  }
  
  setupEventHandlers() {
    // Authentication buttons
    document.addEventListener('click', (e) => {
      const target = e.target;
      
      // Login buttons
      if (target.matches('[data-ms-action="login"]')) {
        e.preventDefault();
        this.showLoginModal();
      }
      
      // Signup buttons
      if (target.matches('[data-ms-action="signup"]')) {
        e.preventDefault();
        this.showSignupModal();
      }
      
      // Profile buttons
      if (target.matches('[data-ms-action="profile"]')) {
        e.preventDefault();
        this.showProfileModal();
      }
      
      // Logout buttons
      if (target.matches('[data-ms-action="logout"]')) {
        e.preventDefault();
        this.handleLogout();
      }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Alt + L for login
      if (e.altKey && e.key === 'l') {
        e.preventDefault();
        this.showLoginModal();
      }
      
      // Alt + S for signup
      if (e.altKey && e.key === 's') {
        e.preventDefault();
        this.showSignupModal();
      }
      
      // Escape to close modals
      if (e.key === 'Escape') {
        this.memberstack.hideModal();
      }
    });
  }
  
  setupAuthListener() {
    this.memberstack.onAuthChange(({ member }) => {
      this.updateUIState(member);
      
      if (member) {
        // User logged in - close any auth modals
        this.memberstack.hideModal();
        this.showWelcomeMessage(member);
      }
    });
  }
  
  setupCustomStyling() {
    // Add custom CSS for modal enhancements
    const style = document.createElement('style');
    style.textContent = `
      [data-ms-modal] {
        backdrop-filter: blur(4px);
      }
      
      [data-ms-modal] .modal-content {
        animation: modalSlideIn 0.3s ease-out;
      }
      
      @keyframes modalSlideIn {
        from {
          opacity: 0;
          transform: translateY(-50px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .ms-loading-btn {
        position: relative;
        color: transparent !important;
      }
      
      .ms-loading-btn::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 20px;
        height: 20px;
        border: 2px solid #ffffff;
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        to {
          transform: translate(-50%, -50%) rotate(360deg);
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  async showLoginModal() {
    try {
      this.currentModal = 'LOGIN';
      
      const result = await this.memberstack.openModal('LOGIN', {
        translations: this.getTranslations('login')
      });
      
      console.log('Login modal completed:', result);
    } catch (error) {
      console.log('Login modal cancelled:', error);
    } finally {
      this.currentModal = null;
    }
  }
  
  async showSignupModal() {
    try {
      this.currentModal = 'SIGNUP';
      
      const result = await this.memberstack.openModal('SIGNUP', {
        translations: this.getTranslations('signup')
      });
      
      console.log('Signup modal completed:', result);
    } catch (error) {
      console.log('Signup modal cancelled:', error);
    } finally {
      this.currentModal = null;
    }
  }
  
  async showProfileModal() {
    try {
      // Check if user is authenticated
      const member = await this.memberstack.getCurrentMember();
      if (!member.data) {
        this.showLoginModal();
        return;
      }
      
      this.currentModal = 'PROFILE';
      
      const result = await this.memberstack.openModal('PROFILE', {
        translations: this.getTranslations('profile')
      });
      
      console.log('Profile modal completed:', result);
    } catch (error) {
      console.log('Profile modal cancelled:', error);
    } finally {
      this.currentModal = null;
    }
  }
  
  async handleLogout() {
    const confirmed = confirm('Are you sure you want to log out?');
    
    if (!confirmed) return;
    
    try {
      this.memberstack._showLoader();
      await this.memberstack.logout();
      
      this.memberstack._showMessage('You have been logged out successfully', false);
    } catch (error) {
      console.error('Logout failed:', error);
      this.memberstack._showMessage('Logout failed. Please try again.', true);
    } finally {
      this.memberstack._hideLoader();
    }
  }
  
  updateUIState(member) {
    // Update authentication-dependent UI
    const authElements = document.querySelectorAll('[data-auth]');
    
    authElements.forEach(element => {
      const authState = element.dataset.auth;
      
      if (authState === 'logged-in') {
        element.style.display = member ? 'block' : 'none';
      } else if (authState === 'logged-out') {
        element.style.display = member ? 'none' : 'block';
      }
    });
    
    // Update member-specific content
    if (member) {
      document.querySelectorAll('[data-member-field]').forEach(element => {
        const field = element.dataset.memberField;
        const value = this.getNestedValue(member, field);
        
        if (value !== undefined) {
          element.textContent = value;
        }
      });
    }
  }
  
  showWelcomeMessage(member) {
    const welcomeText = member.customFields?.firstName 
      ? `Welcome back, ${member.customFields.firstName}!`
      : 'Welcome back!';
    
    this.memberstack._showMessage(welcomeText, false);
  }
  
  getTranslations(modalType) {
    // Get translations based on user's language preference
    const language = navigator.language.split('-')[0] || 'en';
    
    const translations = {
      en: {
        login: {
          title: 'Sign In to Your Account',
          submitButton: 'Sign In',
          forgotPasswordLink: 'Forgot password?'
        },
        signup: {
          title: 'Create Your Account',
          submitButton: 'Create Account'
        },
        profile: {
          title: 'Account Settings',
          saveButton: 'Save Changes'
        }
      }
      // Add more languages as needed
    };
    
    return translations[language]?.[modalType] || {};
  }
  
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}

// Initialize UI system
document.addEventListener('DOMContentLoaded', () => {
  new MemberstackUI();
});
```

**HTML Usage:**
```html
<!-- Authentication buttons with data attributes -->
<button data-ms-action="login">Sign In</button>
<button data-ms-action="signup">Sign Up</button>
<button data-ms-action="profile" data-auth="logged-in">My Account</button>
<button data-ms-action="logout" data-auth="logged-in">Sign Out</button>

<!-- Member-specific content -->
<span data-auth="logged-in">
  Welcome, <span data-member-field="customFields.firstName">User</span>!
</span>

<!-- Plan-specific content -->
<div data-auth="logged-in" data-requires-plan="pro">
  <h3>Pro Features</h3>
  <p>Access to advanced features</p>
</div>
```

## Best Practices

### Modal UX Guidelines

1. **Progressive Disclosure**: Start with login, offer signup as alternative
```javascript
// Good: Clear primary action
<button data-ms-action="login" class="btn-primary">Sign In</button>
<a href="#" data-ms-action="signup" class="link">New? Create account</a>

// Avoid: Competing equal-weight options
<button data-ms-action="login">Sign In</button>
<button data-ms-action="signup">Sign Up</button>
```

2. **Context-Aware Modals**: Show appropriate modal based on user state
```javascript
function showContextualAuth() {
  const intent = new URLSearchParams(window.location.search).get('intent');
  
  if (intent === 'signup') {
    memberstack.openModal('SIGNUP');
  } else if (intent === 'reset') {
    memberstack.openModal('FORGOT_PASSWORD');
  } else {
    memberstack.openModal('LOGIN');
  }
}
```

3. **Error Recovery**: Provide clear paths forward on modal errors
```javascript
async function showLoginWithRecovery() {
  try {
    await memberstack.openModal('LOGIN');
  } catch (error) {
    if (error.type === 'CANCELLED') {
      // User cancelled - don't show error
      return;
    }
    
    // Show recovery options
    const retry = confirm('Authentication failed. Try again?');
    if (retry) {
      showLoginWithRecovery();
    }
  }
}
```

## Next Steps

- **[02-authentication.md](02-authentication.md)** - Programmatic authentication methods
- **[06-member-journey.md](06-member-journey.md)** - Complete user journey flows
- **[09-error-handling.md](09-error-handling.md)** - Handling modal and UI errors
- **[10-examples.md](10-examples.md)** - Complete UI implementation examples