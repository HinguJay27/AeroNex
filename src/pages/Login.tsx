import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import AuthBackground from '../components/AuthBackground';

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
      className="auth-page-content"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated AeroNex background */}
      <AuthBackground />

      {/* Floating AeroNex information */}
      <div
        className="auth-info-card auth-info-aqi"
        style={{
          position: 'absolute',
          left: '7%',
          top: '24%',
          zIndex: 3,
          padding: '12px 18px',
          borderRadius: '14px',
          background: 'rgba(255, 255, 255, 0.72)',
          border: '1px solid rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          boxShadow: '0 10px 30px rgba(13, 71, 161, 0.10)',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            color: '#64748b',
            fontWeight: 700,
            letterSpacing: '1px',
          }}
        >
          AIR QUALITY
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '4px',
          }}
        >
          <strong
            style={{
              fontSize: '24px',
              color: '#0d47a1',
            }}
          >
            AQI
          </strong>

          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: '#22c55e',
              boxShadow: '0 0 10px rgba(34, 197, 94, 0.6)',
            }}
          />
        </div>
      </div>

      <div
        className="auth-info-card auth-info-pm"
        style={{
          position: 'absolute',
          right: '7%',
          top: '22%',
          zIndex: 3,
          padding: '12px 18px',
          borderRadius: '14px',
          background: 'rgba(255, 255, 255, 0.72)',
          border: '1px solid rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          boxShadow: '0 10px 30px rgba(13, 71, 161, 0.10)',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            color: '#64748b',
            fontWeight: 700,
            letterSpacing: '1px',
          }}
        >
          PARTICULATE MATTER
        </div>

        <strong
          style={{
            display: 'block',
            marginTop: '4px',
            fontSize: '22px',
            color: '#334155',
          }}
        >
          PM2.5 - PM10
        </strong>
      </div>

      <div
        className="auth-info-card auth-info-pollution"
        style={{
          position: 'absolute',
          left: '15%',
          bottom: '17%',
          zIndex: 3,
          padding: '11px 17px',
          borderRadius: '14px',
          background: 'rgba(255, 255, 255, 0.68)',
          border: '1px solid rgba(255, 255, 255, 0.82)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          boxShadow: '0 10px 30px rgba(13, 71, 161, 0.08)',
        }}
      >
        <span
          style={{
            fontSize: '13px',
            fontWeight: 700,
            color: '#475569',
            letterSpacing: '0.8px',
          }}
        >
          POLLUTION
        </span>

        <div
          style={{
            marginTop: '4px',
            fontSize: '11px',
            color: '#64748b',
          }}
        >
          Air monitoring
        </div>
      </div>

      <div
        className="auth-info-card auth-info-tree"
        style={{
          position: 'absolute',
          right: '13%',
          bottom: '18%',
          zIndex: 3,
          padding: '11px 17px',
          borderRadius: '14px',
          background: 'rgba(255, 255, 255, 0.68)',
          border: '1px solid rgba(255, 255, 255, 0.82)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          boxShadow: '0 10px 30px rgba(13, 71, 161, 0.08)',
        }}
      >
        <div
          style={{
            fontSize: '22px',
            lineHeight: 1,
          }}
        >
          🌳
        </div>

        <span
          style={{
            display: 'block',
            marginTop: '5px',
            fontSize: '12px',
            fontWeight: 700,
            color: '#166534',
            letterSpacing: '0.8px',
          }}
        >
          SAVE TREE
        </span>
      </div>

      {/* Login Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '430px',
          background: 'rgba(255, 255, 255, 0.94)',
          borderRadius: '20px',
          padding: '40px',
          boxShadow: '0 25px 60px rgba(13, 71, 161, 0.20)',
          border: '1px solid rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          position: 'relative',
          zIndex: 10,
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
                background: 'rgba(255, 255, 255, 0.9)',
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
                background: 'rgba(255, 255, 255, 0.9)',
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
              background: 'rgba(255, 255, 255, 0.9)',
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