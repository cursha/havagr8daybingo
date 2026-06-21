/**
 * Battle test for Issue #17 — Anonymous Play (client side).
 *
 * Verifies the new auth client methods hit the correct additive endpoints,
 * skip the bearer header (these are unauthenticated calls), and persist the
 * returned token so the player is immediately logged in.
 *
 * The edge endpoints + migration are verified by the integration smoke test in
 * MANUAL_TESTING.md (TEST-003); they can't run in this unit harness.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/apiClient', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  getAuthToken: vi.fn(),
  setAuthToken: vi.fn(),
  clearAuthToken: vi.fn(),
}));

import { authApi } from '@/lib/auth';
import { apiClient, setAuthToken } from '@/lib/apiClient';

const post = vi.mocked(apiClient.post);
const mockSetToken = vi.mocked(setAuthToken);

const TOKEN_RESPONSE = {
  token: 'anon-token-123',
  token_type: 'bearer',
  user_id: 'u-anon',
  email: null,
  username: 'HappyMoose27',
  role: 'user',
  registration_type: 'anonymous' as const,
};

beforeEach(() => vi.clearAllMocks());

describe('authApi.registerAnonymous (Issue #17)', () => {
  it('posts nickname + password to the anonymous register endpoint and stores the token', async () => {
    post.mockResolvedValueOnce(TOKEN_RESPONSE);

    const res = await authApi.registerAnonymous({ nickname: 'HappyMoose27', password: 'secret123' });

    expect(post).toHaveBeenCalledWith(
      '/auth-custom/register-anonymous',
      { nickname: 'HappyMoose27', password: 'secret123' },
      { skipAuth: true }
    );
    expect(mockSetToken).toHaveBeenCalledWith('anon-token-123');
    expect(res.registration_type).toBe('anonymous');
    expect(res.email).toBeNull();
  });
});

describe('authApi.loginAnonymous (Issue #17)', () => {
  it('posts nickname + password to the anonymous login endpoint and stores the token', async () => {
    post.mockResolvedValueOnce(TOKEN_RESPONSE);

    await authApi.loginAnonymous({ nickname: 'HappyMoose27', password: 'secret123' });

    expect(post).toHaveBeenCalledWith(
      '/auth-custom/login-anonymous',
      { nickname: 'HappyMoose27', password: 'secret123' },
      { skipAuth: true }
    );
    expect(mockSetToken).toHaveBeenCalledWith('anon-token-123');
  });

  it('does not store a token when the login call fails', async () => {
    post.mockRejectedValueOnce(new Error('Invalid nickname or password.'));

    await expect(
      authApi.loginAnonymous({ nickname: 'HappyMoose27', password: 'wrong' })
    ).rejects.toThrow('Invalid nickname or password.');
    expect(mockSetToken).not.toHaveBeenCalled();
  });
});
