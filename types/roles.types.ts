import { Permiso } from "./permisos.types";

export interface Rol {
  id: number;
  nombre: string;
  esSistema: boolean; // Para saber si podemos editarlo o no
  empresaId: number;
  // Estructura anidada que devuelve Prisma según tu backend
  rolPermisos: {
    activo: boolean;
    permiso: Permiso;
  }[];
}

export interface CreateRolDto {
  nombre: string;
}

export interface AsignarPermisosDto {
  permisosIds: number[];
}