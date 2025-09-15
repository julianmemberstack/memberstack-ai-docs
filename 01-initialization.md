# Memberstack DOM - Initialization & Configuration

## AI Assistant Instructions
When helping with Memberstack initialization:
- Always include `publicKey` - it's required
- Use `useCookies: true` for web apps (recommended)
- Show both CDN and NPM usage patterns
- Include error handling for initialization failures
- Reference environment-specific endpoints when needed

## Overview

The Memberstack DOM package must be initialized before any other methods can be used. Initialization creates a global instance and configures authentication settings.

## Basic Initialization

### CDN Method (Recommended)
```javascript
// Initialize with minimal configuration
const memberstack = window.MemberstackDom.init({
  publicKey: 'pk_sb_your-public-key-here'
});

// The instance is now available globally
console.log(window.$memberstackDom); // Same as memberstack variable
```

### NPM/ES Module Method
```javascript
import MemberstackDom from '@memberstack/dom';

const memberstack = MemberstackDom.init({
  publicKey: 'pk_sb_your-public-key-here'
});

export default memberstack;
```

## Configuration Options

### Complete Configuration Interface
```typescript
interface DOMConfig {
  publicKey: string;                    // Required: Your Memberstack public key
  appId?: string;                      // Optional: Specific app ID
  useCookies?: boolean;                // Optional: Enable cookie storage (default: false)
  setCookieOnRootDomain?: boolean;     // Optional: Set cookies on root domain (default: false)  
  domain?: string;                     // Optional: Custom API domain
}
```

### Configuration Examples

#### Production Configuration
```javascript
const memberstack = window.MemberstackDom.init({
  publicKey: 'pk_prod_your-production-key',
  useCookies: true,
  setCookieOnRootDomain: true
});
```

#### Development Configuration  
```javascript
const memberstack = window.MemberstackDom.init({
  publicKey: 'pk_sb_your-sandbox-key',
  useCookies: true,
  domain: 'https://api-dev.memberstack.com' // Custom endpoint
});
```

#### Multi-App Configuration
```javascript
const memberstack = window.MemberstackDom.init({
  publicKey: 'pk_sb_your-key',
  appId: 'app_specific_id_here',
  useCookies: true
});
```

## Configuration Details

### publicKey (Required)
Your Memberstack public key from the dashboard.

```javascript
// Sandbox key format
publicKey: 'pk_sb_1234567890abcdef'

// Production key format  
publicKey: 'pk_prod_1234567890abcdef'
```

**Finding Your Public Key:**
1. Login to Memberstack Dashboard
2. Go to Settings → API Keys
3. Copy the "Public Key" (starts with `pk_`)

### useCookies (Recommended: true)
Enables cookie-based authentication storage for better cross-tab sync.

```javascript
// Enable cookies (recommended for web apps)
const memberstack = window.MemberstackDom.init({
  publicKey: 'pk_sb_your-key',
  useCookies: true
});
```

**Benefits of cookies:**
- Automatic authentication across browser tabs
- Persistent login across browser sessions
- Better security than localStorage for tokens

### setCookieOnRootDomain
Sets authentication cookies on the root domain for subdomain sharing.

```javascript
// For apps with multiple subdomains (app.example.com, api.example.com)
const memberstack = window.MemberstackDom.init({
  publicKey: 'pk_sb_your-key',
  useCookies: true,
  setCookieOnRootDomain: true // Cookies work across *.example.com
});
```

### domain (Custom API Endpoint)
Override the default API endpoint for development or custom deployments.

```javascript
// Development environment
const memberstack = window.MemberstackDom.init({
  publicKey: 'pk_sb_your-key',
  domain: 'https://api-dev.memberstack.com'
});

// Custom endpoint
const memberstack = window.MemberstackDom.init({
  publicKey: 'pk_sb_your-key', 
  domain: 'https://your-custom-api.com'
});
```

## Initialization Patterns

### Basic Web App
```html
<!DOCTYPE html>
<html>
<head>
  <title>My App</title>
</head>
<body>
  <script src="https://api.memberstack.com/static/memberstack-dom.js"></script>
  <script>
    // Initialize on page load
    document.addEventListener('DOMContentLoaded', function() {
      const memberstack = window.MemberstackDom.init({
        publicKey: 'pk_sb_your-key',
        useCookies: true
      });
      
      // Setup auth state listener
      memberstack.onAuthChange(({ member }) => {
        console.log('Auth state changed:', member ? 'logged in' : 'logged out');
      });
    });
  </script>
</body>
</html>
```

