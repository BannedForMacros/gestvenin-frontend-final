// src/types/entradas.types.ts

// Item para el formulario (DTO)
export interface EntradaItemDto {
  productoId: number;
  unidadMedidaId: number;
  cantidad: number;
  precioUnitario: number;
  precioTotal: number;
}

// DTO de Creación
export interface CrearEntradaDto {
  tipo: 'manual' | 'requerimiento';
  requerimientoId?: number;
  proveedorId?: number;
  comprobante?: string;
  observaciones?: string;
  items: EntradaItemDto[];
}

// Interfaces de Respuesta (Lo que devuelve el backend)
export interface EntradaCentralItem {
  id: number;
  producto_id: number;
  producto_nombre?: string; // Viene del join en el backend
  unidad_nombre?: string;   // Viene del join en el backend
  cantidad: number;
  precio_unitario: number;
  precio_total: number;
}

export interface EntradaCentral {
  id: number;
  codigo: string;
  tipo: 'manual' | 'requerimiento';
  proveedor_id: number | null;
  requerimiento_id: number | null;
  comprobante: string | null;
  total: number;
  observaciones: string | null;
  anulado: boolean;
  creado_en: string;
  items?: EntradaCentralItem[]; // Opcional, solo en detalle
}