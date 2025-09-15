Data Tables Documentation - @memberstack/dom (DOM + Webflow)

This document describes the Data Tables client methods exposed by @memberstack/dom, their exact parameters, and the raw REST requests they issue. It also calls out the current server response shapes and known mismatches so you can integrate with 100% accuracy.

## Installation Requirements

Data Tables functionality requires the latest version of @memberstack/dom. Make sure you install the latest version:

```bash
npm install @memberstack/dom@latest
```

Rate limits (server):
- Global (all client REST routes): 200 requests per 30 seconds per IP
- Data Tables — Reads: 25 requests per second per IP (Applies to: GET /v1/data-tables, GET /v1/data-tables/:tableKey, POST /v1/data-records/query, GET /v1/data-records)
- Data Tables — Creates: 10 requests per minute per IP (POST /v1/data-records)
- Data Tables — Writes: 30 requests per minute per IP (PUT/DELETE /v1/data-records/:recordId)

Quick start (DOM + Webflow):
// Option A: Using @memberstack/dom directly
import MemberstackDOM from '@memberstack/dom';
const memberstack = MemberstackDOM.init({ publicKey: 'pk_test_123', appId: 'app_123' });

// Option B: Using the Webflow package
// The DOM methods are exposed globally via window.$memberstackDom
const memberstackWF = window.$memberstackDom; // same methods as shown below

Feature flag:
If the environment variable DISABLE_DATA_TABLES is set to a truthy value on the server, all routes return 503 with message: "Data table feature is temporarilly offline."

getDataTables
Method: memberstack.getDataTables(options?)
SDK type: (): Promise<Payloads.GetDataTablesPayload>
REST call: GET /v1/data-tables

Request:
- Optional options.token overrides the Authorization header.

Response (server):
{
  "data": {
    "tables": [
      {
        "id": "tbl_...",
        "key": "articles",
        "name": "Articles",
        "createRule": "...",
        "readRule": "...",
        "updateRule": "...",
        "deleteRule": "...",
        "createdAt": "2024-08-21T00:00:00.000Z",
        "updatedAt": "2024-08-22T00:00:00.000Z",
        "recordCount": 123,
        "fields": [
          {
            "id": "fld_...",
            "key": "title",
            "name": "Title",
            "type": "TEXT",
            "required": true,
            "defaultValue": null,
            "tableOrder": 1,
            "referencedTableId": null,
            "referencedTable": null
          }
        ]
      }
    ]
  }
}

