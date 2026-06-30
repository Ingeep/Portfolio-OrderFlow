import { useState } from 'react'
import { Plus, Trash2, Database, Loader2 } from 'lucide-react'
import type { Product } from '../types';
import { AddProductModal } from './AddProductModal'

interface CatalogTabProps {
  products: Product[];
  loading: boolean;
  onDeleteProduct: (id: string) => Promise<void>;
  onAddProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  isSavingProduct: boolean;
}

export function CatalogTab({ products, loading, onDeleteProduct, onAddProduct, isSavingProduct }: CatalogTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async (productData: Omit<Product, 'id'>) => {
    await onAddProduct(productData);
    setIsModalOpen(false);
  };

  return (
    <div>
      <div className="header-container">
        <div>
          <h1 className="page-title">Catálogo de Productos</h1>
          {/* <p className="page-subtitle">Catálogo dinámico flexible administrado en Cosmos DB (MongoDB API)</p> */}
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          Agregar Producto
        </button>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <input 
          type="text" 
          placeholder="Buscar por nombre o categoría..." 
          className="form-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem' }}>
          <Loader2 size={36} className="animate-spin" style={{ color: 'var(--accent-primary)', marginBottom: '1rem' }} />
          <span style={{ color: 'var(--text-secondary)' }}>Conectando a Cosmos DB...</span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem', textAlign: 'center' }}>
          <Database size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h3>No hay productos registrados</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', marginTop: '0.5rem' }}>
            {searchTerm ? 'No se encontraron productos coincidentes con tu búsqueda.' : 'Agrega tu primer producto dinámico haciendo clic en el botón superior.'}
          </p>
        </div>
      ) : (
        <div className="grid-container">
          {filteredProducts.map((product) => (
            <div key={product.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <span className="badge badge-info">{product.category}</span>
                <span style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                  ${product.price.toFixed(2)}
                </span>
              </div>
              <h3 style={{ fontFamily: 'Outfit', fontWeight: 600, fontSize: '1.2rem', marginBottom: '0.5rem' }}>{product.name}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', flexGrow: 1, marginBottom: '1.5rem' }}>
                {product.description || 'Sin descripción disponible.'}
              </p>
              
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

              <div style={{ marginTop: '1.5rem' }}>
                <button 
                  className="btn-secondary" 
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => onDeleteProduct(product.id)}
                >
                  <Trash2 size={16} />
                  Eliminar Producto
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <AddProductModal 
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          isSaving={isSavingProduct}
        />
      )}
    </div>
  );
}
