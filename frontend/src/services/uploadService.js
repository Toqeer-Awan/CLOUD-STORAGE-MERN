import api from '../redux/api/api';

class UploadService {
  constructor() {
    this.uploads = new Map(); // Track ongoing uploads
    this.partSize = 10 * 1024 * 1024; // 10MB per part
    this.maxRetries = 5;
    this.timeout = 120000; // 2 minutes timeout
    this._onProgress = null; // Initialize progress callback
  }

  // Step 1: Initialize upload with backend
  async initializeUpload(file, folderPath = '') {
    try {
      // Determine if multipart is needed
      const isVideo = file.type?.startsWith('video/');
      const useMultipart = isVideo ? file.size > 50 * 1024 * 1024 : file.size > 100 * 1024 * 1024;
      
      // Include folder path in filename if provided
      const fullPath = folderPath ? `${folderPath}/${file.name}` : file.name;
      
      console.log('📤 Initializing upload:', {
        filename: fullPath,
        size: (file.size / (1024 * 1024)).toFixed(2) + 'MB',
        type: file.type,
        useMultipart,
        isVideo,
        folderPath
      });

      const response = await api.post('/files/init', {
        filename: fullPath,
        originalName: file.name,
        size: file.size,
        mimetype: file.type,
        useMultipart,
        folderPath: folderPath || null
      });

      const { fileId, presignedUrl, uploadId, partUrls, expiresIn } = response.data;

      // Store upload context
      this.uploads.set(fileId, {
        file,
        fileId,
        uploadId,
        partUrls: partUrls || [],
        presignedUrl,
        status: 'initialized',
        progress: 0,
        uploadedParts: [],
        startTime: Date.now(),
        retryCount: 0,
        isVideo,
        folderPath,
        fullPath
      });

      console.log('✅ Upload initialized:', {
        fileId,
        useMultipart: !!uploadId,
        partCount: partUrls?.length || 0
      });

      return {
        fileId,
        presignedUrl,
        uploadId,
        partUrls: partUrls || [],
        expiresIn,
        useMultipart
      };
    } catch (error) {
      console.error('❌ Init upload failed:', error);
      throw this._handleError(error);
    }
  }

