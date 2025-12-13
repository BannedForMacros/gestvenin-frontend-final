import { LoginRequest, LoginResponse, ApiError } from "../types/auth.types";
import { API_URL, getAuthHeaders } from "@/lib/api.config";

// Definimos una interfaz interna para manejar la respuesta cruda del backend
// Esto le dice a TS: "El objeto es un LoginResponse, pero podría traer 'access_token' extra"
interface BackendLoginResponse extends Partial<LoginResponse> {
  access_token?: string;
}

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorData = data as ApiError;
        const message = Array.isArray(errorData.message)
          ? errorData.message.join(", ")
          : errorData.message;

        throw new Error(message || "Error al iniciar sesión");
      }

      // CORRECCIÓN ESLINT:
      // En lugar de usar 'as any', casteamos a nuestra interfaz intermedia.
      const rawData = data as BackendLoginResponse;

      // Ahora TypeScript sabe que 'access_token' es una propiedad válida (opcional)
      const token = rawData.accessToken || rawData.access_token || "";

      if (!token) {
        throw new Error("La respuesta del servidor no contiene un token válido.");
      }

      // Construimos el objeto final limpio asegurando que accessToken tenga valor
      const finalData: LoginResponse = {
        accessToken: token,
        usuario: rawData.usuario! // Asumimos que usuario viene, o ajustamos el tipo según necesidad
      };

      return finalData;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error(
        "No se pudo conectar con el servidor (Verifica que el backend esté corriendo)"
      );
    }
  },

  saveSession(data: LoginResponse) {
    if (typeof window !== "undefined") {
      if (data.accessToken) {
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("user", JSON.stringify(data.usuario));
      } else {
        console.error("⚠️ Error: Intentando guardar sesión sin token válido");
      }
    }
  },

  async refreshSession(): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/auth/me/refresh`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("No se pudo refrescar la sesión");
      }

      const data = await response.json();
      
      // Aplicamos la misma lógica segura aquí
      const rawData = data as BackendLoginResponse;
      const token = rawData.accessToken || rawData.access_token || "";

      if (token && rawData.usuario) {
        this.saveSession({
            accessToken: token,
            usuario: rawData.usuario
        });
      }
    } catch (error) {
      console.error("Error refrescando permisos:", error);
    }
  },

  logout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
  },

  async getMyMenus() {
    const res = await fetch(`${API_URL}/auth/me/menu`, {
        headers: getAuthHeaders() 
    });
    if (!res.ok) throw new Error('Error cargando menús');
    return res.json();
  },

  async getAllMenusConfig() {
    const res = await fetch(`${API_URL}/auth/menus/todos`, { 
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Error cargando configuración de menús');
    return res.json();
  }
};