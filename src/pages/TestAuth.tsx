// src/pages/TestAuth.tsx
import { useState } from 'react';
import { useAuth } from '@/features/auth/AuthProvider';
import { createSales } from '@/features/sales/api/sales.api';

export function TestAuth() {
  const { user, isAuthenticated, login, logout } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [testResult, setTestResult] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(username, password);
      console.log('✅ Login successful!');
    } catch (err) {
      setError('Login failed: ' + err);
      console.error('❌ Login error:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      console.log('✅ Logout successful!');
    } catch (err) {
      console.error('❌ Logout error:', err);
    }
  };

  const testProtectedEndpoint = async () => {
    try {
      const result = await createSales({
        date: "2025-10-23",
        items: [
          { product: "Gold Ring", 
            quantity: '2', 
            price: '150.0',
            total: '300.0',
            invoice_number: "string",
            customer: "string",
            item_code: "string",
            item: "string",
            sold_by: "string",
            gold_weight: "string",
            kdm_vori: "string",
            is_rst: false,
            sale_price: "string",
            cash_card_payment: "string",
            gold_payment: "string",
            rst_payment: "string",
            rst_advanced: "string",
            customer_due: "string",
            due_by: "string",
            payment_type: "string",
            }
        ]
      });
      setTestResult(JSON.stringify(result, null, 2));
      console.log('✅ Protected endpoint success:', result);
    } catch (err) {
      setTestResult('Error: ' + err);
      console.error('❌ Protected endpoint error:', err);
    }
  };

//   if (loading) return <div>Loading...</div>;

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Auth Test Page</h1>
      
      {/* Auth Status */}
      <div style={{ background: '#f0f0f0', padding: '1rem', marginBottom: '2rem' }}>
        <h2>Status:</h2>
        <p>Authenticated: {isAuthenticated ? '✅ Yes' : '❌ No'}</p>
        {user && (
          <div>
            <p>User ID: {user.id}</p>
            <p>Username: {user.username}</p>
            <p>Email: {user.email || 'N/A'}</p>
          </div>
        )}
      </div>

      {/* Login Form */}
      {!isAuthenticated && (
        <form onSubmit={handleLogin} style={{ marginBottom: '2rem' }}>
          <h2>Login</h2>
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

      {/* Logout & Test Buttons */}
      {isAuthenticated && (
        <div>
          <button onClick={handleLogout} style={{ padding: '0.5rem 1rem', marginRight: '1rem' }}>
            Logout
          </button>
          <button onClick={testProtectedEndpoint} style={{ padding: '0.5rem 1rem' }}>
            Test Protected Endpoint
          </button>
          
          {testResult && (
            <pre style={{ background: '#f0f0f0', padding: '1rem', marginTop: '1rem' }}>
              {testResult}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}