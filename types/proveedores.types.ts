export interface Proveedor {
  id: number;
  ruc: string;
  razon_social: string;
  nombre_comercial: string | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  contacto_nombre: string | null;
  contacto_telefono: string | null;
  activo: boolean;
  creado_en: string; // Vienen como ISO string del JSON
}

export interface CrearProveedorDto {
  ruc: string;
  razonSocial: string;
  nombreComercial?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  contactoNombre?: string;
  contactoTelefono?: string;
}

export interface EditarProveedorDto extends Partial<CrearProveedorDto> {
  activo?: boolean;
}