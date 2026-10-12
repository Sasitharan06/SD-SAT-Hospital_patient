// shared/eventBus.js
// Asynchronous Message Queue / Event Bus (RabbitMQ-compatible simulation pattern)
const EventEmitter = require('events');

class EventBus extends EventEmitter {
  constructor() {
    super();
    this.messageLog = [];
    this.queueStats = {
      published: 0,
      consumed: 0,
      queues: {
        'appointment.booked': 0,
        'appointment.cancelled': 0,
        'prescription.created': 0
      }
    };
  }

  // Publish event to topic queue
  publish(topic, payload) {
    this.queueStats.published++;
    if (this.queueStats.queues[topic] !== undefined) {
      this.queueStats.queues[topic]++;
    }

    const message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      topic,
      payload,
      timestamp: new Date().toISOString()
    };

    this.messageLog.unshift(message);
    if (this.messageLog.length > 50) this.messageLog.pop();

    console.log(`[EventBus / RabbitMQ] 📤 Published event to '${topic}':`, message.id);

    // Asynchronous dispatch (simulating decoupled worker delivery)
    setImmediate(() => {
      this.emit(topic, message);
    });

    return message;
  }

  // Subscribe worker to topic
  subscribe(topic, handler) {
    console.log(`[EventBus / RabbitMQ] 📥 Worker subscribed to '${topic}'`);
    this.on(topic, async (message) => {
      try {
        this.queueStats.consumed++;
        await handler(message);
      } catch (err) {
        console.error(`[EventBus / RabbitMQ] ❌ Error processing message ${message.id} on '${topic}':`, err.message);
      }
    });
  }

  getStats() {
    return {
      type: 'Local EventQueue (RabbitMQ Fallback Pattern)',
      totalPublished: this.queueStats.published,
      totalConsumed: this.queueStats.consumed,
      activeQueues: this.queueStats.queues,
      recentMessages: this.messageLog.slice(0, 10)
    };
  }
}

// Global singleton across the backend Node processes
module.exports = new EventBus();
