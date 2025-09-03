# Memberstack Data Tables - Complete Documentation

## Overview
The Memberstack DOM package provides methods to interact with data tables and records. These methods allow querying, creating, updating, and deleting records in Memberstack data tables, including advanced relationship operations.

## Authentication
Most data table operations require authentication. Ensure the member is logged in before calling these methods.

## Core Methods

### 1. queryDataRecords
**Purpose:** Query records from a data table with advanced filtering, sorting, and pagination.

```typescript
queryDataRecords(params: QueryDataRecordsParams, options?: MemberstackOptions): Promise<QueryDataRecordsPayload>
```

**Parameters:**
```typescript
QueryDataRecordsParams = {
  table: string; // Table name/key (NOTE: This method uses 'table' not 'tableKey')
  query: DataRecordsQuery;
}

DataRecordsQuery = {
  where?: WhereClause;      // Filter conditions
  include?: IncludeClause;  // Related data to include
  select?: SelectClause;    // Specific fields to return
  orderBy?: OrderByClause;  // Sort order
  take?: number;            // Limit results (max 100)
  skip?: number;            // Offset for pagination
  after?: string;           // Cursor for pagination
  _count?: boolean | CountClause; // Count results
}
```

**Query Components:**
```typescript
// WHERE CLAUSE - Filtering
WhereClause = {
  [fieldName: string]: any | WhereOperators;
  // Can use AND, OR, NOT operators
  AND?: WhereClause[];
  OR?: WhereClause[];
  NOT?: WhereClause;
}

WhereOperators = {
  equals?: any;
  not?: any;
  in?: any[];
  notIn?: any[];
  lt?: any;      // less than
  lte?: any;     // less than or equal
  gt?: any;      // greater than
  gte?: any;     // greater than or equal
  contains?: string;
  startsWith?: string;
  endsWith?: string;
  search?: string;
  mode?: 'insensitive' | 'default'; // for string operations
}

// SELECT CLAUSE - Field selection
SelectClause = {
  [fieldName: string]: boolean | CountClause; // true to include, or a CountClause
}

// INCLUDE CLAUSE - Relations
IncludeClause = {
  [relationName: string]: boolean | {
    select?: SelectClause;
    where?: WhereClause;
    include?: IncludeClause;
    orderBy?: OrderByClause;
    take?: number;
    skip?: number;
  };
  _count?: boolean | CountClause;
}

// ORDER BY CLAUSE - Sorting
OrderByClause = {
  [fieldName: string]: 'asc' | 'desc';
}

// COUNT CLAUSE
CountClause = {
  select: {
    [relationName: string]: boolean;
  };
}
```

**Response:**
```typescript
// Wrapped in Response<{ ... }>
type QueryDataRecordsPayload =
  | Response<{
      records: Array<{
        id: string;
        tableKey: string;
        data: Record<string, any>;
        createdAt: string;
        updatedAt: string;
        internalOrder: number;
        activeMemberOwnsIt: boolean;
        [relationName: string]: any; // included relations
        _count?: Record<string, number>; // relation counts
      }>;
      pagination?: {
        limit: number;
        hasMore: boolean;
        endCursor: number; // cursor is numeric
      };
    }>
  | Response<{ _count: number }>;
```

