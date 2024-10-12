import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BPORT = process.env.REACT_APP_BPORT;

function Login({ setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await axios.post('http://localhost:' + BPORT + '/api/login', {
        email,
        password,
      });

      // If the request is successful, update the user state and navigate to home
      setUser(response.data.user);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Navigate to home page
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Error logging in');
    }
  };

  return (
    <div className="login-page">
      <h2>Login</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <input
        type="text"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin}>Login</button>
      <p>Don't have an account? <button onClick={() => navigate('/signup')}>Sign Up</button></p>
    </div>
  );
}

export default Login;
