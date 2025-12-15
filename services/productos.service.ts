import { API_URL, getAuthHeaders } from '@/lib/api.config';
import { Producto, CrearProductoDto, EditarProductoDto, ProductoUnidadDto, ProductoUnidad } from '@/types/productos.types';
import { PaginatedResponse } from '@/types/common.types';

export const productosService = {
  // 1. Obtener Paginado (Para la tabla)
  async getAll(page: number = 1, limit: number = 10, search: string = ''): Promise<PaginatedResponse<Producto>> {
    const url = new URL(`${API_URL}/productos`);
    url.searchParams.append('page', page.toString());
    url.searchParams.append('limit', limit.toString());
    if (search) url.searchParams.append('search', search);

    const res = await fetch(url.toString(), { 
      headers: getAuthHeaders(), 
      cache: 'no-store' 
    });
    
    if (!res.ok) throw new Error('Error al obtener productos');
    return res.json();
  },

  // 2. Obtener por ID con detalle (Incluye unidades para editar)
  async getById(id: number): Promise<Producto> {
    const res = await fetch(`${API_URL}/productos/${id}`, { 
      headers: getAuthHeaders() 
    });
    
    if (!res.ok) throw new Error('Error al obtener producto');
    return res.json();
  },

  // 3. Obtener Unidades de un Producto (¡ESTE FALTABA!)
  // Se usa en el Modal de Requerimientos para llenar el select de unidades
  async getUnidades(id: number): Promise<ProductoUnidad[]> {
    const res = await fetch(`${API_URL}/productos/${id}/unidades`, { 
      headers: getAuthHeaders() 
    });
    
    if (!res.ok) throw new Error('Error al obtener unidades del producto');
    return res.json();
  },

  // 4. Crear Producto
  async create(data: CrearProductoDto): Promise<Producto> {
    const res = await fetch(`${API_URL}/productos`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    
    const result = await res.json();
    if (!res.ok) {
        const msg = result.message || 'Error al crear producto';
        throw new Error(Array.isArray(msg) ? msg.join(', ') : msg);
    }
    return result;
  },

  // 5. Actualizar Producto (Solo datos básicos)
  async update(id: number, data: EditarProductoDto): Promise<Producto> {
    const res = await fetch(`${API_URL}/productos/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    
    const result = await res.json();
    if (!res.ok) {
        const msg = result.message || 'Error al actualizar producto';
        throw new Error(Array.isArray(msg) ? msg.join(', ') : msg);
    }
    return result;
  },

  // 6. Asignar Unidades (Endpoint específico)
  async assignUnits(id: number, data: { unidades: ProductoUnidadDto[] }): Promise<void> {
    const res = await fetch(`${API_URL}/productos/${id}/unidades`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
       const result = await res.json();
       const msg = result.message || 'Error al asignar unidades';
       throw new Error(Array.isArray(msg) ? msg.join(', ') : msg);
    }
  },

  // 7. Eliminar Producto
  async delete(id: number): Promise<void> {
    const res = await fetch(`${API_URL}/productos/${id}`, { 
      method: 'DELETE', 
      headers: getAuthHeaders() 
    });
    
    if (!res.ok) throw new Error('Error al eliminar producto');
  }
};