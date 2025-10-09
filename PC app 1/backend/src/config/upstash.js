import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

import "dotenv/config";

let ratelimit = null;

// Check if Redis environment variables are properly configured
const hasRedisConfig = 
  process.env.UPSTASH_REDIS_REST_URL && 
  process.env.UPSTASH_REDIS_REST_TOKEN &&
  process.env.UPSTASH_REDIS_REST_URL !== '/pipeline';

if (!hasRedisConfig) {
  console.warn('⚠️  Redis not configured. Rate limiting disabled.');
  console.warn('💡 To enable rate limiting, set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env');
} else {
  try {
    ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(100, "60 s"),
    });
    console.log('✅ Rate limiting enabled with Redis');
  } catch (error) {
    console.error('❌ Failed to initialize Redis rate limiter:', error.message);
    ratelimit = null;
  }
}

export default ratelimit;
