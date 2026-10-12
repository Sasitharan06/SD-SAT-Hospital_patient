// shared/logger.js
// Uniform request logging and correlation ID tracking middleware

function requestLogger(serviceName) {
  return (req, res, next) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] || `req-${Math.random().toString(36).substring(2, 9)}`;
    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);
    res.setHeader('X-Service-Name', serviceName);

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;
      const statusEmoji = statusCode >= 500 ? '🔥' : statusCode >= 400 ? '⚠️' : '✅';

      console.log(
        `[${serviceName}] ${statusEmoji} ${req.method} ${req.originalUrl || req.url} ` +
        `HTTP/${req.httpVersion} -> ${statusCode} (${duration}ms) [ID: ${requestId}]`
      );
    });

    next();
  };
}

module.exports = { requestLogger };