### React App
```jsx
// services/memberstack.js
import MemberstackDom from '@memberstack/dom';

let memberstack = null;

export const initMemberstack = () => {
  if (!memberstack) {
    memberstack = MemberstackDom.init({
      publicKey: process.env.REACT_APP_MEMBERSTACK_PUBLIC_KEY,
      useCookies: true
    });
  }
  return memberstack;
};

export const getMemberstack = () => {
  if (!memberstack) {
    throw new Error('Memberstack not initialized. Call initMemberstack() first.');
  }
  return memberstack;
};

// App.jsx
import { useEffect } from 'react';
import { initMemberstack } from './services/memberstack';

function App() {
  useEffect(() => {
    const memberstack = initMemberstack();
    
    memberstack.onAuthChange(({ member }) => {
      // Handle auth state changes
      console.log('Member:', member);
    });
  }, []);
  
  return <div>My App</div>;
}
```

### Next.js App (Preventing SSR Errors)

> **⚠️ Common Error: "localStorage is not defined"**
>
> This error occurs when importing `@memberstack/dom` at the module level in Next.js. The package uses browser APIs that don't exist during server-side rendering.

#### Solution 1: Dynamic Import (Recommended)
```javascript
// lib/memberstack.js
let memberstack = null;

export const initMemberstack = async () => {
  // Only initialize in browser environment
  if (typeof window !== 'undefined' && !memberstack) {
    const MemberstackDom = (await import('@memberstack/dom')).default;
    memberstack = MemberstackDom.init({
      publicKey: process.env.NEXT_PUBLIC_MEMBERSTACK_PUBLIC_KEY,
      useCookies: true
    });
  }
  return memberstack;
};

export const getMemberstack = () => memberstack;

// app/providers/memberstack-provider.tsx (App Router)
'use client';

import { useEffect, useState } from 'react';
import { initMemberstack } from '@/lib/memberstack';

export function MemberstackProvider({ children }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    initMemberstack().then(() => {
      setIsReady(true);
    });
  }, []);

  return <>{children}</>;
}

// app/layout.tsx
import { MemberstackProvider } from './providers/memberstack-provider';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <MemberstackProvider>
          {children}
        </MemberstackProvider>
      </body>
    </html>
  );
}
```

#### Solution 2: Conditional Require
```javascript
// lib/memberstack.js
let memberstack = null;

export const initMemberstack = () => {
  if (typeof window !== 'undefined' && !memberstack) {
    // Use require to avoid top-level import
    const MemberstackDom = require('@memberstack/dom').default;
    memberstack = MemberstackDom.init({
      publicKey: process.env.NEXT_PUBLIC_MEMBERSTACK_PUBLIC_KEY,
      useCookies: true
    });
  }
  return memberstack;
};

// pages/_app.js (Pages Router)
import { useEffect } from 'react';
import { initMemberstack } from '../lib/memberstack';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    initMemberstack();
  }, []);

  return <Component {...pageProps} />;
}
```

### Vue.js App
```javascript
// plugins/memberstack.js
import MemberstackDom from '@memberstack/dom';

let memberstack = null;

export const initMemberstack = () => {
  if (!memberstack) {
    memberstack = MemberstackDom.init({
      publicKey: process.env.VUE_APP_MEMBERSTACK_PUBLIC_KEY,
      useCookies: true
    });
  }
  return memberstack;
};

// main.js
import { createApp } from 'vue';
import App from './App.vue';
import { initMemberstack } from './plugins/memberstack';

const app = createApp(App);

// Initialize Memberstack
initMemberstack();

app.mount('#app');
```

## Environment Configuration

### Environment Variables
Store your public keys in environment variables:

```bash
# .env file
MEMBERSTACK_PUBLIC_KEY_SANDBOX=pk_sb_your-sandbox-key
MEMBERSTACK_PUBLIC_KEY_PRODUCTION=pk_prod_your-production-key
```

```javascript
// Environment-based initialization
const memberstack = window.MemberstackDom.init({
  publicKey: process.env.NODE_ENV === 'production'
    ? process.env.MEMBERSTACK_PUBLIC_KEY_PRODUCTION
    : process.env.MEMBERSTACK_PUBLIC_KEY_SANDBOX,
  useCookies: true
});
```

### Multi-Environment Setup
```javascript
const environments = {
  development: {
    publicKey: 'pk_sb_dev-key',
    domain: 'https://api-dev.memberstack.com'
  },
  staging: {
    publicKey: 'pk_sb_staging-key',
    domain: 'https://api-staging.memberstack.com'
  },
  production: {
    publicKey: 'pk_prod_production-key'
  }
};

const config = environments[process.env.NODE_ENV] || environments.development;

const memberstack = window.MemberstackDom.init({
  ...config,
  useCookies: true
});
```

## Error Handling

