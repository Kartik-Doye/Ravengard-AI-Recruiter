import rateLimit from "express-rate-limit";

export const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many admin requests, please slow down.",
  handler: (req, res, next, options) => {
    const err = new Error(options.message as string || 'Too Many Requests');
    (err as any).status = 429;
    next(err);
  }
});
