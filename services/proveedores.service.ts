import { API_URL, getAuthHeaders } from '@/lib/api.config';
import { Proveedor, CrearProveedorDto, EditarProveedorDto } from '@/types/proveedores.types';
import { PaginatedResponse } from '@/types/common.types'; // Asumo que tienes este tipo genérico, si no, avísame

export const proveedoresService = {
  async getAll(page: number = 1, limit: number = 10, search: string = '') {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search })
    });

    const res = await fetch(`${API_URL}/proveedores?${params}`, {
      headers: getAuthHeaders(),
      cache: 'no-store'
    });

    if (!res.ok) throw new Error('Error al cargar proveedores');
    
    // Tu backend devuelve { data: [], meta: { ... } } según tu service
    return res.json() as Promise<PaginatedResponse<Proveedor>>;
  },

  async create(data: CrearProveedorDto) {
    const res = await fetch(`${API_URL}/proveedores`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Error al crear proveedor');
    }
    return res.json();
  },

  async update(id: number, data: EditarProveedorDto) {
    const res = await fetch(`${API_URL}/proveedores/${id}`, {
      method: 'PATCH', // Tu controller usa @Patch
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error al actualizar proveedor');
    return res.json();
  },

  async delete(id: number) {
    const res = await fetch(`${API_URL}/proveedores/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Error al eliminar proveedor');
    return res.json();
  }
};