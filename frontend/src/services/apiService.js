/**
 * API Service - Axios instance for API calls
 */

const API_URL = '/api';

// Create axios-like functions for API calls
const api = {
  async request(method, endpoint, data = null, token = null) {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      method,
      headers
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_URL}${endpoint}`, options);
    const responseData = await response.json();

    if (!response.ok) {
      throw {
        status: response.status,
        message: responseData.message || 'API Error',
        data: responseData
      };
    }

    return responseData;
  },

  get(endpoint, token) {
    return this.request('GET', endpoint, null, token);
  },

  post(endpoint, data, token) {
    return this.request('POST', endpoint, data, token);
  },

  put(endpoint, data, token) {
    return this.request('PUT', endpoint, data, token);
  },

  patch(endpoint, data, token) {
    return this.request('PATCH', endpoint, data, token);
  },

  delete(endpoint, token) {
    return this.request('DELETE', endpoint, null, token);
  }
};

// Auth API calls
export const authAPI = {
  register(username, email, password, confirmPassword) {
    return api.post('/auth/register', {
      username,
      email,
      password,
      confirmPassword
    });
  },

  login(email, password) {
    return api.post('/auth/login', { email, password });
  },

  getProfile(token) {
    return api.get('/auth/profile', token);
  },

  updateProfile(data, token) {
    return api.put('/auth/profile', data, token);
  },

  logout(token) {
    return api.post('/auth/logout', {}, token);
  }
};

export const userAPI = {
  searchUsers(query, token) {
    return api.get(`/users/search?q=${encodeURIComponent(query)}`, token);
  }
};

// File API calls
export const fileAPI = {
  uploadFile(formData, token) {
    return fetch(`${API_URL}/files/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    }).then(res => res.json());
  },

  getMyFiles(page = 1, limit = 10, token) {
    return api.get(`/files?page=${page}&limit=${limit}`, token);
  },

  getFileDetails(fileId, token) {
    return api.get(`/files/${fileId}`, token);
  },

  downloadFile(fileId, token) {
    return fetch(`${API_URL}/files/${fileId}/download`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  shareFile(fileId, shareWith, role, token) {
    return api.post(`/files/${fileId}/share`, { shareWith, role }, token);
  },

  revokeAccess(fileId, revokeFrom, token) {
    return api.post(`/files/${fileId}/revoke`, { revokeFrom }, token);
  },

  deleteFile(fileId, token) {
    return api.delete(`/files/${fileId}`, token);
  }
};

export default api;