**Examples:**
```javascript
// Simple query with filtering
const { data } = await $memberstackDom.queryDataRecords({
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

// Complex query with relations
const { data } = await $memberstackDom.queryDataRecords({
  table: "orders",
  query: {
    where: {
      status: "completed",
      createdAt: { gte: "2024-01-01" }
    },
    include: {
      customer: true, // Include related customer
      orderItems: {   // Include related items with conditions
        where: { quantity: { gt: 1 } },
        include: { product: true } // Nested include
      }
    },
    select: {
      id: true,
      total: true,
      status: true
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    skip: 0
  }
});

// Count query
const countRes = await $memberstackDom.queryDataRecords({
  table: "products",
  query: {
    where: { inStock: true },
    _count: true
  }
});
const count = countRes.data._count;

// Pagination with cursor
const page1 = await $memberstackDom.queryDataRecords({
  table: "posts",
  query: {
    orderBy: { createdAt: "desc" },
    take: 10
  }
});

const page2 = await $memberstackDom.queryDataRecords({
  table: "posts",
  query: {
    orderBy: { createdAt: "desc" },
    take: 10,
    after: page1.data.pagination?.endCursor
  }
});

// Text search (case-insensitive)
const results = await $memberstackDom.queryDataRecords({
  table: "articles",
  query: {
    where: {
      OR: [
        { title: { contains: "javascript", mode: "insensitive" } },
        { content: { contains: "javascript", mode: "insensitive" } }
      ]
    }
  }
});

// Complex filtering with AND/OR
const results = await $memberstackDom.queryDataRecords({
  table: "products",
  query: {
    where: {
      AND: [
        { category: "electronics" },
        {
          OR: [
            { brand: "Apple" },
            { brand: "Samsung" }
          ]
        },
        { price: { gte: 100, lte: 1000 } }
      ]
    }
  }
});
```

### 2. getDataTable
**Purpose:** Get metadata about a single data table.

```typescript
getDataTable(
  params: GetDataTableParams,
  options?: MemberstackOptions
): Promise<GetDataTablePayload>
```

**Parameters:**
```typescript
GetDataTableParams = {
  tableKey: string; // Table key (NOTE: Uses 'tableKey' not 'table')
}
```

**Response:**
```typescript
// Wrapped in Response<DataTableResponse>
type DataTableResponse = {
  id: string;
  key: string;
  name: string;
  createRule: string;
  readRule: string;
  updateRule: string;
  deleteRule: string;
  createdAt: string;
  updatedAt?: string;
  recordCount: number;
  fields: Array<{
    id: string;
    key: string;
    name: string;
    type: string;
    required: boolean;
    unique: boolean;
    defaultValue?: any;
    tableOrder?: number;
    referencedTableId?: string;
    referencedTable?: { id: string; key: string; name: string };
  }>;
}
```

**Example:**
```javascript
const tableInfo = await $memberstackDom.getDataTable({
  tableKey: "products"
});
console.log(tableInfo.data.fields); // List all fields and their types
```

### 3. getDataTables
**Purpose:** List all accessible data tables for the current member.

```typescript
getDataTables(options?: MemberstackOptions): Promise<GetDataTablesPayload>
```

**Example:**
```javascript
const { data } = await $memberstackDom.getDataTables();
data.tables.forEach(table => {
  console.log(`${table.name} (records: ${table.recordCount})`);
});
```

### 4. getDataRecords
**Purpose:** List records from a data table using basic filters and pagination.

```typescript
getDataRecords(
  params: GetDataRecordsParams,
  options?: MemberstackOptions
): Promise<GetDataRecordsPayload>
```

**Parameters:**
```typescript
GetDataRecordsParams = {
  tableKey: string;
  memberId?: string;
  createdAfter?: string; // ISO string
  createdBefore?: string; // ISO string
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
  limit?: number;
  after?: string; // Cursor (internal order)
  [key: string]: any; // Additional field filters become query params
}
```

**Response:**
```typescript
type GetDataRecordsPayload = Response<{
  records: DataRecordResponse[];
  pagination: {
    limit: number;
    endCursor: number | null;
    hasMore: boolean;
  };
}>;
```

**Example:**
```javascript
const res = await $memberstackDom.getDataRecords({
  tableKey: 'products',
  sortBy: 'createdAt',
  sortDirection: 'DESC',
  limit: 20
});
const { records, pagination } = res.data;
```

### 5. getDataRecord
**Purpose:** Get a single record by ID.

```typescript
getDataRecord(
  params: GetDataRecordParams,
  options?: MemberstackOptions
): Promise<GetDataRecordPayload>
```

**Parameters:**
```typescript
GetDataRecordParams = {
  recordId: string; // NOTE: No table parameter needed
}
```

