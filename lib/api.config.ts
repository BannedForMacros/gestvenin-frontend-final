// lib/api.config.ts

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!BASE_URL) {
  console.error("⚠️ FATAL: NEXT_PUBLIC_API_URL no está definida en el archivo .env");
}

export const API_URL = BASE_URL;

// CORRECCIÓN AQUÍ:
// 1. Definimos el tipo de retorno explícito ': Record<string, string>'
// 2. Inicializamos el objeto headers con Content-Type siempre presente.
export const getAuthHeaders = (): Record<string, string> => {
  // Inicializamos con el header que siempre va
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Solo si estamos en el cliente, intentamos buscar el token
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      // Solo agregamos Authorization si el token existe
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;

  
};