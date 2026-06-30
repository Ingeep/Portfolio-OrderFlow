import { useState } from 'react'
import { ShoppingBag, Loader2, ArrowRight, AlertCircle } from 'lucide-react'

interface LoginViewProps {
  onLoginSuccess: (token: string, username: string) => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const ORDERS_API_URL = import.meta.env.VITE_ORDERS_API_URL || 'http://localhost:5252';

export function LoginView({ onLoginSuccess, showToast }: LoginViewProps) {
  const [loginUsername, setLoginUsername] = useState('admin@orderflow.com');
  const [loginPassword, setLoginPassword] = useState('Admin123!');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

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
      
      onLoginSuccess(data.token, loginUsername);
      showToast('Sesión iniciada con éxito. Autenticación JWT activa.', 'success');
    } catch (err) {
      showToast('Error de autenticación. Verifica tus credenciales.', 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div style={{ display: 'flex', width: '100%', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#090a10', padding: '1rem' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center', marginBottom: '2rem' }}>
          <div className="brand-icon" style={{ backgroundColor: 'var(--primary)', padding: '0.5rem', borderRadius: '8px', color: '#fff', display: 'flex' }}>
            <ShoppingBag size={22} />
          </div>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Outfit', letterSpacing: '-0.5px' }}>OrderFlow</span>
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
              disabled={isLoggingIn}
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
              disabled={isLoggingIn}
            />
          </div>

          <button 
            type="submit" 
            className="btn-secondary" 
            style={{ width: '100%', justifyContent: 'center', padding: '0.9rem' }}
            disabled={isLoggingIn}
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="animate-spin" size={18} style={{ marginRight: '0.5rem' }} />
                Iniciando sesión...
              </>
            ) : (
              <>
                Entrar al Sistema
                <ArrowRight size={18} style={{ marginLeft: '0.5rem' }} />
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
