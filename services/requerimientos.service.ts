import { API_URL, getAuthHeaders } from '@/lib/api.config';
import { 
  Requerimiento, 
  RequerimientoCompleto, 
  CrearRequerimientoDto, 
  EditarRequerimientoDto, 
  RevisarRequerimientoDto 
} from '@/types/requerimientos.types';
import { PaginatedResponse } from '@/types/common.types';

export const requerimientosService = {
  // ← MODIFICADO: estado ahora es opcional pero sin valor por defecto
    async getAll(
    page: number = 1, 
    limit: number = 10, 
    search: string = '', 
    estado?: string
    ): Promise<PaginatedResponse<Requerimiento>> {
    const url = new URL(`${API_URL}/requerimientos`);
    url.searchParams.append('page', page.toString());
    url.searchParams.append('limit', limit.toString());
    if (search) url.searchParams.append('search', search);
    if (estado) url.searchParams.append('estado', estado);

    const res = await fetch(url.toString(), { headers: getAuthHeaders(), cache: 'no-store' });
    
    // ← AGREGAR ESTO
    if (!res.ok) {
        const error = await res.json();
        console.error('Error del backend:', error);
        throw new Error(error.message || 'Error al obtener requerimientos');
    }
    
    return res.json();
    },

  async getById(id: number): Promise<RequerimientoCompleto> {
    const res = await fetch(`${API_URL}/requerimientos/${id}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Error al obtener el requerimiento');
    return res.json();
  },

  async create(data: CrearRequerimientoDto): Promise<RequerimientoCompleto> {
    const res = await fetch(`${API_URL}/requerimientos`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
        const msg = result.message || 'Error al crear requerimiento';
        throw new Error(Array.isArray(msg) ? msg.join(', ') : msg);
    }
    return result;
  },

  async update(id: number, data: EditarRequerimientoDto): Promise<RequerimientoCompleto> {
    const res = await fetch(`${API_URL}/requerimientos/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
        const msg = result.message || 'Error al actualizar requerimiento';
        throw new Error(Array.isArray(msg) ? msg.join(', ') : msg);
    }
    return result;
  },

  async sendRevision(id: number): Promise<void> {
    const res = await fetch(`${API_URL}/requerimientos/${id}/enviar-revision`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
        const result = await res.json();
        throw new Error(result.message || 'Error al enviar a revisión');
    }
  },

  async review(id: number, data: RevisarRequerimientoDto): Promise<void> {
    const res = await fetch(`${API_URL}/requerimientos/${id}/revisar`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
        const result = await res.json();
        throw new Error(result.message || 'Error al revisar requerimiento');
    }
  },

  async delete(id: number): Promise<void> {
    const res = await fetch(`${API_URL}/requerimientos/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
        const result = await res.json();
        throw new Error(result.message || 'Error al eliminar requerimiento');
    }
  }
};