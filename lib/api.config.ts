// src/lib/api.config.ts
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!BASE_URL) {
  console.error("⚠️ FATAL: NEXT_PUBLIC_API_URL no está definida en el archivo .env");
}

export const API_URL = BASE_URL;

export const getAuthHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (typeof window !== 'undefined') {
    // ✅ CAMBIO CLAVE: Buscamos 'token' que es como lo guarda el AuthProvider
    const token = localStorage.getItem('token'); 
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};