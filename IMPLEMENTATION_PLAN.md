# Serverless Scraper Implementation Plan

## ✅ Completed
1. Created Supabase schema (scraper_sessions, scraper_businesses, scraper_logs)
2. Created supabaseSessionStore.ts with all CRUD operations
3. Updated /api/scrape/start to create sessions in Supabase
4. Created /api/scrape/process to handle one town at a time
5. Created /api/scrape/status-poll for polling-based status checks
6. Tables verified in Supabase

## 🔄 Next Steps

### 1. Update Client Store (scraper.ts)
Replace SSE with polling:
- Remove `eventSource` and `connectToSSE/disconnectSSE`
- Add `pollingInterval` state
- Add `startPolling()` and `stopPolling()` methods
- Poll `/api/scrape/status-poll` every 2-3 seconds
- Call `/api/scrape/process` to trigger processing

### 2. Update Start Scraping Flow
```typescript
startScraping() {
  // 1. Call /api/scrape/start (creates session in Supabase)
  // 2. Start polling loop
  // 3. In polling loop:
  //    - Call /api/scrape/status-poll (get current state)
  //    - If status === 'running' or 'pending', call /api/scrape/process
  //    - Update UI with latest data
  //    - Repeat until status === 'completed' or 'stopped'
}
```

### 3. Update Other API Routes
- `/api/scrape/stop` - Update Supabase session status
- `/api/scrape/pause` - Update Supabase session status  
- `/api/scrape/resume` - Update Supabase session status

### 4. Test Flow
1. User clicks "Start"
2. Session created in Supabase
3. Client starts polling
4. Each poll triggers processing of next town
5. UI updates from Supabase data
6. Continues until all towns processed

## Key Benefits
- ✅ Works on Vercel serverless
- ✅ Data persists in Supabase
- ✅ Can resume if interrupted
- ✅ No VPS needed
- ✅ Aligns with Supabase-first architecture

## Files to Modify
- [ ] src/store/scraper.ts (replace SSE with polling)
- [ ] src/app/api/scrape/stop/[sessionId]/route.ts
- [ ] src/app/api/scrape/pause/[sessionId]/route.ts
- [ ] src/app/api/scrape/resume/[sessionId]/route.ts
- [ ] Test locally
- [ ] Deploy to Vercel
- [ ] Test on Vercel

## Current Status
Ready to implement client-side polling. All backend infrastructure is in place.
