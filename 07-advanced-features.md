# Memberstack DOM - Advanced Features

## AI Assistant Instructions
When implementing advanced Memberstack features:
- Use `getSecureContent()` for plan-gated content protection
- Implement comments with `createPost()`, `createThread()`, `getPosts()`, `getThreads()`
- Use team methods: `joinTeam()`, `getTeam()`, `generateInviteToken()`
- Include proper authentication checks before advanced operations
- Handle real-time features with WebSocket connections for comments
- Show loading states for content fetching operations

## Overview

Advanced Memberstack DOM features include secure content delivery, comments system, team management, and plan-based access control. These features enable complex membership applications with rich user interactions.

## Secure Content

### getSecureContent()
Retrieve plan-protected content that's only accessible to members with specific subscriptions.

**Method Signature:**
```typescript
await memberstack.getSecureContent({
  contentId: string;
}): Promise<GetSecureContentPayload>
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| contentId | string | ✅ | Unique identifier for the secure content |

**Response:**
```typescript
{
  data: {
    id: string;
    content: string;
    contentType: "HTML" | "TEXT" | "JSON" | "MARKDOWN";
    accessLevel: string;
    // ... additional content properties
  }
}
```

**Examples:**

Basic Secure Content Retrieval:
```javascript
async function loadSecureContent(contentId) {
  try {
    const result = await memberstack.getSecureContent({
      contentId: contentId
    });
    
    console.log('Secure content loaded:', result.data);
    return result.data;
  } catch (error) {
    console.error('Failed to load secure content:', error);
    
    // Handle different error scenarios
    if (error.code === 'INSUFFICIENT_ACCESS') {
      throw new Error('This content requires a premium subscription');
    } else if (error.code === 'CONTENT_NOT_FOUND') {
      throw new Error('Content not found');
    } else {
      throw new Error('Failed to load content');
    }
  }
}

// Usage
document.getElementById('load-content-btn').addEventListener('click', async () => {
  try {
    const content = await loadSecureContent('premium-tutorial-123');
    document.getElementById('content-area').innerHTML = content.content;
  } catch (error) {
    document.getElementById('content-error').textContent = error.message;
    document.getElementById('content-error').style.display = 'block';
  }
});
```

Content Gate Manager:
```javascript
class SecureContentManager {
  constructor() {
    this.memberstack = window.$memberstackDom;
    this.contentCache = new Map();
    this.init();
  }
  
  async init() {
    this.setupContentGates();
    this.setupDynamicLoading();
  }
  
  setupContentGates() {
    // Find all secure content elements
    document.querySelectorAll('[data-secure-content]').forEach(element => {
      this.setupContentGate(element);
    });
  }
  
  async setupContentGate(element) {
    const contentId = element.dataset.secureContent;
    const requiredPlan = element.dataset.requiredPlan;
    
    // Check if member has required access
    const hasAccess = await this.checkAccess(requiredPlan);
    
    if (hasAccess) {
      await this.loadSecureContentIntoElement(element, contentId);
    } else {
      this.showAccessDeniedMessage(element, requiredPlan);
    }
  }
  
  async checkAccess(requiredPlan) {
    try {
      const member = await this.memberstack.getCurrentMember();
      
      if (!member.data) {
        return false;
      }
      
      // Check if member has the required plan
      return member.data.planConnections?.some(connection =>
        connection.planId === requiredPlan && connection.status === 'ACTIVE'
      );
    } catch (error) {
      console.error('Failed to check access:', error);
      return false;
    }
  }
  
  async loadSecureContentIntoElement(element, contentId) {
    try {
      // Show loading state
      element.innerHTML = '<div class="loading">Loading premium content...</div>';
      
      // Check cache first
      let content = this.contentCache.get(contentId);
      
      if (!content) {
        const result = await this.memberstack.getSecureContent({ contentId });
        content = result.data;
        this.contentCache.set(contentId, content);
      }
      
      // Render content based on type
      this.renderContent(element, content);
      
    } catch (error) {
      console.error('Failed to load secure content:', error);
      this.showContentError(element, error.message);
    }
  }
  
