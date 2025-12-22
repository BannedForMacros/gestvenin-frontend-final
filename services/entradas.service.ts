// src/services/entradas.service.ts
import { API_URL, getAuthHeaders } from '@/lib/api.config';
import { EntradaCentral, CrearEntradaDto } from '@/types/entradas.types';
import { PaginatedResponse } from '@/types/common.types';

export const entradasService = {
  async getAll(
    page: number = 1, 
    limit: number = 10, 
    search: string = ''
  ): Promise<PaginatedResponse<EntradaCentral>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search })
    });

    const res = await fetch(`${API_URL}/entradas-central?${params}`, {
      headers: getAuthHeaders(),
      cache: 'no-store'
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({})); 
      console.error("❌ Error Fetching Entradas:", res.status, errorData);
      throw new Error(errorData.message || `Error ${res.status}: No se pudieron cargar las entradas`);
    }

    return res.json();
  },

  async getById(id: number): Promise<EntradaCentral> {
    const res = await fetch(`${API_URL}/entradas-central/${id}`, {
      headers: getAuthHeaders(),
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al obtener la entrada');
    }
    
    return res.json();
  },

  async create(data: CrearEntradaDto): Promise<EntradaCentral> {
    const res = await fetch(`${API_URL}/entradas-central`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || 'Error al crear la entrada');
    }
    
    return res.json();
  },

  async update(id: number, data: Partial<CrearEntradaDto>): Promise<EntradaCentral> {
    const res = await fetch(`${API_URL}/entradas-central/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || 'Error al actualizar la entrada');
    }
    
    return res.json();
  },

  async delete(id: number): Promise<{ message: string }> {
    const res = await fetch(`${API_URL}/entradas-central/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || 'Error al anular la entrada');
    }
    
    return res.json();
  }
};