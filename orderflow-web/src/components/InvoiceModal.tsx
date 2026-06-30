import { X } from 'lucide-react'
import type { Order } from '../types';

interface InvoiceModalProps {
  order: Order;
  onClose: () => void;
}

export function InvoiceModal({ order, onClose }: InvoiceModalProps) {
  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h3 className="modal-title">Detalle de Factura</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem', fontSize: '0.9rem', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <div><strong>Código de Transacción:</strong> <span style={{ fontFamily: 'monospace' }}>#{order.id.substring(0, 8).toUpperCase()}</span></div>
          <div><strong>Cliente:</strong> {order.customerEmail}</div>
          <div><strong>Fecha de Creación:</strong> {new Date(order.createdAt).toLocaleString()}</div>
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
              {order.items && order.items.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 500 }}>{item.productName || 'Producto Catalogado'}</td>
                  <td>${item.unitPrice.toFixed(2)}</td>
                  <td>{item.quantity}</td>
                  <td style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>
                    ${(item.unitPrice * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800, borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
          <span>Monto Total:</span>
          <span style={{ color: 'var(--accent-primary)' }}>${order.totalAmount.toFixed(2)}</span>
        </div>

        <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '2rem' }} onClick={onClose}>
          Cerrar Factura
        </button>
      </div>
    </div>
  );
}
