// src/pages/LoginPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthProvider';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { user, isAuthenticated, login, logout } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  return (
    <>
      {!isAuthenticated && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
          <h2>LOGIN</h2>
          <div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              style={{ display: 'block', marginBottom: '0.5rem', padding: '0.5rem' }}
            />
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              style={{ display: 'block', marginBottom: '0.5rem', padding: '0.5rem' }}
            />
          </div>
          <button type="submit" style={{ padding: '0.5rem 1rem' }}>Login</button>
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </form>
      )}
    </>
  );
}