  renderContent(element, content) {
    switch (content.contentType) {
      case 'HTML':
        element.innerHTML = content.content;
        break;
      case 'MARKDOWN':
        // Assume a markdown parser is available
        element.innerHTML = this.parseMarkdown(content.content);
        break;
      case 'JSON':
        const data = JSON.parse(content.content);
        element.innerHTML = this.renderJSONContent(data);
        break;
      case 'TEXT':
      default:
        element.textContent = content.content;
        break;
    }
    
    element.classList.add('secure-content-loaded');
  }
  
  showAccessDeniedMessage(element, requiredPlan) {
    element.innerHTML = `
      <div class="access-denied">
        <div class="lock-icon">🔒</div>
        <h3>Premium Content</h3>
        <p>This content is only available to ${requiredPlan} subscribers.</p>
        <div class="access-actions">
          <button onclick="this.showUpgradeModal('${requiredPlan}')" class="upgrade-btn">
            Upgrade Now
          </button>
          <button onclick="memberstack.openModal('LOGIN')" class="login-btn">
            Sign In
          </button>
        </div>
      </div>
    `;
    
    element.classList.add('access-denied');
  }
  
  showContentError(element, message) {
    element.innerHTML = `
      <div class="content-error">
        <p>Failed to load content: ${message}</p>
        <button onclick="location.reload()">Retry</button>
      </div>
    `;
  }
  
  setupDynamicLoading() {
    // Progressive content loading on scroll
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          const contentId = element.dataset.secureContent;
          
          if (contentId && !element.classList.contains('secure-content-loaded')) {
            this.setupContentGate(element);
            observer.unobserve(element);
          }
        }
      });
    });
    
    // Observe all secure content elements
    document.querySelectorAll('[data-secure-content]').forEach(element => {
      observer.observe(element);
    });
  }
  
  parseMarkdown(markdown) {
    // Simple markdown parser - replace with full parser in production
    return markdown
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/\n/gim, '<br>');
  }
  
  renderJSONContent(data) {
    // Custom JSON content renderer
    if (data.type === 'video') {
      return `
        <div class="video-content">
          <video controls>
            <source src="${data.url}" type="video/mp4">
          </video>
          <h3>${data.title}</h3>
          <p>${data.description}</p>
        </div>
      `;
    } else if (data.type === 'document') {
      return `
        <div class="document-content">
          <h3>${data.title}</h3>
          <div class="document-body">${data.body}</div>
          <a href="${data.downloadUrl}" class="download-link">Download PDF</a>
        </div>
      `;
    }
    
    return `<pre>${JSON.stringify(data, null, 2)}</pre>`;
  }
}

// Initialize secure content manager
document.addEventListener('DOMContentLoaded', () => {
  new SecureContentManager();
});
```

## Comments System

### Posts Management

#### getPosts()
Retrieve posts from a comment channel.

**Method Signature:**
```typescript
await memberstack.getPosts({
  channelKey: string;
  order?: "newest" | "oldest";
  after?: string;
  limit?: number;
}): Promise<GetPostsPayload>
```

**Examples:**

Load Comment Posts:
```javascript
async function loadPosts(channelKey, options = {}) {
  try {
    const result = await memberstack.getPosts({
      channelKey,
      order: options.order || 'newest',
      limit: options.limit || 10,
      after: options.after
    });
    
    console.log('Posts loaded:', result.data);
    return result.data;
  } catch (error) {
    console.error('Failed to load posts:', error);
    throw error;
  }
}

class CommentsSystem {
  constructor(channelKey) {
    this.channelKey = channelKey;
    this.memberstack = window.$memberstackDom;
    this.posts = [];
    this.currentMember = null;
    this.init();
  }
  
  async init() {
    await this.loadCurrentMember();
    await this.loadPosts();
    this.setupUI();
    this.setupEventListeners();
  }
  
  async loadCurrentMember() {
    try {
      const result = await this.memberstack.getCurrentMember();
      this.currentMember = result.data;
    } catch (error) {
      console.error('Failed to load current member:', error);
    }
  }
  
