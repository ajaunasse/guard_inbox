import env from '#start/env'

export default {
  redis: {
    host: env.get('REDIS_HOST', '127.0.0.1'),
    port: env.get('REDIS_PORT', 6379),
    password: env.get('REDIS_PASSWORD'),
  },

  queues: {
    emailScan: {
      name: 'email-scan',
      concurrency: 5, // Process 5 jobs simultaneously
      attempts: 3, // Retry failed jobs 3 times
      backoff: {
        type: 'exponential',
        delay: 5000, // Start with 5s delay, then 10s, 20s...
      },
    },
  },
}
