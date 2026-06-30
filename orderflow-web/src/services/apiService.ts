import type { Product, Order } from '../types';

const CATALOG_API_URL = import.meta.env.VITE_CATALOG_API_URL || 'http://localhost:5299';
const ORDERS_API_URL = import.meta.env.VITE_ORDERS_API_URL || 'http://localhost:5252';

// Helper para obtener el token JWT
const getAuthHeaders = () : Record<string, string> => {
  const token = localStorage.getItem('jwt_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const apiService = {
  // --- CATALOG API ---
  async getProducts(): Promise<Product[]> {
    const response = await fetch(`${CATALOG_API_URL}/api/catalog`);
    if (!response.ok) throw new Error('Error al cargar catálogo');
    return response.json();
  },

  async createProduct(product: Omit<Product, 'id'>): Promise<Product> {
    const response = await fetch(`${CATALOG_API_URL}/api/catalog`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    if (!response.ok) throw new Error('Error al crear producto');
    return response.json();
  },

  async deleteProduct(id: string): Promise<void> {
    const response = await fetch(`${CATALOG_API_URL}/api/catalog/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Error al eliminar producto');
  },

  // --- ORDERS API ---
  async getOrders(): Promise<Order[]> {
    const response = await fetch(`${ORDERS_API_URL}/api/orders`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Error al cargar pedidos');
    return response.json();
  },

  async createOrder(orderData: { customerEmail: string; items: { productId: string; quantity: number }[] }): Promise<void> {
    const response = await fetch(`${ORDERS_API_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      try {
        const errorData = await response.json();
        if (errorData.errors) {
          const messages = Object.values(errorData.errors).flat().join(' ');
          throw new Error(messages);
        }
        throw new Error(errorData.title || 'Error al procesar pedido');
      } catch (jsonErr: any) {
        if (jsonErr.message && !jsonErr.message.includes('JSON')) throw jsonErr;
        const rawText = await response.text();
        throw new Error(rawText || 'Error de conexión con el servidor');
      }
    }
  }
};
