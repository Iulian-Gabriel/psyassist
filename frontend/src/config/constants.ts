export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (window.location.hostname.endsWith("github.dev")
    ? `https://${window.location.hostname.replace(
        /5173/,
        "4000"
      )}/api`
    : "http://localhost:4000/api");