  async loadPosts() {
    try {
      const result = await this.memberstack.getPosts({
        channelKey: this.channelKey,
        order: 'newest',
        limit: 20
      });
      
      this.posts = result.data.posts || [];
      this.renderPosts();
    } catch (error) {
      console.error('Failed to load posts:', error);
      this.showError('Failed to load comments');
    }
  }
  
  setupUI() {
    const container = document.getElementById('comments-container');
    
    container.innerHTML = `
      <div class="comments-header">
        <h3>Comments (${this.posts.length})</h3>
      </div>
      
      <div class="comment-form">
        ${this.currentMember ? `
          <div class="user-avatar">
            <img src="${this.currentMember.profileImage || '/default-avatar.png'}" alt="Your avatar">
          </div>
          <div class="form-content">
            <textarea id="new-comment" placeholder="Write a comment..."></textarea>
            <button id="submit-comment" class="btn">Post Comment</button>
          </div>
        ` : `
          <div class="login-prompt">
            <p>Please log in to join the discussion</p>
            <button onclick="memberstack.openModal('LOGIN')">Sign In</button>
          </div>
        `}
      </div>
      
      <div id="posts-list" class="posts-list">
        <!-- Posts will be rendered here -->
      </div>
      
      <div id="load-more" class="load-more" style="display: none;">
        <button onclick="this.loadMorePosts()">Load More Comments</button>
      </div>
    `;
  }
  
  renderPosts() {
    const postsContainer = document.getElementById('posts-list');
    
    postsContainer.innerHTML = this.posts.map(post => `
      <div class="post" data-post-id="${post.id}">
        <div class="post-header">
          <img src="${post.author.profileImage || '/default-avatar.png'}" 
               alt="${post.author.name}" class="author-avatar">
          <div class="author-info">
            <span class="author-name">${post.author.name}</span>
            <span class="post-date">${this.formatDate(post.createdAt)}</span>
          </div>
          
          ${this.canEditPost(post) ? `
            <div class="post-actions">
              <button onclick="this.editPost('${post.id}')" class="edit-btn">Edit</button>
              <button onclick="this.deletePost('${post.id}')" class="delete-btn">Delete</button>
            </div>
          ` : ''}
        </div>
        
        <div class="post-content">
          ${post.content}
        </div>
        
        <div class="post-footer">
          <div class="post-voting">
            <button onclick="this.votePost('${post.id}', 'UP')" 
                    class="vote-btn ${post.userVote === 'UP' ? 'active' : ''}">
              👍 ${post.upvotes || 0}
            </button>
            <button onclick="this.votePost('${post.id}', 'DOWN')"
                    class="vote-btn ${post.userVote === 'DOWN' ? 'active' : ''}">
              👎 ${post.downvotes || 0}
            </button>
          </div>
          
          <button onclick="this.toggleThreads('${post.id}')" class="replies-btn">
            ${post.threadCount || 0} replies
          </button>
        </div>
        
        <div id="threads-${post.id}" class="threads-container" style="display: none;">
          <!-- Threads will be loaded here -->
        </div>
      </div>
    `).join('');
  }
  
  setupEventListeners() {
    // Submit new comment
    document.getElementById('submit-comment')?.addEventListener('click', () => {
      this.submitComment();
    });
    
    // Enter key to submit
    document.getElementById('new-comment')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        this.submitComment();
      }
    });
  }
  
  async submitComment() {
    const textarea = document.getElementById('new-comment');
    const content = textarea.value.trim();
    
    if (!content) {
      alert('Please enter a comment');
      return;
    }
    
    if (!this.currentMember) {
      memberstack.openModal('LOGIN');
      return;
    }
    
    try {
      const result = await this.memberstack.createPost({
        channelKey: this.channelKey,
        content: content
      });
      
      // Add new post to the beginning of the list
      this.posts.unshift(result.data);
      this.renderPosts();
      
      // Clear the form
      textarea.value = '';
      
      console.log('Comment posted:', result.data);
    } catch (error) {
      console.error('Failed to post comment:', error);
      alert('Failed to post comment. Please try again.');
    }
  }
  
  canEditPost(post) {
    return this.currentMember && 
           (this.currentMember.id === post.author.id || this.currentMember.isAdmin);
  }
  
  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  }
}

