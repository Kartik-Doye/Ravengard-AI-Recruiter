const fs = require('fs');
let file = fs.readFileSync('server.ts', 'utf8');

// Insert the global error handler before app.listen
const globalErrorHandler = `
  // Global error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err.status === 429 || err.statusCode === 429 || err.message === 'Too Many Requests') {
      res.status(429).json({ error: "Too many requests, please try again later.", retryAfter: res.getHeader('Retry-After') });
      return;
    }
    console.error("Global Error Handler:", err);
    res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
  });

  const server = app.listen(PORT, "0.0.0.0", () => {
`;

if (!file.includes('Global error handler')) {
    file = file.replace('const server = app.listen(PORT, "0.0.0.0", () => {', globalErrorHandler);
}

// And update the rate limiter to pass the error to the global handler
const globalLimiterUpdate = `
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    const err = new Error(options.message.error || 'Too Many Requests');
    (err as any).status = 429;
    next(err);
  }
});

const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    const err = new Error(options.message.error || 'Too Many Requests');
    (err as any).status = 429;
    next(err);
  }
});
`;

// Replace existing limiters
const limitersStart = file.indexOf('const globalLimiter = rateLimit({');
const limitersEnd = file.indexOf('app.use(globalLimiter);');
if (limitersStart !== -1 && limitersEnd !== -1) {
    file = file.substring(0, limitersStart) + globalLimiterUpdate + '\n' + file.substring(limitersEnd);
}

fs.writeFileSync('server.ts', file);
