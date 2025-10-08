import ratelimit from "../config/upstash.js";

// Rate limiting middleware
const rateLimiter = async (req, res, next) => {
  // Skip rate limiting if Redis is not configured
  if (!ratelimit) {
    return next();
  }

  try {
    const { success } = await ratelimit.limit(`api_${req.ip}`);

    if (!success) {
      return res.status(429).json({
        message: "Too many requests, please try again later.",
      });
    }

    next();
  } catch (error) {
    console.error("Rate limit error (skipping):", error.message);
    next(); // Continue without rate limiting if Redis fails
  }
};

export default rateLimiter;
