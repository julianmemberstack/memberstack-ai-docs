const fs = require('fs');
const path = require('path');

class MemberstackIndexer {
  constructor() {
    this.methods = [];
    this.categories = {};
    this.searchKeywords = {};
  }

  parseDocumentation(content) {
    const lines = content.split('\n');
    let currentCategory = 'general';
    let currentMethod = null;
    let lineNumber = 0;

    for (const line of lines) {
      lineNumber++;

      // Detect category headers
      if (line.match(/^#\s+(.+)$/)) {
        const header = line.match(/^#\s+(.+)$/)[1].toLowerCase();
        if (header.includes('authentication')) currentCategory = 'authentication';
        else if (header.includes('member')) currentCategory = 'members';
        else if (header.includes('plan') || header.includes('subscription')) currentCategory = 'plans';
        else if (header.includes('ui') || header.includes('component')) currentCategory = 'ui';
        else if (header.includes('advanced')) currentCategory = 'advanced';
      }

      // Detect method signatures
      const methodMatch = line.match(/^###\s+(\w+)\(\)/);
      if (methodMatch) {
        currentMethod = {
          name: methodMatch[1],
          category: currentCategory,
          lineNumber: lineNumber,
          signature: '',
          description: '',
          returns: '',
          parameters: []
        };
      }

      // Capture method signature
      if (currentMethod && line.includes('await memberstack.')) {
        const sigMatch = line.match(/memberstack\.(\w+)\(([^)]*)\)/);
        if (sigMatch) {
          currentMethod.signature = `${sigMatch[1]}(${sigMatch[2]})`;
        }
      }

      // Capture return type
      if (currentMethod && line.includes('Promise<')) {
        const returnMatch = line.match(/Promise<([^>]+)>/);
        if (returnMatch) {
          currentMethod.returns = `Promise<${returnMatch[1]}>`;
        }
      }

      // Save method when we hit the next method or section
      if (currentMethod && (line.match(/^###\s+\w+\(\)/) || line.match(/^##\s+/))) {
        if (line !== `### ${currentMethod.name}()`) {
          this.addMethod(currentMethod);
          currentMethod = null;
        }
      }
    }

    // Don't forget the last method
    if (currentMethod) {
      this.addMethod(currentMethod);
    }
  }

  addMethod(method) {
    this.methods.push(method);
    
    // Add to categories
    if (!this.categories[method.category]) {
      this.categories[method.category] = { methods: [] };
    }
    this.categories[method.category].methods.push(method);

    // Add to search keywords
    this.addSearchKeywords(method);
  }

  addSearchKeywords(method) {
    const name = method.name.toLowerCase();
    
    // Extract keywords from method name
    const keywords = [];
    
    if (name.includes('login')) keywords.push('login', 'signin', 'authenticate');
    if (name.includes('signup')) keywords.push('signup', 'register', 'create account');
    if (name.includes('logout')) keywords.push('logout', 'signout');
    if (name.includes('password')) keywords.push('password');
    if (name.includes('email')) keywords.push('email');
    if (name.includes('social')) keywords.push('social', 'oauth', 'google', 'facebook');
    if (name.includes('member')) keywords.push('member', 'user', 'profile');
    if (name.includes('plan')) keywords.push('plan', 'subscription', 'pricing');
    if (name.includes('payment')) keywords.push('payment', 'billing', 'checkout');
    if (name.includes('update')) keywords.push('update', 'modify', 'change');
    if (name.includes('delete')) keywords.push('delete', 'remove');
    if (name.includes('get')) keywords.push('get', 'fetch', 'retrieve');
    if (name.includes('modal')) keywords.push('modal', 'ui', 'dialog');

    keywords.forEach(keyword => {
      if (!this.searchKeywords[keyword]) {
        this.searchKeywords[keyword] = [];
      }
      if (!this.searchKeywords[keyword].includes(method.name)) {
        this.searchKeywords[keyword].push(method.name);
      }
    });
  }

  generateIndex() {
    // Extract common authentication methods
    const authMethods = [
      'loginMemberEmailPassword',
      'signupMemberEmailPassword', 
      'loginMemberPasswordless',
      'signupMemberPasswordless',
      'logoutMember',
      'sendMemberResetPasswordEmail',
      'resetMemberPassword',
      'updateMemberPassword'
    ];

    // Extract member management methods
    const memberMethods = [
      'getCurrentMember',
      'updateMember',
      'getMemberMetaData',
      'updateMemberMetaData',
      'deleteMember',
      'getMemberJSON',
      'updateMemberJSON'
    ];

    // Extract plan/billing methods
    const planMethods = [
      'purchasePlansWithCheckout',
      'openBillingPortal',
      'getActivePlans',
      'updatePlan',
      'cancelPlan',
      'getMemberPlans'
    ];

    // Build the complete index
    const index = {
      version: "2.0.0",
      totalMethods: this.methods.length,
      lastUpdated: new Date().toISOString(),
      categories: this.categories,
      searchKeywords: this.searchKeywords,
      quickReference: {
        authentication: authMethods.filter(m => this.methods.find(method => method.name === m)),
        members: memberMethods.filter(m => this.methods.find(method => method.name === m)),
        plans: planMethods.filter(m => this.methods.find(method => method.name === m))
      },
      allMethods: this.methods.map(m => ({
        name: m.name,
        category: m.category,
        signature: m.signature,
        returns: m.returns,
        docLocation: `complete.md#L${m.lineNumber}`
      }))
    };

    return index;
  }

  async buildFromFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    this.parseDocumentation(content);
    return this.generateIndex();
  }
}

module.exports = MemberstackIndexer;