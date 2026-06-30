export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  attributes: Record<string, string>;
}

export interface OrderItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
}

export interface Order {
  id: string;
  customerEmail: string;
  totalAmount: number;
  items: OrderItem[];
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Toast {
  message: string;
  type: 'success' | 'error' | 'info';
}
