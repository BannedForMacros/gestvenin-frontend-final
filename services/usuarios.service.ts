// services/usuarios.service.ts
import { Usuario, CreateUsuarioDto, UpdateUsuarioDto, RolOption, LocalOption } from "@/types/usuarios.types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

// Función auxiliar para headers con Token
const getHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const usuariosService = {
  // Listar usuarios
  async getAll(): Promise<Usuario[]> {
    const res = await fetch(`${API_URL}/usuarios`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Error al obtener usuarios');
    return res.json();
  },

  // Obtener roles para el select
  async getRoles(): Promise<RolOption[]> {
    const res = await fetch(`${API_URL}/roles`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Error al obtener roles');
    return res.json();
  },

  // Obtener locales para el select
  async getLocales(): Promise<LocalOption[]> {
    const res = await fetch(`${API_URL}/locales`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Error al obtener locales');
    return res.json();
  },

  // Crear
  async create(data: CreateUsuarioDto): Promise<Usuario> {
    const res = await fetch(`${API_URL}/usuarios`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Error al crear usuario');
    return result;
  },

  // Editar
  async update(id: number, data: UpdateUsuarioDto): Promise<Usuario> {
    const res = await fetch(`${API_URL}/usuarios/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error al actualizar usuario');
    return res.json();
  },
  
  // Asignar Locales (Endpoint específico según tu controller)
  async assignLocales(id: number, localesIds: number[]) {
      const res = await fetch(`${API_URL}/usuarios/${id}/locales`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ localesIds }),
    });
    if (!res.ok) throw new Error('Error al asignar locales');
    return res.json();
  }
};