import { API_URL, getAuthHeaders } from '@/lib/api.config';
import { Rol, CreateRolDto, AsignarPermisosDto } from '@/types/roles.types';

export const rolesService = {
  async getAll(): Promise<Rol[]> {
    // ⚠️ CRÍTICO: 'no-store' asegura que siempre traiga los datos frescos de la BD
    const res = await fetch(`${API_URL}/roles`, {
      headers: getAuthHeaders(),
      cache: 'no-store' 
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
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Error al crear rol');
    }
    return res.json();
  },

  async assignPermisos(rolId: number, data: AsignarPermisosDto): Promise<Rol> {
    const res = await fetch(`${API_URL}/roles/${rolId}/permisos`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error al asignar permisos');
    return res.json();
  }
};