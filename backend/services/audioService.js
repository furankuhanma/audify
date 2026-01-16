const youtubedl = require('youtube-dl-exec');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs').promises;
const path = require('path');
const Track = require('../models/Track'); // ✅ Import Track model

class AudioService {
  constructor() {
    this.audioDir = process.env.AUDIO_STORAGE_DIR || '/var/www/vibestream/audio';
    this.tempDir = process.env.TEMP_STORAGE_DIR || '/tmp/vibestream';
    this.maxCacheSizeMB = parseInt(process.env.MAX_CACHE_SIZE_MB) || 5000;
    
    this.ensureDirectories();
  }

  async ensureDirectories() {
    try {
      await fs.mkdir(this.audioDir, { recursive: true });
      await fs.mkdir(this.tempDir, { recursive: true });
      console.log('✅ Audio directories initialized');
    } catch (error) {
      console.error('❌ Failed to create directories:', error);
    }
  }

  /**
   * Download and convert YouTube video to MP3
   * Automatically updates DB local status on success
   */
  async downloadAudio(videoId) {
    const outputFilename = `${videoId}.mp3`;
    const outputPath = path.join(this.audioDir, outputFilename);
    const tempPath = path.join(this.tempDir, `${videoId}_temp`);

    try {
      // 1. Double check if file exists (Safety Check)
      const exists = await this.fileExists(outputPath);
      if (exists) {
        return { videoId, filePath: outputPath, cached: true };
      }

      console.log(`⬇️ Starting YouTube Download: ${videoId}`);

      // 2. Download audio using yt-dlp logic
      await youtubedl(`https://www.youtube.com/watch?v=${videoId}`, {
        extractAudio: true,
        audioFormat: 'mp3',
        audioQuality: '192K',
        output: tempPath,
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
        addHeader: ['referer:youtube.com', 'user-agent:googlebot']
      });

      const files = await fs.readdir(this.tempDir);
      const downloadedFile = files.find(f => f.startsWith(`${videoId}_temp`));
      
      if (!downloadedFile) throw new Error('Downloaded file not found');
      const downloadedPath = path.join(this.tempDir, downloadedFile);

      // 3. Convert & Normalize
      await this.convertToMP3(downloadedPath, outputPath);

      // 4. Update Database (Hybrid Logic) ✅
      const stats = await fs.stat(outputPath);
      const fileSizeMB = parseFloat((stats.size / (1024 * 1024)).toFixed(2));
      
      await Track.updateLocalStatus(videoId, outputPath, fileSizeMB);

      // 5. Cleanup
      await fs.unlink(downloadedPath).catch(() => {});
      await this.cleanupOldFiles();

      return {
        videoId,
        filePath: outputPath,
        url: `/audio/${outputFilename}`,
        cached: false
      };

    } catch (error) {
      console.error(`❌ Download failed for ${videoId}:`, error.message);
      await this.cleanupTempFiles(videoId);
      throw error;
    }
  }

  async convertToMP3(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .toFormat('mp3')
        .audioBitrate('192k')
        .audioFilters('loudnorm') 
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .save(outputPath);
    });
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async getStorageUsage() {
    try {
      const files = await fs.readdir(this.audioDir);
      let totalSize = 0;
      for (const file of files) {
        const stats = await fs.stat(path.join(this.audioDir, file));
        totalSize += stats.size / (1024 * 1024);
      }
      return totalSize;
    } catch {
      return 0;
    }
  }

  async cleanupOldFiles() {
    try {
      const totalSize = await this.getStorageUsage();
      if (totalSize > this.maxCacheSizeMB) {
        const files = await fs.readdir(this.audioDir);
        const fileStats = [];

        for (const file of files) {
          const filePath = path.join(this.audioDir, file);
          const stats = await fs.stat(filePath);
          fileStats.push({ name: file, path: filePath, atime: stats.atime });
        }

        fileStats.sort((a, b) => a.atime - b.atime);

        // Delete oldest 20%
        const deleteCount = Math.ceil(fileStats.length * 0.2);
        for (let i = 0; i < deleteCount; i++) {
          await fs.unlink(fileStats[i].path);
          // Sync DB: Mark as not downloaded anymore
          const vId = fileStats[i].name.replace('.mp3', '');
          await Track.updateLocalStatus(vId, null, 0); 
          // Note: we can modify updateLocalStatus or add a specific reset method
        }
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  async deleteAudio(videoId) {
    const filePath = path.join(this.audioDir, `${videoId}.mp3`);
    try {
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async getStorageStats() {
    const files = await fs.readdir(this.audioDir);
    const totalSize = await this.getStorageUsage();
    return {
      totalFiles: files.length,
      totalSizeMB: parseFloat(totalSize.toFixed(2)),
      maxSizeMB: this.maxCacheSizeMB,
      usagePercent: parseFloat(((totalSize / this.maxCacheSizeMB) * 100).toFixed(2))
    };
  }

  async cleanupTempFiles(videoId) {
    try {
      const files = await fs.readdir(this.tempDir);
      const tempFiles = files.filter(f => f.startsWith(`${videoId}_temp`));
      for (const file of tempFiles) {
        await fs.unlink(path.join(this.tempDir, file)).catch(() => {});
      }
    } catch {}
  }
}

module.exports = AudioService;