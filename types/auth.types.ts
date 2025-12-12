// types/auth.types.ts
import { LucideIcon } from "lucide-react";

// Lo que enviamos al Login (match con LoginDto del backend)
export interface LoginRequest {
  email: string;
  password: string;
}

// Estructuras auxiliares basadas en tu backend
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

// El usuario que devuelve NestJS dentro de la respuesta
export interface Usuario {
  id: number;
  email: string;
  nombreCompleto: string;
  rol: string;
  empresa: EmpresaInfo;
  locales: LocalInfo[];
  permisos: string[];
}

// La respuesta completa del endpoint /auth/login
export interface LoginResponse {
  accessToken: string;
  usuario: Usuario;
}

// Interfaz para manejar errores de forma tipada
export interface ApiError {
  message: string;
  statusCode?: number;
  error?: string;
}


// Tu definición de usuario según el backend
export interface UserSession {
  nombreCompleto: string;
  email: string;
  rol: string;
  permisos: string[];
}

// Definición para los ítems del menú
export interface MenuItem {
  title: string;
  href: string;
  icon: LucideIcon; // Solución al error de "any" en los íconos
  requiredPermission?: string;
}