**Example:**
```javascript
const record = await $memberstackDom.getDataRecord({
  recordId: "prod_123"
});
```

### 6. createDataRecord
**Purpose:** Create a new record in a table.

```typescript
createDataRecord(
  params: CreateDataRecordParams,
  options?: MemberstackOptions
): Promise<CreateDataRecordPayload>
```

**Parameters:**
```typescript
CreateDataRecordParams = {
  tableKey: string; // NOTE: Uses 'tableKey' not 'table'
  data: {
    [fieldName: string]: any;
  };
  memberId?: string; // Optional member ID
}
```

**Example:**
```javascript
const newProduct = await $memberstackDom.createDataRecord({
  tableKey: "products",
  data: {
    name: "iPhone 15",
    category: "electronics",
    price: 999,
    inStock: true,
    description: "Latest iPhone model"
  }
});
```

### 7. updateDataRecord
**Purpose:** Update an existing record, including relationship operations.

```typescript
updateDataRecord(
  params: UpdateDataRecordParams,
  options?: MemberstackOptions
): Promise<UpdateDataRecordPayload>
```

**Parameters:**
```typescript
UpdateDataRecordParams = {
  recordId: string; // NOTE: No table parameter needed
  data: {
    [fieldName: string]: any | ReferenceOperation | MemberReferenceOperation;
  };
}
```

#### Regular Field Updates
```javascript
const updated = await $memberstackDom.updateDataRecord({
  recordId: "prod_123",
  data: {
    price: 899,
    inStock: false
  }
});
```

## Reference Field Operations

The `updateDataRecord` method supports special operations for reference fields that manage relationships between records and members.

### Reference Field Types

| Field Type | Purpose | Operations | Authentication |
|------------|---------|------------|----------------|
| `MEMBER_REFERENCE` | Single member assignment | Direct assignment | Required |
| `MEMBER_REFERENCE_MANY` | Multiple member relationships | connect/disconnect | Required |
| `REFERENCE_MANY` | Multiple record relationships | connect/disconnect | Table permissions |

### MEMBER_REFERENCE_MANY Operations

**Use Case:** Features like likes, bookmarks, favorites, team memberships

#### Connect Self (Like/Bookmark)
```javascript
await $memberstackDom.updateDataRecord({
  recordId: "post_123",
  data: {
    likedBy: {
      connect: { self: true }
    }
  }
});

// Response includes:
const res = await $memberstackDom.updateDataRecord(...);
const likedBy = res.data.data.likedBy;
// likedBy.count -> number; likedBy.hasself -> boolean; likedBy.action -> 'connected' | 'disconnected' | 'unchanged'
```

#### Disconnect Self (Unlike/Remove Bookmark)
```javascript
await $memberstackDom.updateDataRecord({
  recordId: "post_123",
  data: {
    likedBy: {
      disconnect: { self: true }
    }
  }
});
```

#### Multiple Member Reference Operations
```javascript
await $memberstackDom.updateDataRecord({
  recordId: "article_123",
  data: {
    likedBy: {
      connect: { self: true }      // Like the article
    },
    bookmarkedBy: {
      disconnect: { self: true }   // Remove bookmark
    }
  }
});
```