// Initialize comments system
document.addEventListener('DOMContentLoaded', () => {
  const channelKey = document.querySelector('[data-comments-channel]')?.dataset.commentsChannel;
  if (channelKey) {
    new CommentsSystem(channelKey);
  }
});
```

#### createPost()
Create a new post in a comment channel.

**Method Signature:**
```typescript
await memberstack.createPost({
  channelKey: string;
  content: string;
}): Promise<CreatePostPayload>
```

#### updatePost()
Update an existing post.

**Method Signature:**
```typescript
await memberstack.updatePost({
  postId: string;
  content: string;
}): Promise<UpdatePostPayload>
```

#### deletePost()
Delete a post.

**Method Signature:**
```typescript
await memberstack.deletePost({
  postId: string;
}): Promise<void>
```

#### postVote()
Vote on a post (upvote/downvote).

**Method Signature:**
```typescript
await memberstack.postVote({
  postId: string;
  vote: "UP" | "DOWN" | "NONE";
}): Promise<void>
```

### Threads Management

#### getThreads()
Get replies (threads) for a specific post.

**Method Signature:**
```typescript
await memberstack.getThreads({
  postId: string;
  order?: "newest" | "oldest";
  after?: string;
  limit?: number;
}): Promise<GetThreadsPayload>
```

#### createThread()
Create a reply to a post.

**Method Signature:**
```typescript
await memberstack.createThread({
  postId: string;
  content: string;
}): Promise<CreateThreadPayload>
```

**Complete Comments Implementation Example:**
```javascript
// Extended comments system with threads support
class AdvancedCommentsSystem extends CommentsSystem {
  constructor(channelKey) {
    super(channelKey);
    this.loadedThreads = new Set();
  }
  
  async toggleThreads(postId) {
    const threadsContainer = document.getElementById(`threads-${postId}`);
    
    if (threadsContainer.style.display === 'none') {
      // Load and show threads
      await this.loadThreads(postId);
      threadsContainer.style.display = 'block';
    } else {
      // Hide threads
      threadsContainer.style.display = 'none';
    }
  }
  
  async loadThreads(postId) {
    if (this.loadedThreads.has(postId)) return;
    
    try {
      const result = await this.memberstack.getThreads({
        postId: postId,
        order: 'oldest',
        limit: 20
      });
      
      this.renderThreads(postId, result.data.threads || []);
      this.loadedThreads.add(postId);
    } catch (error) {
      console.error('Failed to load threads:', error);
    }
  }
  
  renderThreads(postId, threads) {
    const threadsContainer = document.getElementById(`threads-${postId}`);
    
    threadsContainer.innerHTML = `
      <div class="thread-form">
        ${this.currentMember ? `
          <textarea placeholder="Write a reply..." id="reply-${postId}"></textarea>
          <button onclick="this.submitThread('${postId}')" class="btn-small">Reply</button>
        ` : ''}
      </div>
      
      <div class="threads-list">
        ${threads.map(thread => `
          <div class="thread" data-thread-id="${thread.id}">
            <div class="thread-header">
              <img src="${thread.author.profileImage || '/default-avatar.png'}" 
                   alt="${thread.author.name}" class="author-avatar-small">
              <span class="author-name">${thread.author.name}</span>
              <span class="thread-date">${this.formatDate(thread.createdAt)}</span>
            </div>
            <div class="thread-content">${thread.content}</div>
            
            <div class="thread-voting">
              <button onclick="this.voteThread('${thread.id}', 'UP')" 
                      class="vote-btn-small ${thread.userVote === 'UP' ? 'active' : ''}">
                👍 ${thread.upvotes || 0}
              </button>
              <button onclick="this.voteThread('${thread.id}', 'DOWN')"
                      class="vote-btn-small ${thread.userVote === 'DOWN' ? 'active' : ''}">
                👎 ${thread.downvotes || 0}
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }
  
