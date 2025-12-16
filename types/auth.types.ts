// src/types/auth.types.ts
import { LucideIcon } from "lucide-react";

// --- LOGIN ---

// Lo que enviamos al Login (match con LoginDto del backend)
export interface LoginRequest {
  email: string;
  password: string;
}

// La respuesta completa del endpoint /auth/login
export interface LoginResponse {
  accessToken: string;
  usuario: Usuario;
}

// --- ESTRUCTURAS DE USUARIO ---

// Estructuras auxiliares
export interface EmpresaInfo {
  subdominio: string;
  schema: string;
}

export interface LocalInfo {
  id: number;
  nombre: string;
  codigo: string;
  tieneMesas: boolean;
}

// El objeto usuario completo que devuelve el Backend en el body del login
export interface Usuario {
  id: number;
  email: string;
  nombreCompleto: string;
  rol: string;
  empresa: EmpresaInfo;
  locales: LocalInfo[];
  permisos: string[];
}

// ✅ NUEVO: Esto es lo que viene DENTRO del Token JWT (Decodificado)
// Basado en tu respuesta anterior del curl
export interface UserPayload {
  sub: number;          // ID del usuario
  email: string;
  empresaId: number;
  schema: string;
  rol: string;
  locales: number[];    // IDs de locales
  permisos: string[];   // Array de strings "modulo.accion"
  iat?: number;         // Fecha creación
  exp?: number;         // Fecha expiración
}

// --- CONTEXTO ---

// Definición de lo que exporta el AuthProvider
export interface AuthContextType {
  user: UserPayload | null; // Usamos el payload del token para la sesión
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, usuarioData?: Usuario) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

// --- MENÚS Y ERRORES ---

// Interfaz para manejar errores de forma tipada
export interface ApiError {
  message: string;
  statusCode?: number;
  error?: string;
}

// Tu definición de usuario para sesión (legacy o simplificada)
export interface UserSession {
  nombreCompleto: string;
  email: string;
  rol: string;
  permisos: string[];
}

// Definición para los ítems del menú (Frontend)
export interface MenuItem {
  id?: number;
  title: string;
  href: string;
  icon: LucideIcon; 
  items?: MenuItem[];
  requiredPermission?: string;
}

// Definición para los ítems del menú (Base de Datos)
export interface MenuItemDB {
  id: number;
  codigo: string;
  titulo: string;
  icono: string;
  ruta: string | null;
  permiso_requerido: string | null;
  orden?: number;
  hijos?: MenuItemDB[];
}