**Important Notes:**
- Currently only supports `{ self: true }` operations
- Requires member authentication
- Self-operations bypass normal table update permissions (allows users to like content they don't own)
- Operations are idempotent (safe to call multiple times)

### REFERENCE_MANY Operations

**Use Case:** Record-to-record relationships like Professor ↔ Courses, Product ↔ Categories

#### Connect Single Record
```javascript
await $memberstackDom.updateDataRecord({
  recordId: "prof_123",
  data: {
    courses: {
      connect: { id: "course_456" }
    }
  }
});
```

#### Connect Multiple Records
```javascript
await $memberstackDom.updateDataRecord({
  recordId: "prof_123",
  data: {
    courses: {
      connect: [
        { id: "course_456" },
        { id: "course_789" }
      ]
    }
  }
});
```

#### Disconnect Records
```javascript
await $memberstackDom.updateDataRecord({
  recordId: "prof_123",
  data: {
    courses: {
      disconnect: { id: "course_456" }
    }
  }
});
```

#### Combined Connect/Disconnect
```javascript
await $memberstackDom.updateDataRecord({
  recordId: "prof_123",
  data: {
    courses: {
      connect: { id: "course_new" },
      disconnect: { id: "course_old" }
    }
  }
});

// Response includes:
const updateRes = await $memberstackDom.updateDataRecord(...);
const courses = updateRes.data.data.courses;
// courses.count -> number; courses.action -> 'connected' | 'disconnected' | 'unchanged'
```

### MEMBER_REFERENCE Operations

**Use Case:** Single member assignments like task assignee, content author

#### Assign Member
```javascript
await $memberstackDom.updateDataRecord({
  recordId: "task_123",
  data: {
    assignedTo: "member_456"  // Direct assignment (no connect/disconnect)
  }
});
```

#### Clear Assignment
```javascript
await $memberstackDom.updateDataRecord({
  recordId: "task_123",
  data: {
    assignedTo: null
  }
});
```

### Combined Operations

Mix regular field updates with reference operations:

```javascript
await $memberstackDom.updateDataRecord({
  recordId: "article_123",
  data: {
    title: "Updated Article Title",           // Regular field
    status: "published",                      // Regular field
    assignedTo: "editor_456",                // MEMBER_REFERENCE
    tags: {                                  // REFERENCE_MANY
      connect: [
        { id: "tag_javascript" },
        { id: "tag_tutorial" }
      ],
      disconnect: { id: "tag_draft" }
    },
    likedBy: {                              // MEMBER_REFERENCE_MANY
      connect: { self: true }
    }
  }
});
```

### TypeScript Support for Reference Operations

```typescript
import { 
  ReferenceOperation, 
  MemberReferenceOperation,
  ReferenceFieldResult,
  MemberReferenceFieldResult,
  ReferenceSelector,
  MemberReferenceSelector
} from '@memberstack/dom';

// Reference operation types
type ReferenceSelector = { id: string };
type ReferenceOperation = {
  connect?: ReferenceSelector | ReferenceSelector[];
  disconnect?: ReferenceSelector | ReferenceSelector[];
};

type MemberReferenceSelector = { self: true };
type MemberReferenceOperation = {
  connect?: MemberReferenceSelector | MemberReferenceSelector[];
  disconnect?: MemberReferenceSelector | MemberReferenceSelector[];
};

// Type-safe operations
const referenceOp: ReferenceOperation = {
  connect: { id: "record_123" },
  disconnect: { id: "record_456" }
};

const memberRefOp: MemberReferenceOperation = {
  connect: { self: true }
};

// Type-safe update call
await memberstack.updateDataRecord({
  recordId: "post_123",
  data: {
    likedBy: memberRefOp,
    tags: referenceOp
  }
});
```

### 8. deleteDataRecord
**Purpose:** Delete a record from a table.

```typescript
deleteDataRecord(
  params: DeleteDataRecordParams,
  options?: MemberstackOptions
): Promise<DeleteDataRecordPayload>
```

**Parameters:**
```typescript
DeleteDataRecordParams = {
  recordId: string; // NOTE: No table parameter needed
}
```

**Example:**
```javascript
await $memberstackDom.deleteDataRecord({
  recordId: "prod_123"
});
```

## Access Control & Authentication

### Access Control Levels
Tables have different access levels that determine who can read/write:
- **PUBLIC**: Anyone can read/write (no auth required)
- **AUTHENTICATED**: Any logged-in member can read/write
- **AUTHENTICATED_OWN**: Members can only read/write their own records (filtered by owner)
- **ADMIN_ONLY**: Only admin members can access

### Special Access Rules for Reference Operations

#### MEMBER_REFERENCE_MANY (Self Operations)
- **Authentication Required**: User must be logged in
- **Access Control Bypass**: Self-only operations (`{ self: true }`) bypass normal table update permissions
- **Use Case**: Allows users to like/bookmark content they don't own

#### REFERENCE_MANY & MEMBER_REFERENCE
- **Standard Permissions**: Normal table update permissions apply
- **Access Required**: User must have UPDATE access to the record/table

## Error Handling

### Common Errors and Solutions

```javascript
try {
  await $memberstackDom.updateDataRecord({
    recordId: "record_123",
    data: {
      courses: { connect: { id: "invalid_id" } }
    }
  });
} catch (error) {
  console.error(error.message);
  
  // Common error messages:
  // "Target record 'invalid_id' not found"
  // "Authentication required for self operations" 
  // "Invalid member selector. Currently only { 'self': true } is supported"
  // "Access denied"
}
```

### Authentication Errors
```javascript
// MEMBER_REFERENCE_MANY without authentication
{
  error: "Authentication required for self operations"
}

// Trying to use non-self selectors
{
  error: "Invalid member selector. Currently only { 'self': true } is supported"
}
```

### Validation Errors
```javascript
// Invalid record ID
{
  error: "Target record 'bad_id' not found"
}

// Wrong table reference
{
  error: "Target record belongs to wrong table"
}
```

## Best Practices

### 1. Error Handling
Always wrap reference operations in try/catch blocks:
```javascript
try {
  const result = await $memberstackDom.updateDataRecord({
    recordId: "post_123",
    data: { likedBy: { connect: { self: true } } }
  });
  
  if (result.data.data.likedBy.action === 'connected') {
    showSuccessMessage('Post liked!');
  }
} catch (error) {
  showErrorMessage('Failed to like post: ' + error.message);
}
```

### 2. Idempotent Operations
Connect/disconnect operations are safe to call multiple times:
```javascript
// Safe to call even if user already likes the post
await $memberstackDom.updateDataRecord({
  recordId: "post_123",
  data: { likedBy: { connect: { self: true } } }
});
```

### 3. Batch Operations
Combine multiple operations for efficiency:
```javascript
// Single API call for multiple changes
await $memberstackDom.updateDataRecord({
  recordId: "article_123",
  data: {
    title: "New Title",                    // Regular field
    likedBy: { connect: { self: true } },  // Like
    bookmarkedBy: { connect: { self: true } }, // Bookmark
    tags: {                               // Update tags
      connect: { id: "tag_featured" },
      disconnect: { id: "tag_draft" }
    }
  }
});
```

### 4. Check Response Data
Use the response to update UI state:
```javascript
const result = await $memberstackDom.updateDataRecord({
  recordId: "post_123",
  data: { likedBy: { connect: { self: true } } }
});

const likeData = result.data.data.likedBy;
updateLikeButton({
  isLiked: likeData.hasself,
  likeCount: likeData.count,
  wasJustLiked: likeData.action === 'connected'
});
```

### 5. Handle Authentication State
Check authentication before member reference operations:
```javascript
const currentMember = await $memberstackDom.getCurrentMember();
if (!currentMember.data) {
  // Redirect to login or show auth modal
  await $memberstackDom.openModal("LOGIN");
  return;
}

// Proceed with member reference operation
await $memberstackDom.updateDataRecord({
  recordId: "post_123",
  data: { likedBy: { connect: { self: true } } }
});
```

### 6. Pagination
Always use pagination for large datasets:
```javascript
const PAGE_SIZE = 20;
const results = await queryDataRecords({
  table: "posts",
  query: { take: PAGE_SIZE, skip: page * PAGE_SIZE }
});
```

### 7. Field Selection
Only request fields you need:
```javascript
query: {
  select: { id: true, name: true, price: true }
}
```

### 8. Efficient Filtering
Use indexes on commonly filtered fields:
```javascript
where: {
  indexed_field: "value", // Fast
  non_indexed_field: { contains: "text" } // Slower
}
```

### 9. Relationship Loading
Only include relations when needed:
```javascript
include: {
  customer: true // Only if you need customer data
}
```

## Common Use Cases

### Like/Unlike System
```javascript
async function toggleLike(postId) {
  try {
    const result = await $memberstackDom.updateDataRecord({
      recordId: postId,
      data: {
        likedBy: {
          [isCurrentlyLiked ? 'disconnect' : 'connect']: { self: true }
        }
      }
    });
    
    // Update UI with new state
    const likeData = result.data.data.likedBy;
    updateLikeUI(likeData.hasself, likeData.count);
    
  } catch (error) {
    console.error('Like toggle failed:', error);
  }
}
```

### Team Member Management
```javascript
async function joinTeam(projectId) {
  try {
    await $memberstackDom.updateDataRecord({
      recordId: projectId,
      data: {
        teamMembers: {
          connect: { self: true }  // Current member joins team
        }
      }
    });
  } catch (error) {
    console.error('Failed to join team:', error);
  }
}
```

### Tag Management
```javascript
async function updateProductTags(productId, tagsToAdd, tagsToRemove) {
  const operations = {};
  
  if (tagsToAdd.length > 0) {
    operations.connect = tagsToAdd.map(id => ({ id }));
  }
  
  if (tagsToRemove.length > 0) {
    operations.disconnect = tagsToRemove.map(id => ({ id }));
  }
  
  await $memberstackDom.updateDataRecord({
    recordId: productId,
    data: { tags: operations }
  });
}
```

### Search Implementation
```javascript
async function searchProducts(searchTerm) {
  return await $memberstackDom.queryDataRecords({
    table: "products",
    query: {
      where: {
        OR: [
          { name: { contains: searchTerm, mode: "insensitive" } },
          { description: { contains: searchTerm, mode: "insensitive" } },
          { category: { contains: searchTerm, mode: "insensitive" } }
        ]
      },
      orderBy: { relevance: "desc" },
      take: 20
    }
  });
}
```

### Infinite Scroll
```javascript
let cursor = null;
let hasMore = true;

async function loadMore() {
  if (!hasMore) return;
  
  const result = await $memberstackDom.queryDataRecords({
    table: "posts",
    query: {
      orderBy: { createdAt: "desc" },
      take: 10,
      after: cursor
    }
  });
  
  cursor = result.data.pagination?.endCursor || null;
  hasMore = result.data.pagination?.hasMore || false;
  return result.data.records;
}
```

### Filtering by Date Range
```javascript
const thisMonth = await $memberstackDom.queryDataRecords({
  table: "orders",
  query: {
    where: {
      createdAt: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
        lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()
      }
    }
  }
});
```

## Error Codes
Common error responses:
- **401**: Unauthorized - Member not logged in
- **403**: Forbidden - Insufficient permissions for table
- **404**: Not Found - Table or record doesn't exist
- **400**: Bad Request - Invalid query parameters or selectors
- **429**: Rate Limited - Too many requests

## Summary of Key Parameter Differences
| Method | Key Params | Notes |
|--------|------------|-------|
| `queryDataRecords` | `table`, `query` | Uses `table` (not `tableKey`); `orderBy` is a single object; returns `Response<{ records/pagination }>` or `Response<{ _count }>` |
| `getDataTable` | `tableKey` | Returns `Response<DataTableResponse>`; includes rule fields (create/read/update/delete) |
| `getDataTables` | none | Returns `Response<{ tables: DataTableResponse[] }>` |
| `getDataRecords` | `tableKey`, filters | Basic list + pagination; returns `Response<{ records, pagination }>` |
| `getDataRecord` | `recordId` | Returns `Response<DataRecordResponse>` |
| `createDataRecord` | `tableKey`, `data` | Returns `Response<DataRecordResponse>` |
| `updateDataRecord` | `recordId`, `data` | No table param; supports reference operations; returns `Response<DataRecordResponse>` |
| `deleteDataRecord` | `recordId` | Returns `Response<{ id: string }>` |
