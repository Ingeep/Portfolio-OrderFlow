import { LogOut } from 'lucide-react'

interface HeaderProps {
  username: string;
  onLogout: () => void;
}

export function Header({ username, onLogout }: HeaderProps) {
  return (
    <header className="main-header">
      <div className="header-brand">
        <h2 className="brand-title">OrderFlow</h2>
        <span className="brand-badge">Enterprise v2.0</span>
      </div>

      <div className="user-profile">
        <div className="user-info">
          <span className="user-name">{username}</span>
          <span className="user-role">Administrador</span>
        </div>
        <button 
          className="logout-button" 
          onClick={onLogout}
          title="Cerrar sesión"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
