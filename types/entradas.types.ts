// src/types/entradas.types.ts

// Item para el formulario (DTO) - ACTUALIZADO
export interface EntradaItemDto {
  productoId: number;
  proveedorId?: number;
  comprobante?: string;
  fechaCompra?: string;
  unidadMedidaId: number;
  cantidad: number;
  precioUnitario: number;
  precioTotal: number;
}

// DTO de Creación - ACTUALIZADO
export interface CrearEntradaDto {
  tipo: 'manual' | 'requerimiento';
  requerimientoId?: number;
  observaciones?: string;
  items: EntradaItemDto[];
}

// Interfaces de Respuesta (Lo que devuelve el backend)
export interface EntradaCentralItem {
  id: number;
  entrada_id: number;
  producto_id: number;
  proveedor_id: number | null;
  comprobante: string | null;
  fecha_compra: string;
  unidad_medida_id: number;
  cantidad: number;
  cantidad_base: number;
  precio_unitario: number;
  precio_total: number;
  // Datos del JOIN
  producto_nombre?: string;
  producto_codigo?: string;
  proveedor_nombre?: string;
  unidad_nombre?: string;
  unidad_abreviatura?: string;
  unidad_base_id?: number;
  unidad_base_nombre?: string;
  unidad_base_abreviatura?: string;
}

export interface EntradaCentral {
  id: number;
  requerimiento_id: number | null;
  tipo: 'manual' | 'requerimiento';
  total: number;
  observaciones: string | null;
  anulado: boolean;
  creado_por: number;
  actualizado_por: number | null;
  creado_en: string;
  actualizado_en: string;
  items?: EntradaCentralItem[];
}