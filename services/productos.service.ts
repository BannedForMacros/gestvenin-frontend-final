import { API_URL, getAuthHeaders } from '@/lib/api.config';
import { Producto, CrearProductoDto, EditarProductoDto } from '@/types/productos.types';

export const productosService = {
  async getAll(): Promise<Producto[]> {
    const res = await fetch(`${API_URL}/productos`, {
      headers: getAuthHeaders(),
      cache: 'no-store' // Importante para no cachear datos viejos
    });
    if (!res.ok) throw new Error('Error al obtener productos');
    return res.json();
  },

  async create(data: CrearProductoDto): Promise<Producto> {
    const res = await fetch(`${API_URL}/productos`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Error al crear producto');
    return result;
  },

  async update(id: number, data: EditarProductoDto): Promise<Producto> {
    const res = await fetch(`${API_URL}/productos/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Error al actualizar producto');
    return result;
  },

  async delete(id: number): Promise<void> {
    const res = await fetch(`${API_URL}/productos/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
        const result = await res.json();
        throw new Error(result.message || 'Error al eliminar producto');
    }
  }
};