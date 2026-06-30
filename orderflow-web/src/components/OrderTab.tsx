import { useState } from 'react'
import { Plus, ShoppingBag, Loader2 } from 'lucide-react'
import type { Product, CartItem } from '../types';

interface OrderTabProps {
  products: Product[];
  cart: CartItem[];
  onAddToCart: (product: Product) => void;
  onUpdateCartQuantity: (productId: string, delta: number) => void;
  onPlaceOrder: (customerEmail: string) => Promise<void>;
  isPlacingOrder: boolean;
}

export function OrderTab({ products, cart, onAddToCart, onUpdateCartQuantity, onPlaceOrder, isPlacingOrder }: OrderTabProps) {
  const [customerEmail, setCustomerEmail] = useState('');

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerEmail.trim()) return;
    
    await onPlaceOrder(customerEmail.trim());
    setCustomerEmail(''); // Limpiar correo tras éxito
  };

  return (
    <div>
      <div className="header-container">
        <div>
          <h1 className="page-title">Crear Nuevo Pedido</h1>
          {/* <p className="page-subtitle">Registra la orden en SQL Azure y publica el evento en Service Bus</p> */}
        </div>
      </div>

      <div className="order-layout">
        {/* Left: Product Selection List */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ fontFamily: 'Outfit', fontWeight: 600, marginBottom: '1.5rem' }}>Selecciona Productos</h3>
          {products.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>Carga productos en la pestaña de Catálogo primero.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {products.map(product => (
                <div key={product.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                  <div>
                    <h4 style={{ fontWeight: 600, margin: 0 }}>{product.name}</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{product.category}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>${product.price.toFixed(2)}</span>
                    <button 
                      className="quantity-btn" 
                      onClick={() => onAddToCart(product)}
                      style={{ backgroundColor: 'var(--accent-primary)', borderColor: 'transparent', color: '#fff' }}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Shopping Cart & Checkout Form */}
        <div className="glass-card" style={{ padding: '2rem', height: 'fit-content' }}>
          <h3 style={{ fontFamily: 'Outfit', fontWeight: 600, marginBottom: '1.5rem' }}>Resumen del Pedido</h3>
          
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
              El carrito está vacío
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="cart-items-container" style={{ marginBottom: '2rem' }}>
                {cart.map(item => (
                  <div className="cart-item" key={item.product.id}>
                    <div className="cart-item-details">
                      <span className="cart-item-name">{item.product.name}</span>
                      <span className="cart-item-price">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                    <div className="cart-quantity-controls">
                      <button 
                        type="button" 
                        className="quantity-btn" 
                        onClick={() => onUpdateCartQuantity(item.product.id, -1)}
                      >
                        -
                      </button>
                      <span className="quantity-display">
                        {item.quantity}
                      </span>
                      <button 
                        type="button" 
                        className="quantity-btn" 
                        onClick={() => onUpdateCartQuantity(item.product.id, 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 700, marginBottom: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                <span>Monto Total:</span>
                <span style={{ color: 'var(--accent-primary)' }}>
                  ${cartTotal.toFixed(2)}
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
                  disabled={isPlacingOrder}
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
                  <>
                    <ShoppingBag size={18} />
                    Confirmar y Enviar Pedido
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
