import { API_URL, getAuthHeaders } from '@/lib/api.config';
import { Local, CreateLocalDto, UpdateLocalDto } from '@/types/locales.types';

export const localesService = {
  async getAll(): Promise<Local[]> {
    const res = await fetch(`${API_URL}/locales`, { 
      headers: getAuthHeaders() 
    });
    if (!res.ok) throw new Error('Error al obtener locales');
    return res.json();
  },

  async create(data: CreateLocalDto): Promise<Local> {
    const res = await fetch(`${API_URL}/locales`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Error al crear local');
    return result;
  },

  async update(id: number, data: UpdateLocalDto): Promise<Local> {
    const res = await fetch(`${API_URL}/locales/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Error al actualizar local');
    return result;
  }
};