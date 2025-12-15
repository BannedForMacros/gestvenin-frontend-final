export interface RequerimientoItem {
  id: number;
  requerimiento_id: number;
  producto_id: number;
  unidad_medida_id: number;
  cantidad: number;
  precio_unitario_estimado: number | null;
  precio_total_estimado: number | null;
  observaciones: string | null;
  // Campos del JOIN para mostrar en tabla
  producto_nombre?: string;
  producto_codigo?: string;
  unidad_nombre?: string;
  unidad_abreviatura?: string;
}

export interface Requerimiento {
  id: number;
  codigo: string;
  tipo: string;
  estado: 'borrador' | 'revision' | 'aprobado' | 'rechazado' | 'comprado' | 'eliminado';
  observaciones: string | null;
  observaciones_aprobador: string | null;
  creado_por: number;
  creado_en: string; // Vienen como string ISO del JSON
  actualizado_en: string;
}

export interface RequerimientoCompleto extends Requerimiento {
  items: RequerimientoItem[];
}

// DTOs para envío de datos
export interface RequerimientoItemDto {
  productoId: number;
  unidadMedidaId: number;
  cantidad: number;
  precioUnitarioEstimado?: number;
  precioTotalEstimado?: number;
  observaciones?: string;
}

export interface CrearRequerimientoDto {
  observaciones?: string;
  items: RequerimientoItemDto[];
}

export interface EditarRequerimientoDto {
  observaciones?: string;
  items?: RequerimientoItemDto[];
}

export interface RevisarRequerimientoDto {
  accion: 'aprobar' | 'rechazar';
  observaciones?: string;
  items?: RequerimientoItemDto[];
}