const API_URL = '/api';

const emitUnauthorized = (message) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('securesphere:unauthorized', {
        detail: { message }
      })
    );
  }
};

export const buildSecurityHeaders = () => ({
  'X-Nonce': crypto.randomUUID(),
  'X-Timestamp': Date.now().toString()
});

export const buildReplayDemoHeaders = (token, nonce, timestamp) => ({
  'Content-Type': 'application/json',
  'X-Nonce': nonce,
  'X-Timestamp': timestamp.toString(),
  Authorization: `Bearer ${token}`
});

const buildHeaders = (token = null, contentType = 'application/json') => {
  const headers = {
    ...buildSecurityHeaders()
  };

  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const parseResponse = async (response, { authProtected = false } = {}) => {
  const responseData = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (authProtected && response.status === 401) {
      emitUnauthorized(responseData.message || 'Your session is no longer valid. Please login again.');
    }

    throw {
      status: response.status,
      message: responseData.message || 'API Error',
      data: responseData
    };
  }

  return responseData;
};

const api = {
  async request(method, endpoint, data = null, token = null) {
    const options = {
      method,
      headers: buildHeaders(token)
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_URL}${endpoint}`, options);
    return parseResponse(response, { authProtected: Boolean(token) });
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

export const authAPI = {
  register(payload) {
    return api.post('/auth/register', payload);
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
  },

  getAllUsers(token) {
    return api.get('/users', token);
  },

  getPatients(token) {
    return api.get('/users/patients', token);
  },

  getSystemActivity(token) {
    return api.get('/users/activity', token);
  }
};

export const fileAPI = {
  uploadFile(formData, token) {
    return fetch(`${API_URL}/files/upload`, {
      method: 'POST',
      headers: {
        ...buildSecurityHeaders(),
        Authorization: `Bearer ${token}`
      },
      body: formData
    }).then((response) => parseResponse(response, { authProtected: true }));
  },

  getMyFiles(page = 1, limit = 10, token) {
    return api.get(`/files?page=${page}&limit=${limit}`, token);
  },

  getFileDetails(fileId, token) {
    return api.get(`/files/${fileId}`, token);
  },

  getRecentAuditActivity(token) {
    return api.get('/files/audit/recent', token);
  },

  getAuditLogs(fileId, token) {
    return api.get(`/files/${fileId}/audit`, token);
  },

  getFileContent(fileId, token) {
    return api.get(`/files/${fileId}/content`, token);
  },

  async runReplayDemo(fileId, token) {
    const nonce = crypto.randomUUID();
    const timestamp = Date.now();
    const headers = buildReplayDemoHeaders(token, nonce, timestamp);

    const firstResponse = await fetch(`${API_URL}/files/${fileId}/replay-demo`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ simulation: 'replay-attack-demo', attempt: 1 })
    });
    const firstResult = await parseResponse(firstResponse, { authProtected: true });

    const secondResponse = await fetch(`${API_URL}/files/${fileId}/replay-demo`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ simulation: 'replay-attack-demo', attempt: 2 })
    });

    let secondResult = null;
    let secondError = null;

    try {
      secondResult = await parseResponse(secondResponse, { authProtected: true });
    } catch (error) {
      secondError = error;
    }

    return {
      nonce,
      timestamp,
      firstResult,
      secondResult,
      secondError
    };
  },

  downloadFile(fileId, token) {
    return fetch(`${API_URL}/files/${fileId}/download`, {
      method: 'GET',
      headers: {
        ...buildSecurityHeaders(),
        Authorization: `Bearer ${token}`
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

export const patientAPI = {
  uploadFile(formData, token) {
    return fetch(`${API_URL}/patient/files/upload`, {
      method: 'POST',
      headers: {
        ...buildSecurityHeaders(),
        Authorization: `Bearer ${token}`
      },
      body: formData
    }).then((response) => parseResponse(response, { authProtected: true }));
  },

  getMyFiles(page = 1, limit = 20, token) {
    return api.get(`/patient/files?page=${page}&limit=${limit}`, token);
  },

  getActivity(token) {
    return api.get('/patient/activity', token);
  },

  shareWithDoctor(fileId, shareWith, role, token) {
    return api.post(`/patient/files/${fileId}/share`, { shareWith, role }, token);
  }
};

export const doctorAPI = {
  getPatients(token) {
    return api.get('/doctor/patients', token);
  },

  getAccessibleFiles(page = 1, limit = 20, token) {
    return api.get(`/doctor/files?page=${page}&limit=${limit}`, token);
  },

  getActivity(token) {
    return api.get('/doctor/activity', token);
  }
};

export const adminAPI = {
  getUsers(token) {
    return api.get('/admin/users', token);
  },

  deleteUser(userId, token) {
    return api.delete(`/admin/users/${userId}`, token);
  },

  getFiles(page = 1, limit = 20, token) {
    return api.get(`/admin/files?page=${page}&limit=${limit}`, token);
  },

  getActivity(token) {
    return api.get('/admin/activity', token);
  },

  getSecurityStatus(token) {
    return api.get('/admin/security-status', token);
  }
};

export default api;
