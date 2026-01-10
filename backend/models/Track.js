const database = require('../config/database');

class Track {
  /**
   * Save or update track in database
   * @param {Object} trackData - Track information from YouTube
   * @returns {Promise<Object>} - Saved track with database ID
   */
  static async save(trackData) {
    try {
      const {
        videoId,
        title,
        artist,
        album = 'YouTube Music',
        coverUrl,
        duration,
        channelTitle,
        viewCount = 0
      } = trackData;

      // Check if track already exists
      const existing = await this.findByVideoId(videoId);

      if (existing) {
        // Update existing track
        await database.query(
          `UPDATE tracks 
           SET title = ?, artist = ?, album = ?, cover_url = ?, 
               duration = ?, channel_title = ?, view_count = ?
           WHERE video_id = ?`,
          [title, artist, album, coverUrl, duration, channelTitle, viewCount, videoId]
        );

        return { ...existing, ...trackData, id: existing.id };
      } else {
        // Insert new track
        const result = await database.query(
          `INSERT INTO tracks (video_id, title, artist, album, cover_url, duration, channel_title, view_count)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [videoId, title, artist, album, coverUrl, duration, channelTitle, viewCount]
        );

        return {
          id: result.insertId,
          ...trackData
        };
      }
    } catch (error) {
      console.error('Error saving track:', error);
      throw error;
    }
  }

  /**
   * Find track by video ID
   * @param {string} videoId
   * @returns {Promise<Object|null>}
   */
  static async findByVideoId(videoId) {
    try {
      const rows = await database.query(
        'SELECT * FROM tracks WHERE video_id = ?',
        [videoId]
      );

      return rows.length > 0 ? this.formatTrack(rows[0]) : null;
    } catch (error) {
      console.error('Error finding track:', error);
      throw error;
    }
  }

  /**
   * Find track by database ID
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    try {
      const rows = await database.query(
        'SELECT * FROM tracks WHERE id = ?',
        [id]
      );

      return rows.length > 0 ? this.formatTrack(rows[0]) : null;
    } catch (error) {
      console.error('Error finding track by ID:', error);
      throw error;
    }
  }

  /**
   * Get all tracks with pagination
   * @param {number} limit
   * @param {number} offset
   * @returns {Promise<Array>}
   */
  static async getAll(limit = 50, offset = 0) {
    try {
      const rows = await database.query(
        'SELECT * FROM tracks ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [limit, offset]
      );

      return rows.map(row => this.formatTrack(row));
    } catch (error) {
      console.error('Error getting all tracks:', error);
      throw error;
    }
  }

  /**
   * Get most played tracks
   * @param {number} limit
   * @returns {Promise<Array>}
   */
  static async getMostPlayed(limit = 20) {
    try {
      const rows = await database.query(
        'SELECT * FROM tracks WHERE play_count > 0 ORDER BY play_count DESC, last_played_at DESC LIMIT ?',
        [limit]
      );

      return rows.map(row => this.formatTrack(row));
    } catch (error) {
      console.error('Error getting most played tracks:', error);
      throw error;
    }
  }

  /**
   * Get recently played tracks
   * @param {number} limit
   * @returns {Promise<Array>}
   */
  static async getRecentlyPlayed(limit = 20) {
    try {
      const rows = await database.query(
        `SELECT t.*, h.played_at 
         FROM tracks t
         INNER JOIN listening_history h ON t.id = h.track_id
         ORDER BY h.played_at DESC
         LIMIT ?`,
        [limit]
      );

      return rows.map(row => this.formatTrack(row));
    } catch (error) {
      console.error('Error getting recently played:', error);
      throw error;
    }
  }

  /**
   * Increment play count and add to listening history
   * @param {string} videoId
   * @returns {Promise<void>}
   */
  static async recordPlay(videoId) {
    try {
      await database.transaction(async (connection) => {
        // Get track ID
        const [tracks] = await connection.execute(
          'SELECT id FROM tracks WHERE video_id = ?',
          [videoId]
        );

        if (tracks.length === 0) {
          throw new Error('Track not found');
        }

        const trackId = tracks[0].id;

        // Update play count and last played time
        await connection.execute(
          'UPDATE tracks SET play_count = play_count + 1, last_played_at = NOW() WHERE id = ?',
          [trackId]
        );

        // Add to listening history
        await connection.execute(
          'INSERT INTO listening_history (track_id) VALUES (?)',
          [trackId]
        );
      });

      console.log(`✅ Recorded play for: ${videoId}`);
    } catch (error) {
      console.error('Error recording play:', error);
      throw error;
    }
  }

  /**
   * Search tracks in database
   * @param {string} query
   * @param {number} limit
   * @returns {Promise<Array>}
   */
  static async search(query, limit = 20) {
    try {
      const searchTerm = `%${query}%`;
      const rows = await database.query(
        `SELECT * FROM tracks 
         WHERE title LIKE ? OR artist LIKE ? OR album LIKE ?
         ORDER BY play_count DESC
         LIMIT ?`,
        [searchTerm, searchTerm, searchTerm, limit]
      );

      return rows.map(row => this.formatTrack(row));
    } catch (error) {
      console.error('Error searching tracks:', error);
      throw error;
    }
  }

  /**
   * Delete track by video ID
   * @param {string} videoId
   * @returns {Promise<boolean>}
   */
  static async delete(videoId) {
    try {
      const result = await database.query(
        'DELETE FROM tracks WHERE video_id = ?',
        [videoId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting track:', error);
      throw error;
    }
  }

  /**
   * Get total track count
   * @returns {Promise<number>}
   */
  static async count() {
    try {
      const rows = await database.query('SELECT COUNT(*) as count FROM tracks');
      return rows[0].count;
    } catch (error) {
      console.error('Error counting tracks:', error);
      throw error;
    }
  }

  /**
   * Get listening statistics for a track
   * @param {string} videoId
   * @returns {Promise<Object>}
   */
  static async getStats(videoId) {
    try {
      const track = await this.findByVideoId(videoId);
      
      if (!track) {
        return null;
      }

      // Get play history count by date
      const historyRows = await database.query(
        `SELECT DATE(played_at) as date, COUNT(*) as plays
         FROM listening_history
         WHERE track_id = ?
         GROUP BY DATE(played_at)
         ORDER BY date DESC
         LIMIT 30`,
        [track.id]
      );

      return {
        track,
        totalPlays: track.playCount,
        lastPlayed: track.lastPlayedAt,
        playHistory: historyRows
      };
    } catch (error) {
      console.error('Error getting track stats:', error);
      throw error;
    }
  }

  /**
   * Batch save multiple tracks
   * @param {Array} tracks - Array of track data
   * @returns {Promise<Array>}
   */
  static async batchSave(tracks) {
    try {
      const savedTracks = [];

      for (const track of tracks) {
        const saved = await this.save(track);
        savedTracks.push(saved);
      }

      console.log(`✅ Batch saved ${savedTracks.length} tracks`);
      return savedTracks;
    } catch (error) {
      console.error('Error batch saving tracks:', error);
      throw error;
    }
  }

  /**
   * Format database row to frontend format
   * @param {Object} row - Database row
   * @returns {Object}
   */
  static formatTrack(row) {
    return {
      id: row.video_id, // Use video_id as the track ID for frontend
      videoId: row.video_id,
      dbId: row.id, // Keep database ID for internal use
      title: row.title,
      artist: row.artist,
      album: row.album,
      coverUrl: row.cover_url,
      duration: row.duration,
      channelTitle: row.channel_title,
      viewCount: row.view_count,
      playCount: row.play_count,
      createdAt: row.created_at,
      lastPlayedAt: row.last_played_at
    };
  }
}

module.exports = Track;