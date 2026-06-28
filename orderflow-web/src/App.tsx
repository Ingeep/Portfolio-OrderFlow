import { useState, useEffect } from 'react'
import { 
  ShoppingBag, 
  Database, 
  ListOrdered, 
  Plus, 
  Trash2, 
  LogOut, 
  Check, 
  X, 
  Clipboard, 
  ArrowRight, 
  Loader2, 
  AlertCircle 
} from 'lucide-react'
import './App.css'

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------
const CATALOG_API_URL = 'https://catalog-api.ashysand-f5d12ed9.centralus.azurecontainerapps.io';
const ORDERS_API_URL = 'https://orders-api.ashysand-f5d12ed9.centralus.azurecontainerapps.io';

// -------------------------------------------------------------
// TypeScript Interfaces
// -------------------------------------------------------------
interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  attributes: Record<string, string>;
}

interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  customerEmail: string;
  totalAmount: number;
  items: OrderItem[];
  createdAt: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface Toast {
  message: string;
  type: 'success' | 'error' | 'info';
}

function App() {
  // Navigation & Authentication
  const [token, setToken] = useState<string | null>(localStorage.getItem('jwt_token'));
  const [activeTab, setActiveTab] = useState<'catalog' | 'create-order' | 'orders'>('catalog');
  const [username, setUsername] = useState<string>('');
  const [loginUsername, setLoginUsername] = useState<string>('admin@orderflow.com');
  const [loginPassword, setLoginPassword] = useState<string>('Admin123!');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [catalogLoading, setCatalogLoading] = useState<boolean>(false);
  const [ordersLoading, setOrdersLoading] = useState<boolean>(false);

  // Forms & Modal State
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState<boolean>(false);
  const [newProdName, setNewProdName] = useState<string>('');
  const [newProdPrice, setNewProdPrice] = useState<number>(0);
  const [newProdDesc, setNewProdDesc] = useState<string>('');
  const [newProdCat, setNewProdCat] = useState<string>('Tecnología');
  const [newProdAttrs, setNewProdAttrs] = useState<{ key: string; value: string }[]>([
    { key: 'Garantía', value: '1 año' }
  ]);
  const [isSavingProduct, setIsSavingProduct] = useState<boolean>(false);

  // Cart & Order Flow State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [isPlacingOrder, setIsPlacingOrder] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Global Toast Notification
  const [toast, setToast] = useState<Toast | null>(null);

  // -------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Decode Username from simple token or store it
  useEffect(() => {
    if (token) {
      const storedUser = localStorage.getItem('username');
      setUsername(storedUser || 'Usuario Demo');
      fetchProducts();
      fetchOrders();
    }
  }, [token]);

  // -------------------------------------------------------------
  // API Calls
  // -------------------------------------------------------------
  const fetchProducts = async () => {
    setCatalogLoading(true);
    try {
      const response = await fetch(`${CATALOG_API_URL}/api/catalog`);
      if (!response.ok) throw new Error('Error al cargar catálogo');
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      showToast('No se pudo conectar al Catálogo API NoSQL en Azure', 'error');
    } finally {
      setCatalogLoading(false);
    }
  };

  const fetchOrders = async () => {
    if (!token) return;
    setOrdersLoading(true);
    try {
      const response = await fetch(`${ORDERS_API_URL}/api/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Error al cargar pedidos');
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      showToast('No se pudo conectar a la API de Pedidos en Azure', 'error');
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const response = await fetch(`${ORDERS_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });

      if (!response.ok) throw new Error('Credenciales inválidas');
      const data = await response.json();
      
      localStorage.setItem('jwt_token', data.token);
      localStorage.setItem('username', loginUsername);
      setToken(data.token);
      showToast('Sesión iniciada con éxito. Autenticación JWT activa.', 'success');
    } catch (err) {
      showToast('Error de autenticación. Verifica tus credenciales.', 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('username');
    setToken(null);
    setCart([]);
    showToast('Sesión cerrada. Credenciales JWT removidas.', 'info');
  };

  const handleAddAttribute = () => {
    setNewProdAttrs([...newProdAttrs, { key: '', value: '' }]);
  };

  const handleRemoveAttribute = (index: number) => {
    setNewProdAttrs(newProdAttrs.filter((_, i) => i !== index));
  };

  const handleAttributeChange = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...newProdAttrs];
    updated[index][field] = value;
    setNewProdAttrs(updated);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || newProdPrice <= 0) {
      showToast('Por favor, ingresa nombre y precio válido.', 'error');
      return;
    }

    setIsSavingProduct(true);
    // Convert attributes array to dynamic object key-value
    const attributesObj: Record<string, string> = {};
    newProdAttrs.forEach(attr => {
      if (attr.key.trim() && attr.value.trim()) {
        attributesObj[attr.key.trim()] = attr.value.trim();
      }
    });

    const payload = {
      name: newProdName,
      price: newProdPrice,
      description: newProdDesc,
      category: newProdCat,
      attributes: attributesObj
    };

    try {
      const response = await fetch(`${CATALOG_API_URL}/api/catalog`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Error al guardar producto');
      showToast('Producto agregado al catálogo NoSQL en Cosmos DB.', 'success');
      
      // Reset form
      setNewProdName('');
      setNewProdPrice(0);
      setNewProdDesc('');
      setNewProdAttrs([{ key: 'Garantía', value: '1 año' }]);
      setIsCatalogModalOpen(false);
      
      // Refresh list
      fetchProducts();
    } catch (err) {
      showToast('Error al guardar el producto en el catálogo', 'error');
    } finally {
      setIsSavingProduct(false);
    }
  };

  // Cart Operations
  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
    showToast(`"${product.name}" añadido al carrito.`, 'info');
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    const updated = cart.map(item => {
      if (item.product.id === productId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean) as CartItem[];
    setCart(updated);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerEmail.trim()) {
      showToast('Por favor, ingresa el correo del cliente.', 'error');
      return;
    }
    if (cart.length === 0) {
      showToast('El carrito está vacío.', 'error');
      return;
    }

    setIsPlacingOrder(true);
    const orderItems = cart.map(item => ({
      productId: item.product.id,
      quantity: item.quantity
    }));

    const payload = {
      customerEmail: customerEmail.trim(),
      items: orderItems
    };

    try {
      const response = await fetch(`${ORDERS_API_URL}/api/orders`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Error al procesar pedido');
      }

      showToast('¡Pedido creado! Evento publicado en Azure Service Bus.', 'success');
      setCart([]);
      setCustomerEmail('');
      fetchOrders();
      setActiveTab('orders');
    } catch (err: any) {
      showToast(err.message || 'Error al enviar pedido a Azure SQL', 'error');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // -------------------------------------------------------------
  // Render Login Screen if not authenticated
  // -------------------------------------------------------------
  if (!token) {
    return (
      <div style={{ display: 'flex', width: '100%', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#090a10', padding: '1rem' }}>
        <div className="glass-card" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}>
          <div className="brand" style={{ justifyContent: 'center', marginBottom: '2rem' }}>
            <div className="brand-icon">
              <ShoppingBag size={22} />
            </div>
            <span className="brand-name">OrderFlow</span>
          </div>

          <h2 style={{ textAlign: 'center', marginBottom: '0.5rem', fontFamily: 'Outfit', fontWeight: 700 }}>Iniciar Sesión</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '2rem' }}>
            Accede al sistema de gestión de pedidos
          </p>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Usuario / Correo</label>
              <input 
                type="text" 
                className="form-input" 
                value={loginUsername} 
                onChange={(e) => setLoginUsername(e.target.value)} 
                required 
              />
            </div>
            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="form-label">Contraseña</label>
              <input 
                type="password" 
                className="form-input" 
                value={loginPassword} 
                onChange={(e) => setLoginPassword(e.target.value)} 
                required 
              />
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              style={{ width: '100%', justifyContent: 'center', padding: '0.9rem' }}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Iniciando sesión...
                </>
              ) : (
                <>
                  Entrar al Sistema
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', padding: '0.75rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(59, 130, 246, 0.2)', fontSize: '0.75rem', color: '#60a5fa', display: 'flex', gap: '0.5rem' }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>
              <strong>Modo de pruebas:</strong> El sistema acepta cualquier credencial. Presiona "Entrar" directamente para usar los datos preestablecidos.
            </span>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Render Dashboard
  // -------------------------------------------------------------
  return (
    <>
      {/* Sidebar Navigation */}
      <nav className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <ShoppingBag size={22} />
          </div>
          <span className="brand-name">OrderFlow</span>
        </div>

        <ul className="nav-menu">
          <li 
            className={`nav-item ${activeTab === 'catalog' ? 'active' : ''}`}
            onClick={() => setActiveTab('catalog')}
          >
            <Database className="nav-item-icon" />
            Catálogo NoSQL
          </li>
          <li 
            className={`nav-item ${activeTab === 'create-order' ? 'active' : ''}`}
            onClick={() => setActiveTab('create-order')}
          >
            <ShoppingBag className="nav-item-icon" />
            Crear Pedido
          </li>
          <li 
            className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <ListOrdered className="nav-item-icon" />
            Historial Pedidos
          </li>
        </ul>

        <div className="sidebar-footer">
          <div className="user-avatar">
            {username.substring(0, 2).toUpperCase()}
          </div>
          <div className="user-info">
            <span className="user-name">{username.split('@')[0]}</span>
            <span className="user-role">Administrador</span>
          </div>
          <button 
            onClick={handleLogout} 
            style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            title="Cerrar Sesión"
          >
            <LogOut size={18} />
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="main-content">
        
        {/* TAB 1: Catalog Dashboard */}
        {activeTab === 'catalog' && (
          <div>
            <div className="header-container">
              <div>
                <h1 className="page-title">Catálogo de Productos</h1>
                <p className="page-subtitle">Almacenado en la base de datos distribuida NoSQL Cosmos DB</p>
              </div>
              <button className="btn-primary" onClick={() => setIsCatalogModalOpen(true)}>
                <Plus size={18} />
                Nuevo Producto
              </button>
            </div>

            {catalogLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '1rem' }}>
                <Loader2 className="animate-spin" size={36} style={{ color: 'var(--accent-primary)' }} />
                <span style={{ color: 'var(--text-secondary)' }}>Cargando catálogo desde Azure...</span>
              </div>
            ) : products.length === 0 ? (
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem', textAlign: 'center' }}>
                <Database size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                <h3>Catálogo Vacío</h3>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
                  Aún no hay productos en la base de datos de MongoDB. Agrega tu primer producto usando el botón superior.
                </p>
                <button className="btn-primary" onClick={() => setIsCatalogModalOpen(true)}>
                  <Plus size={18} />
                  Crear primer producto
                </button>
              </div>
            ) : (
              <div className="grid-container">
                {products.map(product => (
                  <div className="glass-card" key={product.id} style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <span className="badge badge-info">{product.category}</span>
                      <span style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                        ${product.price.toFixed(2)}
                      </span>
                    </div>
                    <h3 style={{ fontFamily: 'Outfit', fontWeight: 600, fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                      {product.name}
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', flexGrow: 1, marginBottom: '1.5rem' }}>
                      {product.description || 'Sin descripción disponible.'}
                    </p>

                    {/* Attributes */}
                    {product.attributes && Object.keys(product.attributes).length > 0 && (
                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: 'auto' }}>
                        <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>
                          Atributos Dinámicos
                        </h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {Object.entries(product.attributes).map(([key, val]) => (
                            <span key={key} style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                              <strong>{key}:</strong> {val}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Place Order Form */}
        {activeTab === 'create-order' && (
          <div>
            <div className="header-container">
              <div>
                <h1 className="page-title">Crear Nuevo Pedido</h1>
                <p className="page-subtitle">Registra la orden en SQL Azure y publica el evento en Service Bus</p>
              </div>
            </div>

            <div className="order-layout">
              {/* Product Selection List */}
              <div className="glass-card" style={{ padding: '2rem' }}>
                <h3 style={{ fontFamily: 'Outfit', fontWeight: 600, marginBottom: '1.5rem' }}>Selecciona Productos</h3>
                {products.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)' }}>Carga productos en la pestaña de Catálogo primero.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {products.map(product => (
                      <div key={product.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                        <div>
                          <h4 style={{ fontWeight: 600 }}>{product.name}</h4>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{product.category}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>${product.price.toFixed(2)}</span>
                          <button className="quantity-btn" onClick={() => addToCart(product)} style={{ backgroundColor: 'var(--accent-primary)', borderColor: 'transparent' }}>
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Shopping Cart & Checkout Form */}
              <div className="glass-card" style={{ padding: '2rem', height: 'fit-content' }}>
                <h3 style={{ fontFamily: 'Outfit', fontWeight: 600, marginBottom: '1.5rem' }}>Resumen del Pedido</h3>
                
                {cart.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                    El carrito está vacío
                  </div>
                ) : (
                  <form onSubmit={handlePlaceOrder}>
                    <div className="cart-items-container" style={{ marginBottom: '2rem' }}>
                      {cart.map(item => (
                        <div className="cart-item" key={item.product.id}>
                          <div className="cart-item-details">
                            <span className="cart-item-name">{item.product.name}</span>
                            <span className="cart-item-price">${(item.product.price * item.quantity).toFixed(2)}</span>
                          </div>
                          <div className="cart-quantity-controls">
                            <button type="button" className="quantity-btn" onClick={() => updateCartQuantity(item.product.id, -1)}>-</button>
                            <span className="quantity-display">{item.quantity}</span>
                            <button type="button" className="quantity-btn" onClick={() => updateCartQuantity(item.product.id, 1)}>+</button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 700, marginBottom: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                      <span>Monto Total:</span>
                      <span style={{ color: 'var(--accent-primary)' }}>
                        ${cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0).toFixed(2)}
                      </span>
                    </div>

                    <div className="form-group" style={{ marginBottom: '2rem' }}>
                      <label className="form-label">Correo del Cliente</label>
                      <input 
                        type="email" 
                        className="form-input" 
                        placeholder="cliente@ejemplo.com"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        required
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="btn-primary" 
                      style={{ width: '100%', justifyContent: 'center', padding: '0.9rem' }}
                      disabled={isPlacingOrder}
                    >
                      {isPlacingOrder ? (
                        <>
                          <Loader2 className="animate-spin" size={18} />
                          Procesando en Azure...
                        </>
                      ) : (
                        'Confirmar y Enviar Pedido'
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Orders History List */}
        {activeTab === 'orders' && (
          <div>
            <div className="header-container">
              <div>
                <h1 className="page-title">Historial de Pedidos</h1>
                <p className="page-subtitle">Listado de órdenes persistidas de forma relacional en SQL Azure</p>
              </div>
              <button className="btn-secondary" onClick={fetchOrders} disabled={ordersLoading}>
                Actualizar Lista
              </button>
            </div>

            {ordersLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '1rem' }}>
                <Loader2 className="animate-spin" size={36} style={{ color: 'var(--accent-primary)' }} />
                <span style={{ color: 'var(--text-secondary)' }}>Cargando historial desde SQL Server...</span>
              </div>
            ) : orders.length === 0 ? (
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem', textAlign: 'center' }}>
                <ListOrdered size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                <h3>No hay pedidos registrados</h3>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', marginTop: '0.5rem' }}>
                  Aún no se han enviado pedidos al servidor SQL en Azure. Ve a la pestaña de "Crear Pedido" para enviar la primera orden.
                </p>
              </div>
            ) : (
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Código Pedido (GUID)</th>
                      <th>Cliente</th>
                      <th>Fecha</th>
                      <th>Monto Total</th>
                      <th>Estado Cola</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <tr key={order.id}>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {order.id}
                        </td>
                        <td>{order.customerEmail}</td>
                        <td>{new Date(order.createdAt).toLocaleString()}</td>
                        <td style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>
                          ${order.totalAmount.toFixed(2)}
                        </td>
                        <td>
                          <span className="badge badge-success">Procesado</span>
                        </td>
                        <td>
                          <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => setSelectedOrder(order)}>
                            Ver Detalle
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* -------------------------------------------------------------
       * Modal: Crear Nuevo Producto
       * ------------------------------------------------------------- */}
      {isCatalogModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Agregar Producto</h3>
              <button className="modal-close" onClick={() => setIsCatalogModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct}>
              <div className="form-group">
                <label className="form-label">Nombre del Producto</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ej. iPhone 17 Pro"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Precio ($ USD)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="form-input" 
                    placeholder="999.99"
                    value={newProdPrice || ''}
                    onChange={(e) => setNewProdPrice(parseFloat(e.target.value))}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Categoría</label>
                  <select 
                    className="form-input" 
                    value={newProdCat}
                    onChange={(e) => setNewProdCat(e.target.value)}
                  >
                    <option value="Tecnología">Tecnología</option>
                    <option value="Hogar">Hogar</option>
                    <option value="Deportes">Deportes</option>
                    <option value="Moda">Moda</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea 
                  className="form-input" 
                  rows={2}
                  placeholder="Breve descripción del producto..."
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                />
              </div>

              {/* Dynamic Attributes */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label className="form-label">Atributos Dinámicos NoSQL</label>
                  <button type="button" className="btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={handleAddAttribute}>
                    + Añadir Atributo
                  </button>
                </div>

                {newProdAttrs.map((attr, idx) => (
                  <div className="dynamic-attr-row" key={idx}>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Propiedad (ej. Color)" 
                      value={attr.key}
                      onChange={(e) => handleAttributeChange(idx, 'key', e.target.value)}
                    />
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Valor (ej. Negro)" 
                      value={attr.value}
                      onChange={(e) => handleAttributeChange(idx, 'value', e.target.value)}
                    />
                    {newProdAttrs.length > 1 && (
                      <button type="button" className="btn-remove-attr" onClick={() => handleRemoveAttribute(idx)}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setIsCatalogModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={isSavingProduct}>
                  {isSavingProduct ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Guardando...
                    </>
                  ) : (
                    'Guardar Producto'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
       * Modal: Ver Detalles del Pedido
       * ------------------------------------------------------------- */}
      {selectedOrder && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Detalle de Factura</h3>
              <button className="modal-close" onClick={() => setSelectedOrder(null)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem', fontSize: '0.9rem', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div><strong>Código de Transacción:</strong> <span style={{ fontFamily: 'monospace' }}>{selectedOrder.id}</span></div>
              <div><strong>Cliente:</strong> {selectedOrder.customerEmail}</div>
              <div><strong>Fecha de Creación:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</div>
            </div>

            <h4 style={{ fontFamily: 'Outfit', fontWeight: 600, marginBottom: '0.75rem' }}>Ítems en Pedido</h4>
            <div className="table-container" style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '2rem' }}>
              <table className="custom-table" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Precio Unitario</th>
                    <th>Cant.</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items && selectedOrder.items.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 500 }}>{item.productName || 'Producto Catalogado'}</td>
                      <td>${item.price.toFixed(2)}</td>
                      <td>{item.quantity}</td>
                      <td style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>
                        ${(item.price * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800, borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
              <span>Monto Total:</span>
              <span style={{ color: 'var(--accent-primary)' }}>${selectedOrder.totalAmount.toFixed(2)}</span>
            </div>

            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '2rem' }} onClick={() => setSelectedOrder(null)}>
              Cerrar Factura
            </button>
          </div>
        </div>
      )}

      {/* Global Toast Notification Banner */}
      {toast && (
        <div className="toast" style={{ borderLeftColor: toast.type === 'success' ? '#10b981' : toast.type === 'error' ? '#ef4444' : '#8b5cf6' }}>
          {toast.type === 'success' && <Check size={18} style={{ color: '#10b981' }} />}
          {toast.type === 'error' && <X size={18} style={{ color: '#ef4444' }} />}
          {toast.type === 'info' && <Clipboard size={18} style={{ color: '#8b5cf6' }} />}
          <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{toast.message}</span>
        </div>
      )}
    </>
  );
}

export default App;
