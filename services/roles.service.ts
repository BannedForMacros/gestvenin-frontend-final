import { API_URL, getAuthHeaders } from '@/lib/api.config';
import { Rol, CreateRolDto, AsignarPermisosDto } from '@/types/roles.types';

export const rolesService = {
  async getAll(): Promise<Rol[]> {
    const res = await fetch(`${API_URL}/roles`, { 
      headers: getAuthHeaders() 
    });
    if (!res.ok) throw new Error('Error al obtener roles');
    return res.json();
  },

  async create(data: CreateRolDto): Promise<Rol> {
    const res = await fetch(`${API_URL}/roles`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Error al crear rol');
    return result;
  },

  async assignPermisos(rolId: number, data: AsignarPermisosDto) {
    const res = await fetch(`${API_URL}/roles/${rolId}/permisos`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Error al asignar permisos');
    return result;
  }
};