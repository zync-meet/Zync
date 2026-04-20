const express = require('express');
const router = express.Router();
const { getWebhookQueueMetrics } = require('../services/webhookQueue');

const bytesToMb = (bytes) => Number((bytes / (1024 * 1024)).toFixed(2));

router.get('/metrics', (_req, res) => {
  const memoryUsage = process.memoryUsage();
  const queueMetrics = getWebhookQueueMetrics();

  return res.json({
    memoryMb: {
      rss: bytesToMb(memoryUsage.rss),
      heapUsed: bytesToMb(memoryUsage.heapUsed),
      heapTotal: bytesToMb(memoryUsage.heapTotal),
    },
    webhookQueue: {
      depth: queueMetrics.depth,
      lagMs: queueMetrics.lagMs,
      processing: queueMetrics.processing,
      trackedJobs: queueMetrics.trackedJobs,
    },
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