  // Step 2: Upload directly to B2 (simple upload)
  async uploadSimple(fileId, presignedUrl) {
    const upload = this.uploads.get(fileId);
    if (!upload) throw new Error('Upload not found');

    try {
      upload.status = 'uploading';
      
      return await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // Track progress
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            upload.progress = progress;
            // Fix: Use a local reference to emitProgress
            if (this._onProgress) {
              this._onProgress({ fileId, progress });
            }
          }
        });

        xhr.timeout = upload.isVideo ? 300000 : this.timeout;
        
        xhr.ontimeout = () => {
          upload.status = 'failed';
          reject(new Error(`Upload timeout after ${xhr.timeout/1000} seconds`));
        };

        xhr.open('PUT', presignedUrl, true);
        xhr.setRequestHeader('Content-Type', upload.file.type);
        
        xhr.onload = () => {
          if (xhr.status === 200) {
            const etag = xhr.getResponseHeader('ETag')?.replace(/"/g, '');
            resolve({ etag });
          } else {
            reject(new Error(`Upload failed: ${xhr.status} - ${xhr.statusText}`));
          }
        };
        
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.upload.onerror = () => reject(new Error('Upload error'));
        
        xhr.send(upload.file);
      });
    } catch (error) {
      upload.status = 'failed';
      throw error;
    }
  }

  // Step 2: Upload multipart to B2
  async uploadMultipart(fileId) {
    const upload = this.uploads.get(fileId);
    if (!upload) throw new Error('Upload not found');

    if (!upload.partUrls || !Array.isArray(upload.partUrls) || upload.partUrls.length === 0) {
      throw new Error('No part URLs available for multipart upload');
    }

    try {
      upload.status = 'uploading';
      
      const parts = [];
      const totalParts = upload.partUrls.length;
      
      console.log(`📦 Starting multipart upload with ${totalParts} parts for ${upload.file.name}`);

      for (let i = 0; i < totalParts; i++) {
        const part = upload.partUrls[i];
        
        if (!part || !part.url || !part.partNumber) {
          throw new Error(`Invalid part data at index ${i}`);
        }

        const start = i * this.partSize;
        const end = Math.min(start + this.partSize, upload.file.size);
        const chunk = upload.file.slice(start, end);
        
        let retries = 0;
        let success = false;
        let result;
        
        while (!success && retries < this.maxRetries) {
          try {
            console.log(`📤 Uploading part ${part.partNumber}/${totalParts}`);
            result = await this._uploadPart(part, chunk, upload.isVideo);
            success = true;
          } catch (error) {
            retries++;
            console.warn(`⚠️ Part ${part.partNumber} failed (attempt ${retries}/${this.maxRetries})`);
            if (retries === this.maxRetries) {
              throw new Error(`Part ${part.partNumber} failed after ${retries} retries`);
            }
            await new Promise(r => setTimeout(r, 2000 * Math.pow(2, retries)));
          }
        }
        
        parts.push({
          PartNumber: part.partNumber,
          ETag: result.etag
        });
        
        upload.progress = Math.round(((i + 1) / totalParts) * 100);
        upload.uploadedParts = parts;
        
        // Fix: Use a local reference to emitProgress
        if (this._onProgress) {
          this._onProgress({ fileId, progress: upload.progress });
        }
      }
      
      upload.status = 'uploaded';
      return { parts };
      
    } catch (error) {
      upload.status = 'failed';
      throw error;
    }
  }

  // Upload a single part
  _uploadPart(part, chunk, isVideo = false) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.timeout = isVideo ? 120000 : 60000;
      
      xhr.ontimeout = () => reject(new Error(`Part ${part.partNumber} timeout`));
      
      xhr.open('PUT', part.url, true);
      xhr.setRequestHeader('Content-Type', 'application/octet-stream');
      
      xhr.onload = () => {
        if (xhr.status === 200) {
          const etag = xhr.getResponseHeader('ETag')?.replace(/"/g, '');
          if (!etag) {
            reject(new Error(`Part ${part.partNumber} - No ETag received`));
          } else {
            resolve({ etag });
          }
        } else {
          reject(new Error(`Part ${part.partNumber} failed: ${xhr.status}`));
        }
      };
      
      xhr.onerror = () => reject(new Error(`Part ${part.partNumber} network error`));
      xhr.upload.onerror = () => reject(new Error(`Part ${part.partNumber} upload error`));
      
      xhr.send(chunk);
    });
  }

  // Step 3: Finalize upload
  async finalizeUpload(fileId, parts = null) {
    const upload = this.uploads.get(fileId);
    if (!upload) throw new Error('Upload not found');

    try {
      const response = await api.post('/files/finalize', {
        fileId,
        parts: parts || upload.uploadedParts
      });

      upload.status = 'completed';
      this.uploads.delete(fileId);
      
      return response.data;
    } catch (error) {
      upload.status = 'failed';
      throw this._handleError(error);
    }
  }

  // Full upload flow for single file
  async uploadFile(file, onProgress = null, folderPath = '') {
    try {
      // Set the progress callback
      if (onProgress) {
        this._onProgress = onProgress;
      }
      
      const { fileId, presignedUrl, uploadId, partUrls, useMultipart } = await this.initializeUpload(file, folderPath);
      
      let result;
      
      if (useMultipart && uploadId) {
        const { parts } = await this.uploadMultipart(fileId);
        result = await this.finalizeUpload(fileId, parts);
      } else {
        await this.uploadSimple(fileId, presignedUrl);
        result = await this.finalizeUpload(fileId);
      }
      
      // Clear progress callback
      this._onProgress = null;
      
      return result;
      
    } catch (error) {
      // Clear progress callback on error
      this._onProgress = null;
      throw error;
    }
  }

  // Get upload progress
  getProgress(fileId) {
    const upload = this.uploads.get(fileId);
    return upload ? upload.progress : 0;
  }

  // Cancel upload
  cancelUpload(fileId) {
    const upload = this.uploads.get(fileId);
    if (upload) {
      upload.status = 'cancelled';
      this.uploads.delete(fileId);
    }
  }

  // Get all active uploads
  getActiveUploads() {
    const active = [];
    this.uploads.forEach((upload, fileId) => {
      if (upload.status === 'uploading' || upload.status === 'retrying') {
        active.push({
          fileId,
          name: upload.file.name,
          progress: upload.progress,
          status: upload.status
        });
      }
    });
    return active;
  }

  // Error handler
  _handleError(error) {
    if (error.response) {
      return new Error(error.response.data?.error || error.response.data?.message || 'Server error');
    } else if (error.request) {
      return new Error('Network error - please check your connection');
    } else {
      return error;
    }
  }
}

// Singleton instance
export default new UploadService();