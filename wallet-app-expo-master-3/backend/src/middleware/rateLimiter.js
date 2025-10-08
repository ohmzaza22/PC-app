// Rate limiting disabled when Redis is not configured
const rateLimiter = async (req, res, next) => {
  // Skip rate limiting if REDIS_URL is not set
  if (!process.env.REDIS_URL) {
    return next();
  }

  try {
    const ratelimit = await import("../config/upstash.js");
    const { success } = await ratelimit.default.limit("my-rate-limit");

    if (!success) {
      return res.status(429).json({
        message: "Too many requests, please try again later.",
      });
    }

    next();
  } catch (error) {
    console.log("Rate limit error (skipping):", error.message);
    next(); // Continue without rate limiting if Redis fails
  }
};

export default rateLimiter;
