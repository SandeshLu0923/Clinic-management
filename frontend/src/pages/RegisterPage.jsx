import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { register } from '../store/slices/authSlice';
import { Button, Input, Card, Alert } from '../components/common/UI';
import { Link, useNavigate } from 'react-router-dom';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    dateOfBirth: '',
    gender: 'other',
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await dispatch(register(formData));
      if (register.fulfilled.match(result)) {
        const { user } = result.payload;
        if (user && user.role) {
          setTimeout(() => navigate(`/${user.role}/dashboard`), 100);
        }
      } else if (register.rejected.match(result)) {
        console.error('Registration failed:', result.payload);
      }
    } catch (err) {
      console.error('Registration error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center py-12">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl">
          <h1 className="text-3xl font-bold text-center mb-8">Create Account</h1>

          {error && <Alert type="error" message={error} />}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              required
            />

            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
            />

            <Input
              label="Phone"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1234567890"
              required
            />

            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="********"
              required
            />

            <Input
              label="Date of Birth"
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Register'}
            </Button>
          </form>

          <p className="text-center mt-4 text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-500 hover:underline font-semibold">
              Login here
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
