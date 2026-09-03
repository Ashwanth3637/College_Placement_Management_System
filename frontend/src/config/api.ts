const isBrowser = typeof window !== 'undefined';
const isLocalhost = isBrowser && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === '0.0.0.0'
);

const envApiUrl = import.meta.env.VITE_API_URL;

// If running locally on localhost, prefer local backend (http://localhost:5001) for instant response
// If deployed in production, use the production Render / custom URL
export const API_BASE_URL = (
  (isLocalhost && (!envApiUrl || envApiUrl.includes('localhost') || envApiUrl.includes('127.0.0.1') || envApiUrl.includes('render.com')))
    ? (import.meta.env.VITE_LOCAL_API_URL || 'http://localhost:5001')
    : (envApiUrl || 'http://localhost:5001')
).replace(/\/+$/, '');
