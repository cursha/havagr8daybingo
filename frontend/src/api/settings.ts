import { apiClient } from '../lib/apiClient';

export interface EnvVariable {
  key: string;
  value: string;
  description: string;
}

export interface EnvConfig {
  backend_vars: Record<string, EnvVariable>;
  frontend_vars: Record<string, EnvVariable>;
}

export const settingsApi = {
  async getConfig(): Promise<EnvConfig> {
    return apiClient.get<EnvConfig>('/admin-settings/');
  },

  async updateBackendConfig(key: string, value: string): Promise<{ message: string }> {
    return apiClient.put<{ message: string }>(`/admin-settings/backend/${key}`, { value });
  },

  async updateFrontendConfig(key: string, value: string): Promise<{ message: string }> {
    return apiClient.put<{ message: string }>(`/admin-settings/frontend/${key}`, { value });
  },

  async addBackendConfig(key: string, value: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`/admin-settings/backend/${key}`, { value });
  },

  async addFrontendConfig(key: string, value: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`/admin-settings/frontend/${key}`, { value });
  },

  async deleteBackendConfig(key: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/admin-settings/backend/${key}`);
  },

  async deleteFrontendConfig(key: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/admin-settings/frontend/${key}`);
  },
};
