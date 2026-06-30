import { useState, useEffect } from 'react'
import type { Toast as ToastType, Product, Order, CartItem } from './types'
import { apiService } from './services/apiService'
import { Sidebar } from './components/Sidebar'
import { CatalogTab } from './components/CatalogTab'
import { OrderTab } from './components/OrderTab'
import { HistoryTab } from './components/HistoryTab'
import { LoginView } from './components/LoginView'
import { Toast } from './components/Toast'
import './App.css'

function App() {
  // Navigation & Authentication
  const [token, setToken] = useState<string | null>(localStorage.getItem('jwt_token'));
  const [activeTab, setActiveTab] = useState<'catalog' | 'create-order' | 'orders'>('catalog');
  const [username, setUsername] = useState<string>('');

  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [catalogLoading, setCatalogLoading] = useState<boolean>(false);
  const [ordersLoading, setOrdersLoading] = useState<boolean>(false);

  // Operations State
  const [isSavingProduct, setIsSavingProduct] = useState<boolean>(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState<boolean>(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [toast, setToast] = useState<ToastType | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  };

  // Sync token changes to load database data
  useEffect(() => {
    if (token) {
      const storedUser = localStorage.getItem('username');
      setUsername(storedUser || 'Usuario Demo');
      loadProducts();
      loadOrders();
    }
  }, [token]);

  // --- Actions ---
  const loadProducts = async () => {
    setCatalogLoading(true);
    try {
      const data = await apiService.getProducts();
      setProducts(data);
    } catch (err) {
      showToast('No se pudo conectar al Catálogo API NoSQL en Azure', 'error');
    } finally {
      setCatalogLoading(false);
    }
  };

  const loadOrders = async () => {
    if (!token) return;
    setOrdersLoading(true);
    try {
      const data = await apiService.getOrders();
      setOrders(data);
    } catch (err) {
      showToast('No se pudo conectar a la API de Pedidos en Azure', 'error');
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleAddProduct = async (productData: Omit<Product, 'id'>) => {
    setIsSavingProduct(true);
    try {
      await apiService.createProduct(productData);
      showToast('¡Producto guardado exitosamente en Cosmos DB!', 'success');
      loadProducts();
    } catch (err) {
      showToast('Error al guardar el producto en el catálogo.', 'error');
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await apiService.deleteProduct(id);
      showToast('Producto eliminado del catálogo.', 'success');
      loadProducts();
      // Limpiar del carrito si estaba agregado
      setCart(cart.filter(item => item.product.id !== id));
    } catch (err) {
      showToast('Error al intentar eliminar el producto.', 'error');
    }
  };

  // --- Cart Actions ---
  const handleAddToCart = (product: Product) => {
    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
    showToast(`${product.name} agregado al carrito.`, 'success');
  };

  const handleUpdateCartQuantity = (productId: string, delta: number) => {
    const existing = cart.find(item => item.product.id === productId);
    if (!existing) return;

    const newQty = existing.quantity + delta;
    if (newQty <= 0) {
      setCart(cart.filter(item => item.product.id !== productId));
      showToast('Producto removido del carrito.', 'info');
    } else {
      setCart(cart.map(item => 
        item.product.id === productId ? { ...item, quantity: newQty } : item
      ));
    }
  };

  const handlePlaceOrder = async (customerEmail: string) => {
    setIsPlacingOrder(true);
    try {
      const orderItems = cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity
      }));

      await apiService.createOrder({ customerEmail, items: orderItems });
      
      showToast('¡Pedido creado! Evento publicado en Azure Service Bus.', 'success');
      setCart([]);
      loadOrders();
      setActiveTab('orders');
    } catch (err: any) {
      showToast(err.message || 'Error al procesar pedido', 'error');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('username');
    setToken(null);
    setCart([]);
    showToast('Sesión cerrada. Credenciales JWT removidas.', 'info');
  };

  // Auth Guard
  if (!token) {
    return <LoginView onLoginSuccess={(t, u) => { setToken(t); setUsername(u); }} showToast={showToast} />;
  }

  return (
    <>
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        username={username}
        onLogout={handleLogout}
      />
      
      <main className="main-content">
        {activeTab === 'catalog' && (
          <CatalogTab 
            products={products} 
            loading={catalogLoading} 
            onDeleteProduct={handleDeleteProduct} 
            onAddProduct={handleAddProduct}
            isSavingProduct={isSavingProduct}
          />
        )}

        {activeTab === 'create-order' && (
          <OrderTab 
            products={products}
            cart={cart}
            onAddToCart={handleAddToCart}
            onUpdateCartQuantity={handleUpdateCartQuantity}
            onPlaceOrder={handlePlaceOrder}
            isPlacingOrder={isPlacingOrder}
          />
        )}

        {activeTab === 'orders' && (
          <HistoryTab 
            orders={orders} 
            loading={ordersLoading} 
            onRefresh={loadOrders} 
          />
        )}
      </main>

      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    </>
  );
}

export default App;
