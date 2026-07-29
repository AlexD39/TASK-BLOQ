const rawApiUrl =
  import.meta.env.VITE_API_URL
    ?.trim();

if (!rawApiUrl) {
  throw new Error(
    'La variable VITE_API_URL no está configurada.',
  );
}

export const API_URL =
  rawApiUrl.replace(/\/+$/, '');