### Initialization Error Handling
```javascript
try {
  const memberstack = window.MemberstackDom.init({
    publicKey: 'pk_sb_your-key',
    useCookies: true
  });
  
  console.log('Memberstack initialized successfully');
} catch (error) {
  console.error('Memberstack initialization failed:', error);
  
  // Handle specific errors
  if (error.message.includes('Invalid public key')) {
    alert('Configuration error: Invalid Memberstack public key');
  } else {
    alert('Failed to initialize authentication system');
  }
}
```

### Async Initialization Check
```javascript
const memberstack = window.MemberstackDom.init({
  publicKey: 'pk_sb_your-key',
  useCookies: true
});

// Wait for initialization to complete
async function waitForMemberstack() {
  let retries = 0;
  const maxRetries = 10;
  
  while (!window.$memberstackDom && retries < maxRetries) {
    await new Promise(resolve => setTimeout(resolve, 100));
    retries++;
  }
  
  if (!window.$memberstackDom) {
    throw new Error('Memberstack initialization timeout');
  }
  
  return window.$memberstackDom;
}

// Usage
try {
  const memberstack = await waitForMemberstack();
  console.log('Memberstack ready:', memberstack);
} catch (error) {
  console.error('Memberstack initialization failed:', error);
}
```

## Validation & Testing

### Check Initialization Success
```javascript
function validateMemberstackInit() {
  // Check global instance exists
  if (!window.$memberstackDom) {
    throw new Error('Memberstack not initialized');
  }
  
  // Check required methods exist
  const requiredMethods = [
    'loginMemberEmailPassword',
    'getCurrentMember',
    'logout',
    'onAuthChange'
  ];
  
  for (const method of requiredMethods) {
    if (typeof window.$memberstackDom[method] !== 'function') {
      throw new Error(`Memberstack method ${method} not available`);
    }
  }
  
  console.log('✅ Memberstack validation passed');
  return true;
}

// Run validation after init
const memberstack = window.MemberstackDom.init({
  publicKey: 'pk_sb_your-key',
  useCookies: true
});

try {
  validateMemberstackInit();
} catch (error) {
  console.error('❌ Memberstack validation failed:', error);
}
```

### Test Connection
```javascript
async function testMemberstackConnection() {
  try {
    // Test with a simple API call
    const result = await window.$memberstackDom.getApp();
    console.log('✅ Connection test passed:', result.data.name);
    return true;
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    return false;
  }
}

// Run connection test
testMemberstackConnection();
```

## Troubleshooting

### Common Issues

**"localStorage is not defined" / "window is not defined" (Next.js/SSR)**
```javascript
// ❌ Wrong - Top-level import causes SSR errors
import memberstack from '@memberstack/dom';

// ✅ Correct - Dynamic import or conditional loading
let memberstack = null;
if (typeof window !== 'undefined') {
  const MemberstackDom = require('@memberstack/dom').default;
  memberstack = MemberstackDom.init({ publicKey: 'pk_...' });
}

// ✅ Alternative - Dynamic import in useEffect
useEffect(() => {
  import('@memberstack/dom').then((MemberstackDom) => {
    const ms = MemberstackDom.default.init({ publicKey: 'pk_...' });
    setMemberstack(ms);
  });
}, []);
```

**"Memberstack is not defined"**
```javascript
// ❌ Wrong - Memberstack not loaded yet
const memberstack = window.MemberstackDom.init({ ... });

// ✅ Correct - Wait for script to load
document.addEventListener('DOMContentLoaded', function() {
  const memberstack = window.MemberstackDom.init({ ... });
});
```

**"Invalid public key"**
```javascript
// ❌ Wrong - Missing pk_ prefix
publicKey: 'sb_1234567890abcdef'

// ✅ Correct - Include full key
publicKey: 'pk_sb_1234567890abcdef'
```

**Cookies not working across subdomains**
```javascript
// ❌ Wrong - Root domain not enabled
useCookies: true

// ✅ Correct - Enable root domain cookies
useCookies: true,
setCookieOnRootDomain: true
```

### SSR Framework Compatibility

**Next.js App Router**
- Use `'use client'` directive in components that use Memberstack
- Initialize in a client component or provider
- Use dynamic imports to prevent SSR errors

**Next.js Pages Router**
- Initialize in `_app.js` useEffect hook
- Use conditional imports with `typeof window` check

**Remix**
- Initialize in a client-only component
- Use `.client.js` file extension for Memberstack code

**Nuxt.js**
- Use plugins with `client: true` option
- Initialize in mounted() lifecycle hook

## Next Steps

- **[02-authentication.md](02-authentication.md)** - Authentication methods after initialization
- **[06-member-journey.md](06-member-journey.md)** - Setting up authentication state listeners
- **[09-error-handling.md](09-error-handling.md)** - Comprehensive error handling
- **[10-examples.md](10-examples.md)** - Complete app examples with initialization