  async submitThread(postId) {
    const textarea = document.getElementById(`reply-${postId}`);
    const content = textarea.value.trim();
    
    if (!content) return;
    
    try {
      const result = await this.memberstack.createThread({
        postId: postId,
        content: content
      });
      
      // Reload threads to show the new reply
      this.loadedThreads.delete(postId);
      await this.loadThreads(postId);
      
      textarea.value = '';
      
      console.log('Thread created:', result.data);
    } catch (error) {
      console.error('Failed to create thread:', error);
      alert('Failed to post reply. Please try again.');
    }
  }
  
  async votePost(postId, vote) {
    if (!this.currentMember) {
      memberstack.openModal('LOGIN');
      return;
    }
    
    try {
      await this.memberstack.postVote({ postId, vote });
      
      // Reload posts to update vote counts
      await this.loadPosts();
    } catch (error) {
      console.error('Failed to vote on post:', error);
    }
  }
  
  async voteThread(threadId, vote) {
    if (!this.currentMember) {
      memberstack.openModal('LOGIN');
      return;
    }
    
    try {
      await this.memberstack.threadVote({ threadId, vote });
      
      // Find the post this thread belongs to and reload threads
      const post = this.posts.find(p => 
        document.querySelector(`[data-thread-id="${threadId}"]`)
               ?.closest(`[data-post-id]`)
               ?.dataset.postId === p.id
      );
      
      if (post) {
        this.loadedThreads.delete(post.id);
        await this.loadThreads(post.id);
      }
    } catch (error) {
      console.error('Failed to vote on thread:', error);
    }
  }
}
```

## Team Management

### joinTeam()
Join a team using an invitation token.

**Method Signature:**
```typescript
await memberstack.joinTeam({
  inviteToken: string;
}): Promise<void>
```

### getTeam()
Get information about a team.

**Method Signature:**
```typescript
await memberstack.getTeam({
  teamId: string;
}): Promise<GetTeamPayload>
```

### generateInviteToken()
Generate an invitation token for a team.

**Method Signature:**
```typescript
await memberstack.generateInviteToken({
  teamId: string;
}): Promise<GenerateInviteTokenPayload>
```

### removeMemberFromTeam()
Remove a member from a team.

**Method Signature:**
```typescript
await memberstack.removeMemberFromTeam({
  teamId: string;
  memberId: string;
}): Promise<void>
```

**Complete Team Management Example:**
```javascript
class TeamManager {
  constructor() {
    this.memberstack = window.$memberstackDom;
    this.currentTeam = null;
    this.init();
  }
  
  async init() {
    await this.loadCurrentTeam();
    this.setupUI();
    this.handleInviteToken();
  }
  
  async loadCurrentTeam() {
    try {
      const member = await this.memberstack.getCurrentMember();
      
      if (member.data && member.data.teamId) {
        const team = await this.memberstack.getTeam({
          teamId: member.data.teamId
        });
        this.currentTeam = team.data;
      }
    } catch (error) {
      console.error('Failed to load team:', error);
    }
  }
  
  setupUI() {
    const container = document.getElementById('team-container');
    
    if (this.currentTeam) {
      this.renderTeamDashboard(container);
    } else {
      this.renderJoinTeamPrompt(container);
    }
  }
  
  renderTeamDashboard(container) {
    container.innerHTML = `
      <div class="team-dashboard">
        <h2>${this.currentTeam.name}</h2>
        <p>Members: ${this.currentTeam.memberCount}</p>
        
        <div class="team-actions">
          <button onclick="this.generateInviteLink()">Generate Invite Link</button>
          <button onclick="this.showTeamMembers()">View Members</button>
        </div>
        
        <div id="invite-link-section" style="display: none;">
          <h3>Team Invite Link</h3>
          <div class="invite-link-container">
            <input type="text" id="invite-link" readonly>
            <button onclick="this.copyInviteLink()">Copy Link</button>
          </div>
        </div>
        
        <div id="team-members" style="display: none;">
          <!-- Team members will be loaded here -->
        </div>
      </div>
    `;
  }
  
