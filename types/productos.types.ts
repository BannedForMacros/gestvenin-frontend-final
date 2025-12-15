// Estructura de una unidad asignada al producto
export interface ProductoUnidad {
  id: number;
  producto_id: number;
  unidad_medida_id: number;
  es_unidad_base: boolean;
  activo: boolean;
  // Campos opcionales para mostrar nombres en el frontend si hacemos joins
  nombre?: string; 
  abreviatura?: string;
  factor_a_base?: number;
}

export interface Producto {
  id: number;
  codigo: string | null;
  codigo_barras: string | null;
  nombre: string;
  descripcion: string | null;
  categoria_id: number | null;
  stock_minimo: number;
  activo: boolean;
  // El backend devuelve esto en obtenerPorId
  unidades?: ProductoUnidad[]; 
}

// DTO para enviar al crear/editar
export interface ProductoUnidadDto {
  unidadMedidaId: number;
  esUnidadBase: boolean;
}

export interface CrearProductoDto {
  codigo?: string;
  codigoBarras?: string;
  nombre: string;
  descripcion?: string;
  categoriaId?: number;
  stockMinimo?: number;
  // ARRAY DE UNIDADES
  unidades: ProductoUnidadDto[]; 
}

export interface EditarProductoDto extends Partial<Omit<CrearProductoDto, 'unidades'>> {
  activo?: boolean;
}