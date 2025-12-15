export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
  creado_por: number;
}

export interface CrearCategoriaDto {
  nombre: string;
  descripcion?: string;
}

export interface EditarCategoriaDto extends Partial<CrearCategoriaDto> {
  activo?: boolean;
}