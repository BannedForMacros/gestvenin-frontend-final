import { API_URL, getAuthHeaders } from '@/lib/api.config';
import { Permiso } from '@/types/permisos.types';

export const permisosService = {
  async getAll(): Promise<Permiso[]> {
    const res = await fetch(`${API_URL}/permisos`, { 
      headers: getAuthHeaders() 
    });
    if (!res.ok) throw new Error('Error al obtener permisos');
    return res.json();
  }
};