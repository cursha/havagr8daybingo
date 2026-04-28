/**
 * Custom email/password authentication client.
 *
 * Replaces the previous OIDC redirect flow. The backend issues a JWT on
 * register/login; we store it in `localStorage` and attach it as a Bearer
 * token on every API request via `apiClient`.
 */
import { apiClient, clearAuthToken, getAuthToken, setAuthToken } from './apiClient';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: string;
  last_login?: string;
}

export interface AuthTokenResponse {
  token: string;
  token_type: string;
  user_id: string;
  email: string;
  username?: string | null;
  role: string;
}

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

class AuthApi {
  async getCurrentUser(): Promise<AuthUser | null> {
    if (!getAuthToken()) return null;
    try {
      return await apiClient.get<AuthUser>('/auth-custom/me');
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 401) {
        clearAuthToken();
        return null;
      }
      throw err instanceof Error ? err : new Error('Failed to fetch user');
    }
  }

  async register(input: RegisterInput): Promise<AuthTokenResponse> {
    const data = await apiClient.post<AuthTokenResponse>(
      '/auth-custom/register',
      input,
      { skipAuth: true }
    );
    setAuthToken(data.token);
    return data;
  }

  async login(input: LoginInput): Promise<AuthTokenResponse> {
    const data = await apiClient.post<AuthTokenResponse>(
      '/auth-custom/login',
      input,
      { skipAuth: true }
    );
    setAuthToken(data.token);
    return data;
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth-custom/logout');
    } catch {
      // logout is stateless server-side; ignore errors
    } finally {
      clearAuthToken();
    }
  }
}

export const authApi = new AuthApi();