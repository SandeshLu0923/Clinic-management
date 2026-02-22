import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../store/slices/authSlice';
import { Button, Input, Card, Alert } from '../components/common/UI';
import { Link, useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await dispatch(login({ email, password }));
      
      // Check if the action was fulfilled
      if (login.fulfilled.match(result)) {
        const { user } = result.payload;
        if (user && user.role) {
          setTimeout(() => {
            navigate(`/${user.role}/dashboard`);
          }, 100);
        }
      } else if (login.rejected.match(result)) {
        console.error('Login failed:', result.payload);
      }
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl">
          <h1 className="text-3xl font-bold text-center mb-8">Clinic Management</h1>
          
          {error && <Alert type="error" message={error} />}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
            
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
          
          <p className="text-center mt-4 text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-500 hover:underline font-semibold">
              Register here
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
