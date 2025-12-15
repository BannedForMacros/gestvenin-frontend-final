import { API_URL, getAuthHeaders } from '@/lib/api.config';
import { UnidadMedida, CrearUnidadDto, EditarUnidadDto } from '@/types/unidades.types';
import { PaginatedResponse } from '@/types/common.types';

export const unidadesService = {
  // 1. Para la Tabla (Paginado)
  async getAll(page: number = 1, limit: number = 10, search: string = ''): Promise<PaginatedResponse<UnidadMedida>> {
    const url = new URL(`${API_URL}/unidades-medida`);
    url.searchParams.append('page', page.toString());
    url.searchParams.append('limit', limit.toString());
    if (search) {
      url.searchParams.append('search', search);
    }

    const res = await fetch(url.toString(), {
      headers: getAuthHeaders(),
      cache: 'no-store'
    });

    if (!res.ok) throw new Error('Error al obtener unidades paginadas');
    return res.json();
  },

  // 2. Para el Modal (Lista completa para el Dropdown de Unidad Base)
  async getAllList(): Promise<UnidadMedida[]> {
    // Pedimos un límite alto para traer "todas"
    const url = new URL(`${API_URL}/unidades-medida`);
    url.searchParams.append('limit', '100'); 
    
    const res = await fetch(url.toString(), {
      headers: getAuthHeaders(),
      cache: 'no-store'
    });

    if (!res.ok) throw new Error('Error al obtener lista');
    const response = await res.json();
    return response.data || response; 
  },

  async create(data: CrearUnidadDto): Promise<UnidadMedida> {
    const res = await fetch(`${API_URL}/unidades-medida`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
        const msg = result.message || 'Error al crear unidad';
        throw new Error(Array.isArray(msg) ? msg.join(', ') : msg);
    }
    return result;
  },

  async update(id: number, data: EditarUnidadDto): Promise<UnidadMedida> {
    const res = await fetch(`${API_URL}/unidades-medida/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
        const msg = result.message || 'Error al actualizar unidad';
        throw new Error(Array.isArray(msg) ? msg.join(', ') : msg);
    }
    return result;
  },

  async delete(id: number): Promise<void> {
    const res = await fetch(`${API_URL}/unidades-medida/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
        const result = await res.json();
        const msg = result.message || 'Error al eliminar unidad';
        throw new Error(Array.isArray(msg) ? msg.join(', ') : msg);
    }
  }
  
};