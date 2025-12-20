// src/services/entradas.service.ts
import { API_URL, getAuthHeaders } from '@/lib/api.config';
import { EntradaCentral, CrearEntradaDto } from '@/types/entradas.types';
import { PaginatedResponse } from '@/types/common.types';

export const entradasService = {

    async getAll(page: number = 1, limit: number = 10, search: string = '') {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search })
    });

    const res = await fetch(`${API_URL}/entradas-central?${params}`, {
        headers: getAuthHeaders(),
        cache: 'no-store'
    });

    // --- MODIFICACIÓN PARA DEBUG ---
    if (!res.ok) {
        // Intentamos leer el mensaje del backend
        const errorData = await res.json().catch(() => ({})); 
        console.error("❌ Error Fetching Entradas:", res.status, errorData);
        
        // Lanzamos un error más descriptivo
        throw new Error(errorData.message || `Error ${res.status}: No se pudieron cargar las entradas`);
    }
    // -------------------------------

    return res.json() as Promise<PaginatedResponse<EntradaCentral>>;
    },

  async getById(id: number) {
    const res = await fetch(`${API_URL}/entradas-central/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Error al obtener la entrada');
    return res.json() as Promise<EntradaCentral>;
  },

  async create(data: CrearEntradaDto) {
    const res = await fetch(`${API_URL}/entradas-central`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Error al crear la entrada');
    }
    return res.json();
  },

  async delete(id: number) {
    const res = await fetch(`${API_URL}/entradas-central/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Error al anular la entrada');
    return res.json();
  }
};