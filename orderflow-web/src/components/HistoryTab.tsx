import { useState } from 'react'
import { ListOrdered, Loader2, Copy } from 'lucide-react'
import type { Order } from '../types';
import { InvoiceModal } from './InvoiceModal'

interface HistoryTabProps {
  orders: Order[];
  loading: boolean;
  onRefresh: () => Promise<void>;
}

export function HistoryTab({ orders, loading, onRefresh }: HistoryTabProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  return (
    <div>
      <div className="header-container">
        <div>
          <h1 className="page-title">Historial de Pedidos</h1>
          {/* <p className="page-subtitle">Listado de órdenes persistidas de forma relacional en SQL Azure</p> */}
        </div>
        <button 
          className="btn-secondary" 
          onClick={onRefresh} 
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={16} style={{ marginRight: '0.5rem' }} />
              Cargando...
            </>
          ) : 'Actualizar Historial'}
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem' }}>
          <Loader2 size={36} className="animate-spin" style={{ color: 'var(--accent-primary)', marginBottom: '1rem' }} />
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
                <th>Código Pedido</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Monto Total</th>
                <th>Estado Cola</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span title={order.id} style={{ cursor: 'help', fontWeight: 600, color: 'var(--accent-primary)' }}>
                        #{order.id.substring(0, 8).toUpperCase()}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(order.id);
                        }}
                        style={{ background: 'transparent', border: 'none', padding: 0, color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                        title="Copiar GUID completo"
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                  </td>
                  <td>{order.customerEmail}</td>
                  <td>{new Date(order.createdAt).toLocaleString()}</td>
                  <td style={{ fontWeight: 600 }}>${order.totalAmount.toFixed(2)}</td>
                  <td>
                    <span className="badge badge-success">Procesado</span>
                  </td>
                  <td>
                    <button 
                      className="btn-secondary" 
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                      onClick={() => setSelectedOrder(order)}
                    >
                      Ver Detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedOrder && (
        <InvoiceModal 
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}
