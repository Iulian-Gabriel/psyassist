import rateLimit from "express-rate-limit";

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // 100 requests per windowMs
  standardHeaders: true,
  message: { message: "Too many requests, please try again later." },
});

// Stricter limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10, // 10 login/register attempts per windowMs
  standardHeaders: true,
  message: {
    message: "Too many authentication attempts, please try again later.",
  },
});
