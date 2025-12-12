import { LoginRequest, LoginResponse, ApiError } from "../types/auth.types";

// 1. Leemos la variable de entorno. 
// Si no existe, usamos el fallback correcto con /api/v1
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      // 2. Construimos la URL completa. 
      // Quedará: http://localhost:3000/api/v1/auth/login
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        // Tipamos el error para evitar 'any'
        const errorData = data as ApiError;
        // NestJS suele devolver errores como "Unauthorized" o un array de mensajes
        const message = Array.isArray(errorData.message) 
          ? errorData.message.join(', ') 
          : errorData.message;
          
        throw new Error(message || 'Error al iniciar sesión');
      }

      return data as LoginResponse;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error('No se pudo conectar con el servidor (Verifica que el backend esté corriendo)');
    }
  },

  saveSession(data: LoginResponse) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', data.accessToken);
      // Guardamos el usuario completo para mostrar nombre/rol en el dashboard
      localStorage.setItem('user', JSON.stringify(data.usuario));
    }
  },

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  }
};