Notes:
- Field objects do NOT contain unique in the current server response (the SDK's local type includes unique, but the server does not return it).
- recordCount reflects only records accessible to the active context (access rules and auth are applied).

Example (SDK / Webflow):
const { data } = await memberstack.getDataTables();
data.tables.forEach((t) => {
  console.log(`${t.key} → ${t.recordCount} records`);
});

getDataTable
Method: memberstack.getDataTable(params, options?)
Params: { table: string }
SDK type: (params: Params.GetDataTableParams): Promise<Payloads.GetDataTablePayload>
REST call: GET /v1/data-tables/:tableKey

Response (server):
{ "data": { /* DataTableResponse object (same shape as in getDataTables.tables[i]) */ } }

Example (SDK / Webflow):
const { data } = await memberstack.getDataTable({ table: 'cars' });
console.log(data.name, data.fields.length);

Listing Records
Prefer memberstack.queryDataRecords with findMany for listing, filtering, includes, and counts. See the "data-records/query — Includes, Counts, and Pagination" section below for full examples and pagination patterns.

Example (SDK / Webflow):
// First page
let { data } = await memberstack.queryDataRecords({
  table: 'cars',
  query: {
    findMany: {
      where: { make: { equals: 'Tesla' } },
      orderBy: { createdAt: 'desc' },
      take: 20
    }
  }
});

console.log('Fetched', data.records.length, 'records');

// Next page using endCursor
if (data.pagination?.hasMore && data.pagination.endCursor) {
  const next = await memberstack.queryDataRecords({
    table: 'cars',
    query: {
      findMany: {
        where: { make: { equals: 'Tesla' } },
        orderBy: { createdAt: 'desc' },
        take: 20,
        after: String(data.pagination.endCursor)
      }
    }
  });
  console.log('Fetched next page:', next.data.records.length);
}

createDataRecord
Method: memberstack.createDataRecord(params, options?)
SDK Params type:
type CreateDataRecordParams = {
  table: string;
  data: Record<string, any>;
  memberId?: string;          // optional, server ignores this field
};

REST call: POST /v1/data-records with body { table, data, memberId? }

Response (server on success):
{
  "data": {
    "id": "rec_...",
    "tableKey": "articles",
    "createdByMemberId": "mem_...",
    "data": { /* typed field data */ },
    "createdAt": "...",
    "updatedAt": "...",
    "internalOrder": 123456,
    "activeMemberOwnsIt": true
  },
  "_internalUseOnly": { "message": "..." }
}

Notes:
- _internalUseOnly may be included in responses but is not part of the public SDK typings.

Example (SDK / Webflow):
const { data } = await memberstack.createDataRecord({
  table: 'cars',
  data: {
    make: 'Tesla',
    model: 'Model 3',
    year: 2022
  }
});

console.log('Created record:', data.id);

getDataRecord
Method: memberstack.getDataRecord(params, options?)
Params type:
type GetDataRecordParams = { recordId: string };

REST call (SDK issues): POST /v1/data-records/query with body:
{
  "query": {
    "findUnique": {
      "where": { "id": "rec_..." }
    }
  }
}

Server expectation (IMPORTANT):
Body must include the table key and the id must be wrapped in a where clause:
{
  "table": "articles",
  "query": {
    "findUnique": {
      "where": { "id": "rec_..." }
    }
  }
}

- The SDK includes table and wraps id under where, satisfying server requirements.

SDK response normalization:
The server returns { data: { record } }. The SDK unwraps this and returns { data: record } to match GetDataRecordPayload.

Response (server on success):
{ "data": { "record": { /* DataRecordResponse */ } } }

Notes:
SDK and server are aligned on request shape, and the SDK unwraps { data: { record } } to { data: record } for convenience.

Example (SDK / Webflow):
const { data } = await memberstack.getDataRecord({
  recordId: 'rec_abc123'
});

console.log(data.data.make, data.data.model);

updateDataRecord
Method: memberstack.updateDataRecord(params, options?)
Params type:
type UpdateDataRecordParams = {
  recordId: string;
  data: Record<string, any>;
};

REST call: PUT /v1/data-records/:recordId with body { data }

Response (server):
{
  "data": { /* DataRecordResponse */ },
  "_internalUseOnly": { "message": "..." }
}

Notes:
Partial updates are supported; member/reference operations for many-to-many fields use { connect: ..., disconnect: ... } objects. See access rules below.

Examples (SDK):
// Simple field edits
await memberstack.updateDataRecord({
  recordId: 'rec_abc123',
  data: { mileage: 12500 }
});

// Record-to-record many relation (REFERENCE_MANY) — e.g., add/remove tags
await memberstack.updateDataRecord({
  recordId: 'rec_abc123',
  data: {
    tags: {
      connect: [{ id: 'rec_tag_electric' }],
      disconnect: [{ id: 'rec_tag_gas' }]
    }
  }
});

// Member many relation (MEMBER_REFERENCE_MANY) — e.g., the current member favorites this car
await memberstack.updateDataRecord({
  recordId: 'rec_abc123',
  data: {
    favoritedBy: { connect: [{ self: true }] }
  }
});

deleteDataRecord
Method: memberstack.deleteDataRecord(params, options?)
Params type:
type DeleteDataRecordParams = { recordId: string };

REST call: DELETE /v1/data-records/:recordId

Response (server):
{
  "data": { "id": "rec_..." },
  "_internalUseOnly": { "message": "..." }
}

Example (SDK / Webflow):
await memberstack.deleteDataRecord({ recordId: 'rec_abc123' });

queryDataRecords
Method: memberstack.queryDataRecords(params, options?)
Params type:
type QueryDataRecordsParams = {
  table: string;            // REQUIRED
  query: {
    where?: object;         // Prisma-like, supports AND/OR/NOT and operators like { equals, in, gt, contains, ... }
    include?: object;       // Relationships: REFERENCE, MEMBER_REFERENCE; counts via _count.select
    select?: object;        // Field selection
    orderBy?: object;       // e.g., { createdAt: 'asc' }
    take?: number;          // 1..100 (server enforces +1 internally for hasMore detection)
    skip?: number;          // 0..10000
    after?: string;         // cursor (internalOrder as string)
    _count?: boolean | { select: Record<string, boolean> };
  };
};

REST call: POST /v1/data-records/query

Behavior and validation:
- You must specify exactly one of query.findMany or query.findUnique at the top level (the SDK sends findMany for this method).
- findMany:
  - Include supports simple relations and _count.select (multiple counts allowed; server uses a hybrid approach under the hood).
  - REFERENCE_MANY and MEMBER_REFERENCE_MANY cannot be included in findMany (validator rejects); use findUnique to include many-to-many relations.
  - Pagination: take (1..100), skip (0..10000), and cursor via after (internalOrder).
- findUnique:
  - Must include where.id only (no top-level take, skip, after, or _count: true).
  - Response wraps the record under data.record.

Additional notes:
BigInt values in responses are converted to Numbers by the server before JSON serialization.

Responses (server):

findMany:
{
  "data": {
    "records": [
      {
        "id": "rec_...",
        "internalOrder": 123456,
        "createdAt": "2024-08-22T00:00:00.000Z",
        "updatedAt": "2024-08-22T00:05:00.000Z",
        "activeMemberOwnsIt": false,
        "data": { /* field values plus any included relations */ },
        "_count": { /* present only when _count.select was used */ }
      }
    ],
    "pagination": {
      "hasMore": true,
      "limit": 20,          // present when 'take' is provided
      "endCursor": 123456   // present when there are records
    }
  }
}

findUnique:
{
  "data": {
    "record": {
      "id": "rec_...",
      "internalOrder": 123456,
      "createdAt": "...",
      "updatedAt": "...",
      "activeMemberOwnsIt": true,
      "data": { /* field values plus included relations */ },
      "_count": { /* present only when _count.select was used */ }
    }
  }
}

Pure count (query.findMany with _count: true and no include/select):
{ "data": { "_count": 42 } }

Access Control & Auth
- All endpoints enforce table-level access rules (createRule, readRule, updateRule, deleteRule).
- For read operations, the server applies access filters automatically; you cannot manually override them via memberId.
- Some operations (e.g., "self-only" member reference operations) permit updates when authenticated even if you don't own the record.

Notes and Limitations
- GET /v1/data-records supports only: tableKey, createdAfter, createdBefore, sortBy, sortDirection, limit, after. For field-level filtering or relationship includes, use queryDataRecords.
- DataTableResponse.fields reflect server output; no unique property is returned.

data-records/query — Includes, Counts, and Pagination

This section shows practical patterns for POST /v1/data-records/query with findMany and findUnique using include, _count, and pagination.

Request wrapper shape:
{
  "table": "<tableKey>",
  "query": {
    "findMany": { /* ...see below... */ }
  }
}

or

{
  "table": "<tableKey>",
  "query": {
    "findUnique": {
      "where": { "id": "rec_..." },
      /* ...see below... */
    }
  }
}

General rules enforced by the server:
- Include supports simple relations directly under include.
- Deep nested includes/select/orderBy/where are not supported inside include values.
- In findMany, includes for many-to-many relations (REFERENCE_MANY, MEMBER_REFERENCE_MANY) are not allowed; use findUnique for those.
- Nested include pagination supports only take, skip, or after (cursor), and you may not combine skip and after together in a single include object.

A) findMany with simple includes and counts

