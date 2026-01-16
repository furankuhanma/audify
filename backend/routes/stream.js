const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const AudioService = require('../services/audioService');
const Track = require('../models/Track'); // ✅ Added Track model

// Initialize audio service
const audioService = new AudioService();

/**
 * GET /api/stream/:videoId
 * Stream MP3 audio using Hybrid Logic (DB -> Local Storage -> YouTube Fallback)
 */
router.get('/:videoId', async (req, res) => {
  const { videoId } = req.params;

  try {
    // 1. Validate videoId format
    if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return res.status(400).json({
        error: 'Invalid video ID',
        message: 'Video ID must be 11 characters'
      });
    }

    console.log(`🎵 Stream request: ${videoId}`);

    // 2. CHECK DATABASE FIRST (Hybrid Logic)
    let filePath;
    let isCached = false;
    const track = await Track.findByVideoId(videoId);

    if (track && track.isDownloaded && track.localPath && fs.existsSync(track.localPath)) {
      // ✅ DATABASE HIT: File exists on server disk
      filePath = track.localPath;
      isCached = true;
      console.log(`⚡ Serving directly from Server Storage: ${videoId}`);
    } else {
      // 🐌 DATABASE MISS: Download from YouTube
      console.log(`📡 Not on server. Fetching from YouTube: ${videoId}`);
      const audioData = await audioService.downloadAudio(videoId);
      filePath = audioData.filePath;
      isCached = audioData.cached;
    }

    // 3. Check if file is actually ready on disk
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: 'File Error',
        message: 'Audio could not be retrieved from storage'
      });
    }

    // 4. Record the play in history
    Track.recordPlay(videoId).catch(err => console.error('Play log error:', err));

    // 5. Stream with Range Support (for seeking)
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

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
        'Cache-Control': 'public, max-age=86400',
        'X-Content-Type-Options': 'nosniff',
        'X-Source': isCached ? 'local-disk' : 'youtube-download'
      });

      fileStream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'audio/mpeg',
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=86400',
        'X-Content-Type-Options': 'nosniff',
        'X-Source': isCached ? 'local-disk' : 'youtube-download'
      });

      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    }

  } catch (error) {
    console.error(`❌ Stream error for ${videoId}:`, error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Streaming failed', message: error.message });
    }
  }
});

/**
 * GET /api/stream/info/:videoId
 */
router.get('/info/:videoId', async (req, res) => {
  const { videoId } = req.params;
  try {
    const track = await Track.findByVideoId(videoId);
    
    // Fallback to service if not in DB
    const audioData = await audioService.downloadAudio(videoId);
    const stat = fs.statSync(audioData.filePath);

    res.json({
      videoId,
      url: `/api/stream/${videoId}`,
      isDownloaded: track ? track.isDownloaded : false,
      fileSizeMB: (stat.size / (1024 * 1024)).toFixed(2),
      localPath: audioData.filePath
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get info', message: error.message });
  }
});

/**
 * DELETE /api/stream/:videoId
 * Clears file and updates DB status
 */
router.delete('/:videoId', async (req, res) => {
  const { videoId } = req.params;
  try {
    const deleted = await audioService.deleteAudio(videoId);
    if (deleted) {
      // ✅ Update DB: Mark as no longer downloaded
      await database.query(
        'UPDATE tracks SET is_downloaded = 0, local_path = NULL WHERE video_id = ?',
        [videoId]
      );
      res.json({ message: 'Deleted from server storage', videoId });
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/stats/storage', async (req, res) => {
  try {
    const stats = await audioService.getStorageStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/cleanup', async (req, res) => {
  try {
    await audioService.cleanupOldFiles();
    res.json({ message: 'Cleanup completed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;