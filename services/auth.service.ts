import { LoginRequest, LoginResponse, ApiError, MenuItem } from "@/types/auth.types";
import { API_URL, getAuthHeaders } from "@/lib/api.config";
import { jwtDecode } from "jwt-decode";
// Importamos los iconos
import { 
  LayoutDashboard, Package, ShoppingCart, Settings, Box, Tags, 
  Warehouse, Store, ClipboardList, Ruler, FileText, Users, Shield, 
  Eye, LucideIcon 
} from "lucide-react";

// --- MAPEO DE ICONOS ---
const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard, Package, ShoppingCart, Settings, Box, Tags, 
  Warehouse, Store, ClipboardList, Ruler, FileText, Users, Shield, Eye,
  default: LayoutDashboard 
};

// Función auxiliar para transformar datos
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapResponseToMenu = (items: any[]): MenuItem[] => {
  return items.map((item) => {
    const IconComponent = ICON_MAP[item.icono] || ICON_MAP.default;
    return {
      id: item.id, // <--- ✅ AHORA PASAMOS EL ID
      title: item.titulo,
      href: item.ruta || '',
      icon: IconComponent,
      items: item.hijos && item.hijos.length > 0 ? mapResponseToMenu(item.hijos) : undefined
    };
  });
};

// Interfaz interna para manejar inconsistencias del backend (accessToken vs access_token)
interface BackendLoginResponse extends Partial<LoginResponse> {
  access_token?: string;
}

export const authService = {
  
  // --- LOGIN ---
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

      // Normalizamos la respuesta
      const rawData = data as BackendLoginResponse;
      const token = rawData.accessToken || rawData.access_token || "";

      if (!token) throw new Error("Token no recibido del servidor");

      const finalData: LoginResponse = {
        accessToken: token,
        usuario: rawData.usuario! 
      };

      return finalData;
    } catch (error: unknown) {
      if (error instanceof Error) throw new Error(error.message);
      throw new Error("Error de conexión");
    }
  },

  // --- GUARDAR SESIÓN (Clave 'token') ---
  saveSession(data: LoginResponse) {
    if (typeof window !== "undefined") {
      if (data.accessToken) {
        // ✅ CLAVE CORRECTA: 'token' (coincide con api.config y AuthProvider)
        localStorage.setItem("token", data.accessToken);
        localStorage.setItem("user", JSON.stringify(data.usuario));
      }
    }
  },

  // --- LOGOUT ---
  logout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Forzamos recarga para limpiar estados de memoria
      window.location.href = "/login";
    }
  },

  // --- OBTENER MENÚS (Protegido contra 401) ---
  async getMyMenus(): Promise<MenuItem[]> {
    try {
      const res = await fetch(`${API_URL}/auth/me/menu`, {
        headers: getAuthHeaders(),
        cache: 'no-store' 
      });

      // Si falla (401 Unauthorized), no lanzamos error fatal, devolvemos menú vacío.
      // Esto evita la pantalla roja.
      if (!res.ok) {
        if (res.status === 401) {
            console.warn("Sesión expirada o inválida al cargar menús.");
            // Opcional: Podrías llamar a logout() aquí si quieres ser estricto
        }
        return [];
      }
      
      const data = await res.json();
      
      if (Array.isArray(data)) {
        return mapResponseToMenu(data);
      }
      return [];
    } catch (error) {
      console.error("Error al obtener menús:", error);
      return []; // Retorno seguro
    }
  },

  // --- REFRESH TOKEN ---
  async refreshSession(): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/auth/me/refresh`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error("Falló refresh");

      const data = await response.json();
      const rawData = data as BackendLoginResponse;
      const token = rawData.accessToken || rawData.access_token || "";

      if (token && rawData.usuario) {
        this.saveSession({
            accessToken: token,
            usuario: rawData.usuario
        });
      }
    } catch (error) {
      console.error("Sesión caducada:", error);
    }
  }
};