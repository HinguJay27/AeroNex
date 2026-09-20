import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setErrorMessage('');
    setSuccessMessage('');

    if (!email || !password) {
      setErrorMessage('Please enter your email and password.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setSuccessMessage('Login successful. Redirecting...');

    setTimeout(() => {
      navigate('/dashboard');
    }, 500);
  };
  const handleGoogleLogin = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/dashboard`,
    },
  });

    if (error) {
    setLoading(false);
    setErrorMessage(error.message);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        background: 'linear-gradient(135deg, #eaf4ff 0%, #f7fbff 100%)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '430px',
          background: '#ffffff',
          borderRadius: '20px',
          padding: '40px',
          boxShadow: '0 20px 50px rgba(13, 71, 161, 0.12)',
          border: '1px solid #e5eef8',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1
            style={{
              margin: 0,
              color: '#0d47a1',
              fontSize: '32px',
              fontWeight: 800,
            }}
          >
            AeroNex
          </h1>

          <p
            style={{
              marginTop: '8px',
              color: '#64748b',
              fontSize: '14px',
            }}
          >
            Air Pollution & Weather Forecasting System
          </p>
        </div>

        <h2
          style={{
            marginBottom: '8px',
            color: '#1e293b',
            fontSize: '24px',
          }}
        >
          Welcome Back
        </h2>

        <p
          style={{
            marginBottom: '25px',
            color: '#64748b',
            fontSize: '14px',
          }}
        >
          Login to access your AeroNex dashboard.
        </p>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '18px' }}>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                marginBottom: '7px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#334155',
              }}
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                outline: 'none',
                fontSize: '15px',
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                marginBottom: '7px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#334155',
              }}
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                outline: 'none',
                fontSize: '15px',
              }}
            />
          </div>

          {errorMessage && (
            <div
              style={{
                marginBottom: '16px',
                padding: '12px',
                borderRadius: '10px',
                background: '#fef2f2',
                color: '#b91c1c',
                fontSize: '14px',
              }}
            >
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div
              style={{
                marginBottom: '16px',
                padding: '12px',
                borderRadius: '10px',
                background: '#f0fdf4',
                color: '#15803d',
                fontSize: '14px',
              }}
            >
              {successMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px',
              border: 'none',
              borderRadius: '10px',
              background: loading ? '#93b4df' : '#0d47a1',
              color: '#ffffff',
              fontSize: '16px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
          <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            margin: '20px 0',
          }}
        >
          <div
            style={{
              flex: 1,
              height: '1px',
              background: '#e2e8f0',
            }}
          />

          <span
            style={{
              color: '#94a3b8',
              fontSize: '13px',
            }}
          >
            OR
          </span>

          <div
            style={{
              flex: 1,
              height: '1px',
              background: '#e2e8f0',
            }}
          />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: '100%',
            padding: '13px',
            border: '1px solid #cbd5e1',
            borderRadius: '10px',
            background: '#ffffff',
            color: '#1e293b',
            fontSize: '15px',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          Continue with Google
        </button>


        </form>

        <div
          style={{
            textAlign: 'center',
            marginTop: '24px',
            color: '#64748b',
            fontSize: '14px',
          }}
        >
          Don't have an account?{' '}
          <Link
            to="/register"
            style={{
              color: '#0d47a1',
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}