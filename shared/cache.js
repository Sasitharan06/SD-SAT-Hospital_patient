// shared/cache.js
// Dual-mode cache: In-Memory TTL Cache with Redis compatibility fallback

class CacheManager {
  constructor() {
    this.store = new Map();
    this.hits = 0;
    this.misses = 0;
    this.redisClient = null;
  }

  async get(key) {
    if (this.redisClient) {
      try {
        const val = await this.redisClient.get(key);
        if (val) {
          this.hits++;
          return JSON.parse(val);
        }
      } catch (err) {
        console.warn('[Cache] Redis get error, fallback to memory:', err.message);
      }
    }

    const item = this.store.get(key);
    if (!item) {
      this.misses++;
      return null;
    }

    if (Date.now() > item.expiry) {
      this.store.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return item.value;
  }

  async set(key, value, ttlSeconds = 60) {
    if (this.redisClient) {
      try {
        await this.redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
      } catch (err) {
        console.warn('[Cache] Redis set error, fallback to memory:', err.message);
      }
    }

    this.store.set(key, {
      value,
      expiry: Date.now() + ttlSeconds * 1000
    });
    return true;
  }

  async del(key) {
    if (this.redisClient) {
      try {
        await this.redisClient.del(key);
      } catch (e) {}
    }
    this.store.delete(key);
  }

  async flush() {
    this.store.clear();
  }

  getStats() {
    return {
      activeKeys: this.store.size,
      hits: this.hits,
      misses: this.misses,
      hitRatio: this.hits + this.misses > 0 
        ? ((this.hits / (this.hits + this.misses)) * 100).toFixed(1) + '%' 
        : '0%',
      type: this.redisClient ? 'Redis + Memory' : 'In-Memory (Redis Fallback Mode)'
    };
  }
}

module.exports = new CacheManager();
