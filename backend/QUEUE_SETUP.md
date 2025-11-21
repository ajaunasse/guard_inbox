# Queue System Setup with BullMQ & Redis

This guide explains how to set up and use the asynchronous queue system for email scanning.

## 🏗️ Architecture

Guard Inbox uses **BullMQ** with **Redis** for background job processing:

- **Queue:** BullMQ (Redis-based)
- **Workers:** Background processes that execute scan jobs
- **Jobs:** Email scanning tasks stored in Redis

### Why use a queue?

1. **Asynchronous processing**: API responses are instant, scanning happens in the background
2. **Scalability**: Can process multiple scans concurrently
3. **Resilience**: Auto-retry failed jobs with exponential backoff
4. **Monitoring**: Track job status (pending, in-progress, completed, failed)

---

## 🚀 Quick Start with Docker

### 1. Start services (PostgreSQL + Redis)

```bash
# From project root
docker-compose up -d

# Check services are running
docker-compose ps
```

### 2. Configure environment

```bash
cd backend
cp .env.example .env

# Update .env with:
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_DATABASE=guard_inbox

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
```

### 3. Run migrations

```bash
node ace migration:run
```

### 4. Start the backend

```bash
npm run dev
```

The queue worker starts automatically with the application! 🎉

---

## 📊 How it works

### Flow diagram

```
User clicks "Scan Now"
         ↓
  POST /api/scans
         ↓
Create ScanJob (status: PENDING)
         ↓
Add job to Redis queue
         ↓
Return 201 (job queued)
         ↓
   [Asynchronous]
         ↓
Worker picks up job
         ↓
Update status: IN_PROGRESS
         ↓
Fetch emails from Gmail
         ↓
Extract promo codes with AI
         ↓
Save to database
         ↓
Update status: COMPLETED
```

### Code flow

**1. Controller receives request:**

```typescript
// app/controllers/scans_controller.ts
async store({ request, response, auth, bouncer }: HttpContext) {
  // Create scan job
  const scanJob = await ScanJob.create({
    userId: user.id,
    emailAccountId: account.id,
    status: 'PENDING',
  })

  // Add to queue (non-blocking)
  await addEmailScanJob(scanJob.id, account.id)

  // Return immediately
  return response.created({
    ...scanJob.toJSON(),
    message: 'Scan job queued successfully'
  })
}
```

**2. Queue service processes job:**

```typescript
// app/services/queue_service.ts
const worker = new Worker('email-scan', async (job) => {
  const { scanJobId, emailAccountId } = job.data

  // Update status
  const scanJob = await ScanJob.findOrFail(scanJobId)
  scanJob.status = 'IN_PROGRESS'
  await scanJob.save()

  // Perform scan
  const emailsScanned = await scanService.scan(emailAccount)

  // Mark as completed
  scanJob.status = 'COMPLETED'
  scanJob.emailsScanned = emailsScanned
  await scanJob.save()
})
```

---

## 🔧 Configuration

Queue settings in `config/queue.ts`:

```typescript
export default {
  redis: {
    host: env.get('REDIS_HOST', '127.0.0.1'),
    port: env.get('REDIS_PORT', 6379),
    password: env.get('REDIS_PASSWORD'),
  },

  queues: {
    emailScan: {
      name: 'email-scan',
      concurrency: 5, // Process 5 jobs at once
      attempts: 3, // Retry failed jobs 3 times
      backoff: {
        type: 'exponential',
        delay: 5000, // 5s → 10s → 20s
      },
    },
  },
}
```

### Adjusting concurrency

For better performance, increase concurrency:

```typescript
concurrency: 10 // Process 10 scans simultaneously
```

⚠️ **Warning:** Higher concurrency means more API calls to Gmail/OpenAI. Consider rate limits!

---

## 📈 Monitoring

### Check queue stats

Add an endpoint to monitor queue health:

```typescript
// app/controllers/scans_controller.ts
import { getQueueStats } from '#services/queue_service'

async stats({ response }: HttpContext) {
  const stats = await getQueueStats()
  return response.ok(stats)
}
```

**Example response:**

