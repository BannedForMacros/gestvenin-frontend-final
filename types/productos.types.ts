export interface Producto {
  id: number;
  codigo: string | null;
  nombre: string;
  descripcion: string | null;
  unidad_medida: string;
  categoria: string | null;
  stock_minimo: number;
  activo: boolean;
  creado_en: string; // Las fechas vienen como string del JSON
  actualizado_en: string;
}

// Omitimos los campos autogenerados para la creación
export interface CrearProductoDto {
  codigo?: string;
  nombre: string;
  descripcion?: string;
  unidadMedida: string; // Nota: CamelCase en el DTO del front para coincidir con el backend
  categoria?: string;
  stockMinimo?: number;
}

// Partial permite que todos los campos sean opcionales
export interface EditarProductoDto extends Partial<CrearProductoDto> {
  activo?: boolean;
}