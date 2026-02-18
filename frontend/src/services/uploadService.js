import api from '../redux/api/api';

class UploadService {
  constructor() {
    this.uploads = new Map(); // Track ongoing uploads
    this.partSize = 5 * 1024 * 1024; // 5MB per part (B2 recommended)
    this.maxRetries = 3;
  }

  // Step 1: Initialize upload with backend
  async initializeUpload(file) {
    try {
      // Determine if multipart is needed (B2 handles large files better with multipart)
      const useMultipart = file.size > 100 * 1024 * 1024; // >100MB use multipart
      
      const response = await api.post('/files/init', {
        filename: file.name,
        size: file.size,
        mimetype: file.type,
        useMultipart
      });

      const { fileId, presignedUrl, uploadId, partUrls, expiresIn } = response.data;

      // Store upload context
      this.uploads.set(fileId, {
        file,
        fileId,
        uploadId,
        partUrls,
        presignedUrl,
        status: 'initialized',
        progress: 0,
        uploadedParts: [],
        startTime: Date.now(),
        retryCount: 0
      });

      return {
        fileId,
        presignedUrl,
        uploadId,
        partUrls,
        expiresIn,
        useMultipart
      };
    } catch (error) {
      console.error('Init upload failed:', error);
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
            this._emitProgress(fileId, progress);
          }
        });

        // Set up timeouts
        xhr.timeout = 30000; // 30 seconds
        xhr.ontimeout = () => {
          upload.status = 'failed';
          reject(new Error('Upload timeout'));
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

    try {
      upload.status = 'uploading';
      
      const parts = [];
      const totalParts = upload.partUrls.length;
      
      // Upload each part with retry logic
      for (let i = 0; i < totalParts; i++) {
        const part = upload.partUrls[i];
        const start = i * this.partSize;
        const end = Math.min(start + this.partSize, upload.file.size);
        const chunk = upload.file.slice(start, end);
        
        // Upload part with retry
        let retries = 0;
        let success = false;
        let result;
        
        while (!success && retries < this.maxRetries) {
          try {
            result = await this._uploadPart(part, chunk);
            success = true;
          } catch (error) {
            retries++;
            if (retries === this.maxRetries) {
              throw new Error(`Part ${part.partNumber} failed after ${retries} retries`);
            }
            // Wait before retry (exponential backoff)
            await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retries)));
          }
        }
        
        parts.push({
          PartNumber: part.partNumber,
          ETag: result.etag
        });
        
        // Update progress
        upload.progress = Math.round(((i + 1) / totalParts) * 100);
        upload.uploadedParts = parts;
        this._emitProgress(fileId, upload.progress);
      }
      
      upload.status = 'uploaded';
      return { parts };
      
    } catch (error) {
      upload.status = 'failed';
      throw error;
    }
  }

  // Upload a single part
  _uploadPart(part, chunk) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.timeout = 30000;
      xhr.ontimeout = () => reject(new Error(`Part ${part.partNumber} timeout`));
      
      xhr.open('PUT', part.url, true);
      xhr.setRequestHeader('Content-Type', 'application/octet-stream');
      
      xhr.onload = () => {
        if (xhr.status === 200) {
          resolve({
            etag: xhr.getResponseHeader('ETag')?.replace(/"/g, '')
          });
        } else {
          reject(new Error(`Part ${part.partNumber} failed: ${xhr.status}`));
        }
      };
      
      xhr.onerror = () => reject(new Error(`Part ${part.partNumber} network error`));
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

  // Full upload flow (auto-detects multipart)
  async uploadFile(file, onProgress = null) {
    try {
      // Step 1: Initialize
      const { fileId, presignedUrl, uploadId, partUrls, useMultipart } = await this.initializeUpload(file);
      
      if (onProgress) {
        this._onProgress = onProgress;
      }
      
      let result;
      
      if (useMultipart) {
        // Step 2: Multipart upload
        const { parts } = await this.uploadMultipart(fileId);
        
        // Step 3: Finalize
        result = await this.finalizeUpload(fileId, parts);
      } else {
        // Step 2: Simple upload
        await this.uploadSimple(fileId, presignedUrl);
        
        // Step 3: Finalize
        result = await this.finalizeUpload(fileId);
      }
      
      return result;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  }

  // Retry failed upload
  async retryUpload(fileId) {
    const upload = this.uploads.get(fileId);
    if (!upload) throw new Error('Upload not found');
    
    upload.retryCount++;
    upload.status = 'retrying';
    
    if (upload.uploadId) {
      // Multipart - need to restart from beginning
      // B2 doesn't support resuming multipart easily
      return this.uploadFile(upload.file, this._onProgress);
    } else {
      // Simple upload - can retry with same URL if not expired
      const timeElapsed = (Date.now() - upload.startTime) / 1000;
      if (timeElapsed < 900) { // URL still valid (15 min)
        await this.uploadSimple(fileId, upload.presignedUrl);
        return this.finalizeUpload(fileId);
      } else {
        // URL expired, restart
        return this.uploadFile(upload.file, this._onProgress);
      }
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

  // Progress event emitter
  _emitProgress(fileId, progress) {
    if (this._onProgress) {
      this._onProgress({ fileId, progress });
    }
  }

  // Error handler
  _handleError(error) {
    if (error.response) {
      // Server responded with error
      return new Error(error.response.data.error || 'Server error');
    } else if (error.request) {
      // Request made but no response
      return new Error('Network error - please check your connection');
    } else {
      // Something else
      return error;
    }
  }
}

// Singleton instance
export default new UploadService();