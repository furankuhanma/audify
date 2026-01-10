const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const AudioService = require('../services/audioService');

// Initialize audio service
const audioService = new AudioService();

/**
 * GET /api/stream/:videoId
 * Stream MP3 audio for a YouTube video
 */
router.get('/:videoId', async (req, res) => {
  const { videoId } = req.params;

  try {
    // Validate videoId format
    if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return res.status(400).json({ 
        error: 'Invalid video ID',
        message: 'Video ID must be 11 characters (YouTube format)'
      });
    }

    console.log(`🎵 Stream request for: ${videoId}`);

    // Download/get audio file
    const audioData = await audioService.downloadAudio(videoId);
    const filePath = audioData.filePath;

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        error: 'Audio file not found',
        message: 'The audio file could not be located on the server'
      });
    }

    // Get file stats
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    // Support range requests (for seeking in audio player)
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = (end - start) + 1;

      const fileStream = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      });

      fileStream.pipe(res);
    } else {
      // Full file stream
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'audio/mpeg',
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=86400',
      });

      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    }

    console.log(`✅ Streaming: ${videoId} ${audioData.cached ? '(cached)' : '(new)'}`);

  } catch (error) {
    console.error(`❌ Stream error for ${videoId}:`, error);
    
    // Don't send headers if already sent
    if (res.headersSent) {
      return res.end();
    }

    res.status(500).json({ 
      error: 'Streaming failed',
      message: error.message,
      videoId: videoId
    });
  }
});

/**
 * GET /api/stream/info/:videoId
 * Get audio file info without streaming
 */
router.get('/info/:videoId', async (req, res) => {
  const { videoId } = req.params;

  try {
    const audioData = await audioService.downloadAudio(videoId);
    const filePath = audioData.filePath;

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Audio file not found' });
    }

    const stat = fs.statSync(filePath);

    res.json({
      videoId,
      url: `/api/stream/${videoId}`,
      cached: audioData.cached,
      fileSize: stat.size,
      fileSizeMB: (stat.size / (1024 * 1024)).toFixed(2),
      createdAt: stat.birthtime,
      lastAccessed: stat.atime
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get audio info',
      message: error.message 
    });
  }
});

/**
 * DELETE /api/stream/:videoId
 * Delete cached audio file
 */
router.delete('/:videoId', async (req, res) => {
  const { videoId } = req.params;

  try {
    const deleted = await audioService.deleteAudio(videoId);

    if (deleted) {
      res.json({ 
        message: 'Audio file deleted successfully',
        videoId 
      });
    } else {
      res.status(404).json({ 
        error: 'Audio file not found',
        videoId 
      });
    }

  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to delete audio',
      message: error.message 
    });
  }
});

/**
 * GET /api/stream/stats
 * Get storage statistics
 */
router.get('/stats/storage', async (req, res) => {
  try {
    const stats = await audioService.getStorageStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get storage stats',
      message: error.message 
    });
  }
});

/**
 * POST /api/stream/cleanup
 * Manually trigger cleanup of old files
 */
router.post('/cleanup', async (req, res) => {
  try {
    await audioService.cleanupOldFiles();
    const stats = await audioService.getStorageStats();
    
    res.json({ 
      message: 'Cleanup completed',
      stats 
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Cleanup failed',
      message: error.message 
    });
  }
});

module.exports = router;