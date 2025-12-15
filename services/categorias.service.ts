import { API_URL, getAuthHeaders } from '@/lib/api.config';
import { Categoria, CrearCategoriaDto, EditarCategoriaDto } from '@/types/categorias.types';
import { PaginatedResponse } from '@/types/common.types'; // Importamos el tipo común

export const categoriasService = {
  // AHORA ACEPTA PAGINACIÓN
  async getAll(page: number = 1, limit: number = 10, search: string = ''): Promise<PaginatedResponse<Categoria>> {
    // Construimos la URL con parámetros
    const url = new URL(`${API_URL}/categorias`);
    url.searchParams.append('page', page.toString());
    url.searchParams.append('limit', limit.toString());
    if (search) {
      url.searchParams.append('search', search);
    }

    const res = await fetch(url.toString(), {
      headers: getAuthHeaders(),
      cache: 'no-store'
    });

    if (!res.ok) throw new Error('Error al obtener categorías');
    
    // TypeScript ahora sabe que esto devuelve { data: [], meta: {} }
    return res.json();
  },

  async getAllList(): Promise<Categoria[]> {
    const url = new URL(`${API_URL}/categorias`);
    url.searchParams.append('limit', '100'); // Traemos suficientes
    
    const res = await fetch(url.toString(), { headers: getAuthHeaders(), cache: 'no-store' });
    if (!res.ok) throw new Error('Error al obtener lista de categorías');
    
    const response = await res.json();
    return response.data || response; 
  },

  async create(data: CrearCategoriaDto): Promise<Categoria> {
    const res = await fetch(`${API_URL}/categorias`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
        const msg = result.message || 'Error al crear categoría';
        throw new Error(Array.isArray(msg) ? msg.join(', ') : msg);
    }
    return result;
  },

  async update(id: number, data: EditarCategoriaDto): Promise<Categoria> {
    const res = await fetch(`${API_URL}/categorias/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
        const msg = result.message || 'Error al actualizar categoría';
        throw new Error(Array.isArray(msg) ? msg.join(', ') : msg);
    }
    return result;
  },

  async delete(id: number): Promise<void> {
    const res = await fetch(`${API_URL}/categorias/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
        const result = await res.json();
        const msg = result.message || 'Error al eliminar categoría';
        throw new Error(Array.isArray(msg) ? msg.join(', ') : msg);
    }
  },
  
};