// Centralized API configuration
export const API_CONFIG = {
  baseUrl: import.meta.env?.VITE_API_BASE_URL || "/api",
};

// Helper function to construct API URLs
export const apiUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_CONFIG.baseUrl}/${cleanPath}`;
}; 