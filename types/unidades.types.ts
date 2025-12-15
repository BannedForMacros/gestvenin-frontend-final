export type TipoUnidad = 'peso' | 'volumen' | 'cantidad';

export interface UnidadMedida {
  id: number;
  nombre: string;
  abreviatura: string;
  tipo: TipoUnidad;
  es_base: boolean;         // Viene así de la BD
  unidad_base_id: number | null;
  factor_a_base: number | null;
  activo: boolean;
  // Campos de auditoría opcionales en el front
  creado_en?: string;
}

export interface CrearUnidadDto {
  nombre: string;
  abreviatura: string;
  tipo: TipoUnidad;
  esBase: boolean;          // Se envía así al Backend
  unidadBaseId?: number;
  factorABase?: number;
}

export interface EditarUnidadDto extends Partial<CrearUnidadDto> {
  activo?: boolean;
}