Allowed includes in findMany:
- REFERENCE (record relation, e.g., author)
- MEMBER_REFERENCE (single member relation, e.g., postedBy)

Not allowed in findMany includes (use findUnique):
- REFERENCE_MANY, MEMBER_REFERENCE_MANY (junction-based many relations)

Example request:
{
  "table": "articles",
  "query": {
    "findMany": {
      "where": { "published": { "equals": true } },
      "include": {
        "author": true,
        "_count": { "select": { "comments": true, "likes": true } }
      },
      "orderBy": { "createdAt": "desc" },
      "take": 20,
      "after": "123456"  // internalOrder cursor from previous page
    }
  }
}

Example response (server):
{
  "data": {
    "records": [
      {
        "id": "rec_...",
        "internalOrder": 123500,
        "createdAt": "2024-08-22T00:00:00.000Z",
        "updatedAt": "2024-08-22T00:05:00.000Z",
        "activeMemberOwnsIt": false,
        "data": {
          "title": "Hello",
          "author": {
            "id": "rec_author_...",
            "internalOrder": 500,
            "createdAt": "2024-08-01T00:00:00.000Z",
            "updatedAt": "2024-08-10T00:00:00.000Z",
            "activeMemberOwnsIt": false,
            "data": {
              /* author table fields */
            }
          }
        },
        "_count": { "comments": 12, "likes": 4 }
      }
    ],
    "pagination": {
      "hasMore": true,
      "limit": 20,
      "endCursor": 123480
    }
  }
}

