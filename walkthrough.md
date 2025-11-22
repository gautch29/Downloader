# Walkthrough - Add Download ETA Feature

I have added a feature to display the download speed and estimated time remaining (ETA) for active downloads.

## Changes

### 1. Database Schema
Added `speed` and `eta` columns to the `downloads` table.

**File:** `db/schema.ts`
```typescript
speed: integer('speed'), // bytes per second
eta: integer('eta'), // estimated seconds remaining
```

### 2. Backend Logic
Updated the worker to calculate speed and ETA during the download process.
- **Speed:** Calculated based on bytes downloaded since the last check (every ~2 seconds).
- **ETA:** Calculated as `(Total Size - Downloaded Size) / Speed`.

**File:** `worker.ts`
```typescript
// Calculate speed and ETA
const timeDiff = (now - lastSpeedTime) / 1000; // seconds
const bytesDiff = downloadedBytes - lastSpeedBytes;
speed = Math.floor(bytesDiff / timeDiff);
eta = Math.floor(remainingBytes / speed);
```

### 3. Frontend UI
Updated the `DownloadCard` to display the speed and ETA when a download is in progress.
- **Speed:** Displayed in MB/s.
- **ETA:** Displayed in seconds or "Xm Ys" format.

**File:** `components/download-card.tsx`
```tsx
{download.speed ? `${(download.speed / 1024 / 1024).toFixed(1)} MB/s` : ...}
{download.eta < 60 ? `${download.eta}s` : ...}
```

## Verification Results

### Manual Verification
- **Speed Display:** Verified that speed is displayed in MB/s.
- **ETA Display:** Verified that ETA is displayed and updates as the download progresses.
- **Completion:** Verified that speed/ETA disappear when download completes (status changes).
