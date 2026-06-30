import { Database, ShoppingBag, ListOrdered, LogOut } from 'lucide-react'

interface SidebarProps {
  activeTab: 'catalog' | 'create-order' | 'orders';
  setActiveTab: (tab: 'catalog' | 'create-order' | 'orders') => void;
  username: string;
  onLogout: () => void;
}

export function Sidebar({ activeTab, setActiveTab, username, onLogout }: SidebarProps) {
  return (
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
          Catálogo
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
          onClick={onLogout} 
          style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
          title="Cerrar Sesión"
        >
          <LogOut size={18} />
        </button>
      </div>
    </nav>
  );
}
