# Serverless Scraper Architecture for Vercel

## Problem
The original scraper used in-memory sessions and SSE (Server-Sent Events), which don't work on Vercel's serverless platform because:
- Each API route runs in an isolated serverless function
- No shared memory between functions
- SSE connections are unreliable in serverless

## Solution
Redesigned architecture using Supabase as the state store:

### Architecture Components

1. **Supabase Tables**
   - `scraper_sessions` - Stores session metadata, status, progress
   - `scraper_businesses` - Stores scraped business data
   - `scraper_logs` - Stores activity logs

2. **API Routes**
   - `/api/scrape/start` - Creates session in Supabase (returns immediately)
   - `/api/scrape/process` - Processes one town at a time (called repeatedly)
   - `/api/scrape/status/[sessionId]` - Returns current status from Supabase (polling)

3. **Client-Side**
   - Polls `/api/scrape/status` every 2-3 seconds
   - Calls `/api/scrape/process` repeatedly until complete
   - Updates UI from Supabase data

### How It Works

1. User clicks "Start Scraping"
2. Client calls `/api/scrape/start` → Creates session in Supabase
3. Client starts polling loop:
   - Call `/api/scrape/process` → Processes next town
   - Call `/api/scrape/status` → Get updated progress
   - Repeat until status = 'completed'
4. All data persists in Supabase

### Benefits
✅ Works on Vercel serverless
✅ Data persists across function invocations
✅ Can resume if interrupted
✅ Aligns with your goal of storing everything in Supabase
✅ No VPS needed

### Implementation Status
- [x] Supabase schema created
- [x] Supabase session store implemented
- [x] `/api/scrape/process` route created
- [x] `/api/scrape/start` updated to use Supabase
- [ ] Client-side polling implementation needed
- [ ] Update other API routes (stop, pause, resume)
- [ ] Test on Vercel

### Next Steps
1. Run the SQL schema in your Supabase dashboard
2. Update client-side store to use polling
3. Test locally then deploy to Vercel