```json
{
  "waiting": 3,
  "active": 2,
  "completed": 45,
  "failed": 1,
  "delayed": 0
}
```

### View logs

Worker logs automatically show job progress:

```bash
# Terminal output
🚀 Starting queue workers...
✅ Email scan worker started
📨 Scan job 123 added to queue with ID: bullmq:email-scan:1
Processing scan job 123...
✅ Job completed: 50 emails scanned
```

---

## 🐛 Troubleshooting

### Redis connection errors

```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Solution:**

```bash
# Check Redis is running
docker-compose ps

# Restart Redis
docker-compose restart redis
```

### Jobs stuck in "PENDING"

**Possible causes:**

1. Worker not started (check logs for "Queue workers started")
2. Redis connection issue
3. Worker crashed (check error logs)

**Solution:**

```bash
# Restart backend to restart worker
npm run dev
```

### Jobs failing repeatedly

Check the `error` column in `scan_jobs` table:

```sql
SELECT id, status, error, emails_scanned
FROM scan_jobs
WHERE status = 'FAILED'
ORDER BY created_at DESC
LIMIT 10;
```

Common errors:

- **OAuth token expired**: User needs to reconnect Gmail account
- **OpenAI rate limit**: Reduce concurrency or add delay
- **Network timeout**: Increase timeout in Gmail service

---

## 🎯 Best Practices

### 1. Handle expired tokens gracefully

```typescript
// In worker
try {
  await scanService.scan(emailAccount)
} catch (error) {
  if (error.message.includes('invalid_grant')) {
    // Token expired - notify user to reconnect
    scanJob.error = 'Gmail account needs to be reconnected'
  }
  throw error
}
```

### 2. Rate limiting

Add delays between API calls:

```typescript
// In GmailMessageFetcher
async fetchMessages(accessToken, refreshToken, maxResults = 50) {
  // Fetch messages...

  // Add delay to respect rate limits
  await new Promise(resolve => setTimeout(resolve, 1000))
}
```

### 3. Job priorities

For urgent scans (e.g., manual user trigger), add priority:

```typescript
await emailScanQueue.add('scan', data, {
  priority: 1, // Higher priority (lower number = higher priority)
  attempts: 3,
})
```

---

## 🚀 Production Deployment

### Environment variables

```env
# Production Redis (e.g., Redis Cloud)
REDIS_HOST=redis-12345.c1.us-east-1.rds.amazonaws.com
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_TLS=true
```

### Redis Cloud setup

1. Create Redis instance on [Redis Cloud](https://redis.com/try-free/)
2. Get connection details
3. Update `.env` with production credentials
4. Redis Cloud handles backups, scaling, monitoring

### Separate worker process (optional)

For high-scale applications, run workers separately:

```bash
# In one terminal (API only)
npm start

# In another terminal (Workers only)
node ace queue:work
```

Create `commands/queue_work.ts`:

```typescript
import { BaseCommand } from '@adonisjs/core/ace'
import { startEmailScanWorker } from '#services/queue_service'

export default class QueueWork extends BaseCommand {
  static commandName = 'queue:work'
  static description = 'Start queue workers'

  async run() {
    this.logger.info('Starting queue workers...')
    startEmailScanWorker()

    // Keep process alive
    await new Promise(() => {})
  }
}
```

### Monitoring with Bull Board (optional)

Add a visual dashboard:

```bash
npm install @bull-board/api @bull-board/express
```

```typescript
// start/routes.ts (admin only)
import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { ExpressAdapter } from '@bull-board/express'
import { emailScanQueue } from '#services/queue_service'

const serverAdapter = new ExpressAdapter()
createBullBoard({
  queues: [new BullMQAdapter(emailScanQueue)],
  serverAdapter,
})

router.use('/admin/queues', serverAdapter.getRouter())
```

Access at: `http://localhost:3333/admin/queues`

---

## 📚 Resources

- [BullMQ Documentation](https://docs.bullmq.io/)
- [Redis Documentation](https://redis.io/docs/)
- [AdonisJS Background Jobs](https://docs.adonisjs.com/guides/background-jobs)

---

**Built with ❤️ using BullMQ & Redis**
