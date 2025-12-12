// types/locales.types.ts

export interface Local {
  id: number;
  empresaId: number;
  nombre: string;
  codigo: string;
  tieneMesas: boolean;
  direccion?: string; // Opcional
  telefono?: string;  // Opcional
  activo?: boolean;   // Generalmente Prisma agrega esto por defecto
}

export interface CreateLocalDto {
  nombre: string;
  codigo: string;
  tieneMesas: boolean;
  direccion?: string;
  telefono?: string;
}

export interface UpdateLocalDto extends Partial<CreateLocalDto> {
  activo?: boolean;
}