  renderJoinTeamPrompt(container) {
    container.innerHTML = `
      <div class="join-team">
        <h2>Join a Team</h2>
        <p>Enter an invitation code to join a team:</p>
        
        <div class="join-form">
          <input type="text" id="invite-token" placeholder="Enter invitation code">
          <button onclick="this.joinTeamWithToken()">Join Team</button>
        </div>
      </div>
    `;
  }
  
  async generateInviteLink() {
    try {
      const result = await this.memberstack.generateInviteToken({
        teamId: this.currentTeam.id
      });
      
      const inviteUrl = `${window.location.origin}/join-team?token=${result.data.token}`;
      
      document.getElementById('invite-link').value = inviteUrl;
      document.getElementById('invite-link-section').style.display = 'block';
      
      console.log('Invite link generated:', inviteUrl);
    } catch (error) {
      console.error('Failed to generate invite link:', error);
      alert('Failed to generate invite link');
    }
  }
  
  copyInviteLink() {
    const linkInput = document.getElementById('invite-link');
    linkInput.select();
    document.execCommand('copy');
    
    // Show feedback
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = 'Copied!';
    
    setTimeout(() => {
      button.textContent = originalText;
    }, 2000);
  }
  
  async joinTeamWithToken() {
    const token = document.getElementById('invite-token').value.trim();
    
    if (!token) {
      alert('Please enter an invitation code');
      return;
    }
    
    try {
      await this.memberstack.joinTeam({
        inviteToken: token
      });
      
      alert('Successfully joined the team!');
      
      // Reload the page to show team dashboard
      window.location.reload();
    } catch (error) {
      console.error('Failed to join team:', error);
      
      const errorMessages = {
        'INVALID_TOKEN': 'Invalid invitation code',
        'EXPIRED_TOKEN': 'This invitation has expired',
        'ALREADY_MEMBER': 'You are already a member of this team'
      };
      
      alert(errorMessages[error.code] || 'Failed to join team');
    }
  }
  
  handleInviteToken() {
    // Check if there's an invite token in the URL
    const params = new URLSearchParams(window.location.search);
    const inviteToken = params.get('token');
    
    if (inviteToken) {
      const confirmed = confirm('You\'ve been invited to join a team. Would you like to join?');
      
      if (confirmed) {
        document.getElementById('invite-token').value = inviteToken;
        this.joinTeamWithToken();
      }
    }
  }
  
  async showTeamMembers() {
    const membersContainer = document.getElementById('team-members');
    
    // This would typically load team members from your backend
    // Since the DOM package doesn't have a direct method for this,
    // you'd implement this with your own API
    
    membersContainer.innerHTML = `
      <h3>Team Members</h3>
      <div class="members-list">
        <!-- Team members would be listed here -->
        <p>Member management features require custom implementation</p>
      </div>
    `;
    
    membersContainer.style.display = 'block';
  }
}

// Initialize team manager
document.addEventListener('DOMContentLoaded', () => {
  new TeamManager();
});
```

## Event Tracking

### _Event()
Track custom events for analytics (internal method).

**Method Signature:**
```typescript
await memberstack._Event({
  data: {
    eventName: string;
    properties: Record<string, any>;
  };
}): Promise<void>
```

**Example:**
```javascript
async function trackCustomEvent(eventName, properties = {}) {
  try {
    await memberstack._Event({
      data: {
        eventName: eventName,
        properties: {
          ...properties,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent
        }
      }
    });
    
    console.log('Event tracked:', eventName, properties);
  } catch (error) {
    console.error('Failed to track event:', error);
  }
}

// Usage examples
trackCustomEvent('premium_content_viewed', {
  contentId: 'tutorial-123',
  contentType: 'video',
  duration: 300
});

trackCustomEvent('team_invite_sent', {
  teamId: 'team-456',
  inviteMethod: 'link'
});
```

## Next Steps

- **[04-plan-management.md](04-plan-management.md)** - Plan-based access control
- **[08-types-reference.md](08-types-reference.md)** - TypeScript definitions for advanced features
- **[09-error-handling.md](09-error-handling.md)** - Handling advanced feature errors
- **[10-examples.md](10-examples.md)** - Complete implementation examples