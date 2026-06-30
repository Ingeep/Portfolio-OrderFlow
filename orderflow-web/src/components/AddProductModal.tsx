import { useState } from 'react'
import { Trash2, X, Loader2 } from 'lucide-react'
import type { Product } from '../types';

interface AddProductModalProps {
  onClose: () => void;
  onSave: (product: Omit<Product, 'id'>) => Promise<void>;
  isSaving: boolean;
}

export function AddProductModal({ onClose, onSave, isSaving }: AddProductModalProps) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Tecnología');
  const [attributes, setAttributes] = useState<{ key: string; value: string }[]>([
    { key: 'Garantía', value: '1 año' }
  ]);
  const [validationErrors, setValidationErrors] = useState<{ name?: string; price?: string }>({});

  const handleAddAttribute = () => {
    setAttributes([...attributes, { key: '', value: '' }]);
  };

  const handleRemoveAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  const handleAttributeChange = (index: number, field: 'key' | 'value', val: string) => {
    const updated = [...attributes];
    updated[index][field] = val;
    setAttributes(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors: { name?: string; price?: string } = {};
    if (!name.trim()) errors.name = 'El nombre es obligatorio.';
    if (price <= 0) errors.price = 'El precio debe ser mayor a 0.';

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});

    // Convertir el array de atributos clave-valor a un objeto Record<string, string> para MongoDB
    const attributesObj: Record<string, string> = {};
    attributes.forEach(attr => {
      if (attr.key.trim()) {
        attributesObj[attr.key.trim()] = attr.value;
      }
    });

    onSave({
      name: name.trim(),
      price,
      description: description.trim(),
      category,
      attributes: attributesObj
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title">Agregar Producto</h3>
          <button className="modal-close" onClick={onClose} disabled={isSaving}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {Object.values(validationErrors).map((err, i) => (
            <div key={i} className="validation-error-box">
              {err}
            </div>
          ))}

          <div className="form-group">
            <label className="form-label">Nombre del Producto</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Ej. iPhone 17 Pro"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required 
              disabled={isSaving}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Precio ($ USD)</label>
              <input 
                type="number" 
                step="0.01"
                className="form-input" 
                placeholder="0.00"
                value={price || ''}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                required 
                disabled={isSaving}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Categoría</label>
              <select 
                className="form-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isSaving}
              >
                <option value="Tecnología">Tecnología</option>
                <option value="Hogar">Hogar</option>
                <option value="Ropa">Ropa</option>
                <option value="Deportes">Deportes</option>
                <option value="Otros">Otros</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea 
              className="form-input" 
              style={{ minHeight: '60px', resize: 'vertical' }}
              placeholder="Características generales..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSaving}
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Atributos Dinámicos (NoSQL)</label>
              <button 
                type="button" 
                className="btn-secondary" 
                style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                onClick={handleAddAttribute}
                disabled={isSaving}
              >
                + Añadir Atributo
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '120px', overflowY: 'auto', paddingRight: '0.25rem' }}>
              {attributes.map((attr, index) => (
                <div key={index} className="dynamic-attr-row">
                  <input 
                    type="text" 
                    placeholder="Clave (Ej. Color)" 
                    className="form-input" 
                    value={attr.key}
                    onChange={(e) => handleAttributeChange(index, 'key', e.target.value)}
                    required
                    disabled={isSaving}
                  />
                  <input 
                    type="text" 
                    placeholder="Valor (Ej. Negro)" 
                    className="form-input" 
                    value={attr.value}
                    onChange={(e) => handleAttributeChange(index, 'value', e.target.value)}
                    required
                    disabled={isSaving}
                  />
                  <button 
                    type="button" 
                    className="btn-remove-attr"
                    onClick={() => handleRemoveAttribute(index)}
                    disabled={isSaving || attributes.length === 1}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button 
              type="button" 
              className="btn-secondary" 
              style={{ flex: 1 }}
              onClick={onClose}
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              style={{ flex: 1, justifyContent: 'center' }}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Guardando...
                </>
              ) : 'Guardar Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
