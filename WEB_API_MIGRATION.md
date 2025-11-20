# Web Frontend API Migration (Optional)

## Current State

The web frontend currently uses:
- **Server Actions** for mutations (adding downloads, updating settings)
- **Direct database queries** in Server Components for data fetching

## Recommendation: Migrate to REST API

You asked about using the newly built REST API for the web frontend. This is a **good idea** for several reasons:

### Benefits

1. **Consistency**: Both web and iOS apps use the same API
2. **Easier Testing**: Can test API endpoints independently
3. **Better Separation**: Clear boundary between frontend and backend
4. **Debugging**: Easier to debug with network inspector
5. **Future-Proof**: Easier to add other clients (Android, desktop, etc.)

### Migration Strategy

#### Phase 1: Authentication (Already Done)
The login/logout flow already uses proper session management that works with both Server Actions and REST API.

#### Phase 2: Downloads (Recommended)
Replace Server Actions in `app/actions.ts` with API calls:

**Before (Server Action):**
```typescript
// app/actions.ts
export async function addDownload(formData: FormData) {
  await db.insert(downloads).values({...});
}
```

**After (API Call):**
```typescript
// lib/api-client.ts
export async function addDownload(url: string, customFilename?: string, targetPath?: string) {
  const response = await fetch('/api/downloads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, customFilename, targetPath })
  });
  return response.json();
}
```

#### Phase 3: Settings & Paths
Similar migration for settings and path shortcuts.

### Current Hybrid Approach (Also Valid)

You can also keep the current hybrid approach:
- **Web**: Uses Server Actions (faster, no HTTP overhead)
- **iOS**: Uses REST API (necessary for native apps)

This is perfectly fine and actually quite common in Next.js applications.

### Decision

**My Recommendation**: 
- Keep Server Actions for now (they work well)
- Use REST API only for iOS
- Migrate to REST API later if you need:
  - Multiple clients
  - Better API testing
  - Microservices architecture

The current setup is efficient and follows Next.js best practices. The REST API is there when you need it!

## If You Want to Migrate

If you decide to migrate the web frontend to use the REST API, I can help you:

1. Create a client-side API wrapper (`lib/api-client.ts`)
2. Update all components to use `fetch` instead of Server Actions
3. Add proper error handling and loading states
4. Implement optimistic updates for better UX

Just let me know!
