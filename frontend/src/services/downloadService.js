import api from '../redux/api/api';

class DownloadService {
  async getDownloadUrl(fileId) {
    try {
      const response = await api.get(`/files/${fileId}/download-url`);
      return response.data;
    } catch (error) {
      console.error('Get download URL error:', error);
      throw this._handleError(error);
    }
  }

  async getViewUrl(fileId) {
    try {
      const response = await api.get(`/files/${fileId}/view-url`);
      return response.data;
    } catch (error) {
      console.error('Get view URL error:', error);
      throw this._handleError(error);
    }
  }

  async downloadFile(fileId, filename) {
    try {
      // Get presigned URL
      const { downloadUrl, expiresIn } = await this.getDownloadUrl(fileId);
      
      // Create download link
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return { 
        success: true,
        expiresIn
      };
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  }

  async viewFile(fileId, filename) {
    try {
      // Get presigned view URL
      const { viewUrl, expiresIn } = await this.getViewUrl(fileId);
      
      // Open in new tab
      window.open(viewUrl, '_blank', 'noopener,noreferrer');
      
      return { 
        success: true,
        expiresIn
      };
    } catch (error) {
      console.error('View failed:', error);
      throw error;
    }
  }

  // For large files, get download URL only (let browser handle)
  async getDownloadLink(fileId) {
    const { downloadUrl } = await this.getDownloadUrl(fileId);
    return downloadUrl;
  }

  _handleError(error) {
    if (error.response) {
      return new Error(error.response.data.error || 'Download failed');
    } else if (error.request) {
      return new Error('Network error - please check your connection');
    }
    return error;
  }
}

export default new DownloadService();