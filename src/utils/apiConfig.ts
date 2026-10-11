/**
 * Centralized API configuration for PixelIsolate frontend.
 * Ensures the app seamlessly connects to the Render backend service
 * (https://pixelisolate-backend.onrender.com) whether running locally or
 * deployed on Cloudflare Pages without build-time VITE_API_URL set.
 */

export const API_BASE_URL: string = (
  import.meta.env.VITE_API_URL || "https://pixelisolate-backend.onrender.com"
)
  .trim()
  .replace(/\/+$/, "");

/**
 * Returns a full backend URL for a given API endpoint path.
 */
export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}

/**
 * Converts a storage/vault URL or file key into a proxy stream URL
 * served by the backend at /api/vault/file/:key.
 * This completely avoids 401 Unauthorized errors caused by direct
 * Cloudflare R2 bucket access.
 */
export function getVaultProxyUrl(urlOrKey: string): string {
  if (!urlOrKey) return "";
  if (urlOrKey.startsWith("blob:") || urlOrKey.startsWith("data:")) {
    return urlOrKey;
  }

  // If already a backend vault proxy stream URL, preserve it
  if (urlOrKey.includes("/api/vault/file/")) {
    const idx = urlOrKey.indexOf("/api/vault/file/");
    return `${API_BASE_URL}${urlOrKey.substring(idx)}`;
  }

  // Legacy Supabase storage URLs should not be routed to R2 proxy
  if (urlOrKey.includes("supabase.co")) {
    return urlOrKey;
  }

  try {
    if (urlOrKey.startsWith("http://") || urlOrKey.startsWith("https://")) {
      const parsed = new URL(urlOrKey);
      // Strip leading slashes to extract the key
      const key = parsed.pathname.replace(/^\/+/, "");
      return `${API_BASE_URL}/api/vault/file/${key}`;
    }
  } catch {
    // If not a valid URL, treat as raw key
  }

  const cleanKey = urlOrKey.replace(/^\/+/, "");
  return `${API_BASE_URL}/api/vault/file/${cleanKey}`;
}
