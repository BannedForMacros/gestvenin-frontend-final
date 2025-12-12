// types/usuarios.types.ts

// Lo que recibimos del backend al listar
export interface Usuario {
  id: number;
  email: string;
  nombreCompleto: string;
  rol: string; // El backend devuelve el nombre del rol
  rolId: number;
  activo: boolean;
  telefono?: string;
  locales: { id: number; nombre: string }[];
}

// Para llenar los selects del formulario
export interface RolOption {
  id: number;
  nombre: string;
}

export interface LocalOption {
  id: number;
  nombre: string;
  codigo: string;
}

// DTO para Crear (POST)
export interface CreateUsuarioDto {
  email: string;
  password: string;
  nombreCompleto: string;
  rolId: number;
  localesIds: number[];
  telefono?: string;
}

// DTO para Editar (PATCH)
export interface UpdateUsuarioDto {
  nombreCompleto?: string;
  rolId?: number;
  telefono?: string;
  activo?: boolean;
  password?: string; // Opcional si permites cambiar clave
}