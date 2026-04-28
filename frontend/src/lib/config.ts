// Runtime configuration
let runtimeConfig: {
  API_BASE_URL: string;
} | null = null;

// Configuration loading state
let configLoading = true;

// Default fallback configuration
// Empty string => use same-origin relative URLs (works on any deploy domain)
const defaultConfig = {
  API_BASE_URL: '',
};

// Detects unresolved template placeholders like "$$backend_domain$$", "{{...}}", "${...}".
// These leak through when an env var wasn't substituted at deploy time. If we detect one,
// we fall back to same-origin relative URLs so the app still works.
function isPlaceholderURL(url: unknown): boolean {
  if (typeof url !== 'string' || !url) return true;
  return (
    url.includes('$$') ||
    /\$\{[^}]*\}/.test(url) ||
    /\{\{[^}]*\}\}/.test(url) ||
    url.includes('backend_domain')
  );
}

function normalizeBaseURL(url: string | undefined | null): string {
  if (!url) return '';
  if (isPlaceholderURL(url)) return '';
  // Strip trailing slash so `${base}/api/v1/...` never produces a double slash.
  return url.replace(/\/+$/, '');
}

// Function to load runtime configuration
export async function loadRuntimeConfig(): Promise<void> {
  try {
    console.log('🔧 DEBUG: Starting to load runtime config...');
    // Try to load configuration from a config endpoint
    const response = await fetch('/api/config');
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      // Only parse as JSON if the response is actually JSON
      if (contentType && contentType.includes('application/json')) {
        runtimeConfig = await response.json();
        console.log('Runtime config loaded successfully');
      } else {
        console.log(
          'Config endpoint returned non-JSON response, skipping runtime config'
        );
      }
    } else {
      console.log(
        '🔧 DEBUG: Config fetch failed with status:',
        response.status
      );
    }
  } catch (error) {
    console.log('Failed to load runtime config, using defaults:', error);
  } finally {
    configLoading = false;
    console.log(
      '🔧 DEBUG: Config loading finished, configLoading set to false'
    );
  }
}

// Get current configuration
export function getConfig() {
  // If config is still loading, return default config to avoid using stale Vite env vars
  if (configLoading) {
    return defaultConfig;
  }

  // First try runtime config (for Lambda). Sanitize against unresolved placeholders.
  if (runtimeConfig) {
    return {
      API_BASE_URL: normalizeBaseURL(runtimeConfig.API_BASE_URL),
    };
  }

  // Then try Vite environment variables (for local development)
  const viteVal = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (viteVal && !isPlaceholderURL(viteVal)) {
    return {
      API_BASE_URL: normalizeBaseURL(viteVal),
    };
  }

  // Finally fall back to default (same-origin relative URLs)
  return defaultConfig;
}

// Dynamic API_BASE_URL getter - this will always return the current config.
// Returns an empty string to mean "use same-origin relative URLs".
export function getAPIBaseURL(): string {
  return getConfig().API_BASE_URL;
}

// For backward compatibility, but this should be avoided
// Removed static export to prevent using stale config values
// export const API_BASE_URL = getAPIBaseURL();

export const config = {
  get API_BASE_URL() {
    return getAPIBaseURL();
  },
};