Example (SDK / Webflow):
const { data } = await memberstack.queryDataRecords({
  table: 'articles',
  query: {
    findMany: {
      where: { published: { equals: true } },
      include: {
        author: true,
        _count: { select: { comments: true, likes: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    }
  }
});

console.log('records:', data.records.length);
console.log('first author id:', data.records[0].data.author?.id);
console.log('first counts:', data.records[0]._count);

Notes:
- _count.select supports multiple relations; the server returns a combined _count object per record.
- The top-level pagination.endCursor is always the record's internalOrder of the last item on the page.

B) findUnique with many-to-many includes (with pagination)

Use findUnique to include many relationships. Each many relation returns a structured object with records and pagination.

Example request with a record that has both record and member many-to-many relations:
{
  "table": "articles",
  "query": {
    "findUnique": {
      "where": { "id": "rec_article_123" },
      "include": {
        "tags": { "take": 10 },                 // REFERENCE_MANY (records)
        "likedBy": { "take": 25 }               // MEMBER_REFERENCE_MANY (members)
      }
    }
  }
}

Example response (server):
{
  "data": {
    "record": {
      "id": "rec_article_123",
      "internalOrder": 900,
      "createdAt": "2024-08-20T00:00:00.000Z",
      "updatedAt": "2024-08-22T00:00:00.000Z",
      "activeMemberOwnsIt": false,
      "data": {
        /* article fields ... */
        "tags": {
          "records": [
            {
              "id": "rec_tag_1",
              "internalOrder": 101,
              "createdAt": "2024-08-01T00:00:00.000Z",
              "updatedAt": "2024-08-10T00:00:00.000Z",
              "activeMemberOwnsIt": false,
              "data": { /* tag fields */ }
            }
          ],
          "pagination": {
            "limit": 10,
            "hasMore": false,
            "endCursor": 101   // numeric (internalOrder)
          }
        },
        "likedBy": {
          "records": [
            {
              "id": "mem_abc",
              "email": "jane@example.com",
              "createdAt": "2024-07-01T00:00:00.000Z",
              "updatedAt": "2024-08-02T00:00:00.000Z",
              "verified": true,
              "profileImage": null,
              "customFields": {},
              "metaData": { /* present only when viewing self */ }
            }
          ],
          "pagination": {
            "limit": 25,
            "hasMore": true,
            "endCursor": "2024-08-02T00:00:00.000Z"  // string (createdAt)
          }
        }
      }
    }
  }
}

Pagination rules for includes:
- REFERENCE_MANY and REVERSE_REFERENCE_MANY:
  - orderBy: internalOrder ascending (server-managed)
  - Cursor: after is the numeric internalOrder; response pagination.endCursor is numeric
  - take defaults to 100 (server fetches 101 internally to compute hasMore)
- MEMBER_REFERENCE_MANY:
  - orderBy: createdAt ascending (server-managed)
  - Cursor: after is an ISO date string (createdAt); response pagination.endCursor is a string
  - take defaults to 100 (server fetches 101 internally to compute hasMore)
  - Member objects include email via member.auth

SDK note:
The DOM SDK exposes getDataRecord for single-record fetches but does not currently accept include for findUnique. To retrieve related many-to-many collections, fetch the record via getDataRecord and then query related sets separately using queryDataRecords (or rely on _count in a findMany list to avoid extra round trips).

You may use skip as an alternative to after within an include, but not both together.

C) Pure count queries

To get only a total count for findMany without records:
{
  "table": "articles",
  "query": {
    "findMany": {
      "where": { "published": { "equals": true } },
      "_count": true
    }
  }
}

Response:
{ "data": { "_count": 42 } }

Example (SDK / Webflow):
const { data } = await memberstack.queryDataRecords({
  table: 'articles',
  query: {
    findMany: {
      where: { published: { equals: true } },
      _count: true
    }
  }
});

console.log('count:', data._count);

D) Top-level pagination (findMany)

- take: 1–100; server fetches one extra to compute hasMore.
- after: cursor string based on internalOrder of the last item returned.
- skip: offset (0–10000). Prefer cursor-based pagination (after) for consistency across sorts.

Example first page:
{
  "table": "articles",
  "query": {
    "findMany": {
      "orderBy": { "createdAt": "desc" },
      "take": 20
    }
  }
}

Next page:
{
  "table": "articles",
  "query": {
    "findMany": {
      "orderBy": { "createdAt": "desc" },
      "take": 20,
      "after": "123480"
    }
  }
}

Example (SDK / Webflow):
// First page
let { data } = await memberstack.queryDataRecords({
  table: 'articles',
  query: { findMany: { orderBy: { createdAt: 'desc' }, take: 20 } }
});

// Next page
if (data.pagination?.hasMore && data.pagination.endCursor) {
  ({ data } = await memberstack.queryDataRecords({
    table: 'articles',
    query: { findMany: { orderBy: { createdAt: 'desc' }, take: 20, after: String(data.pagination.endCursor) } }
  }));
}