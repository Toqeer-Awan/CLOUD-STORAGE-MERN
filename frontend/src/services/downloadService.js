import api from '../redux/api/api';

class DownloadService {
  async getViewUrl(fileId) {
    try {
      const response = await api.get(`/files/${fileId}/view-url`);
      return response.data;
    } catch (error) {
      console.error('Get view URL error:', error);
      throw error;
    }
  }

  async getDownloadUrl(fileId) {
    try {
      const response = await api.get(`/files/${fileId}/download-url`);
      return response.data;
    } catch (error) {
      console.error('Get download URL error:', error);
      throw error;
    }
  }

  async viewFile(fileId, filename) {
    try {
      const { viewUrl } = await this.getViewUrl(fileId);
      window.open(viewUrl, '_blank');
      return { success: true };
    } catch (error) {
      console.error('View failed:', error);
      throw error;
    }
  }

  async downloadFile(fileId, filename) {
    try {
      const { downloadUrl } = await this.getDownloadUrl(fileId);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return { success: true };
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  }
}

export default new DownloadService();