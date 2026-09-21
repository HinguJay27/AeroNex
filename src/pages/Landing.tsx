import { ArrowRight, Leaf, LogIn, ShieldCheck, Wind } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-brand">
          <div className="landing-brand-mark">
            <Leaf size={24} />
          </div>

          <div>
            <strong>
              Aero<span>Nex</span>
            </strong>
            <small>Air & weather intelligence</small>
          </div>
        </div>

        <div className="landing-nav-actions">
          <button
            className="landing-login-button"
            onClick={() => navigate('/login')}
          >
            <LogIn size={17} />
            Login
          </button>

          <button
            className="landing-register-button"
            onClick={() => navigate('/register')}
          >
            Create Account
            <ArrowRight size={17} />
          </button>
        </div>
      </header>

      <main className="landing-content">
        <section className="landing-hero">
          <div className="landing-hero-text">
            <div className="landing-eyebrow">
              <span className="landing-live-dot" />
              AI-powered air & weather intelligence
            </div>

            <h1>
              Understand the air.
              <br />
              <span>Predict what comes next.</span>
            </h1>

            <p>
              AeroNex combines real-time air quality, weather conditions,
              historical data and AI-powered forecasting to help you
              understand pollution across Delhi NCR.
            </p>

            <div className="landing-actions">
              <button
                className="landing-primary-button"
                onClick={() => navigate('/register')}
              >
                Get Started
                <ArrowRight size={18} />
              </button>

              <button
                className="landing-secondary-button"
                onClick={() => navigate('/login')}
              >
                <LogIn size={18} />
                Sign In
              </button>
            </div>

            <div className="landing-trust">
              <span>
                <ShieldCheck size={17} />
                Secure authentication
              </span>

              <span>
                <Wind size={17} />
                Real-time air quality
              </span>
            </div>
          </div>

          <div className="landing-visual">
            <div className="landing-orbit orbit-one" />
            <div className="landing-orbit orbit-two" />

            <div className="landing-air-card">
              <div className="landing-card-top">
                <span>Delhi NCR</span>
                <span className="landing-live-label">
                  <i />
                  LIVE
                </span>
              </div>

              <div className="landing-aqi">
                <small>Current AQI</small>
                <strong>—</strong>
                <span>Live monitoring</span>
              </div>

              <div className="landing-card-grid">
                <div>
                  <small>PM2.5</small>
                  <b>Live</b>
                </div>

                <div>
                  <small>Weather</small>
                  <b>Live</b>
                </div>

                <div>
                  <small>Forecast</small>
                  <b>72h</b>
                </div>
              </div>
            </div>

            <div className="landing-floating-card floating-one">
              <Leaf size={18} />
              <div>
                <small>Air intelligence</small>
                <b>9 monitoring stations</b>
              </div>
            </div>

            <div className="landing-floating-card floating-two">
              <Wind size={18} />
              <div>
                <small>Forecast horizon</small>
                <b>Next 72 hours</b>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-features">
          <div>
            <span>01</span>
            <h3>Live Monitoring</h3>
            <p>
              Monitor AQI and major pollutants across Delhi NCR monitoring
              stations.
            </p>
          </div>

          <div>
            <span>02</span>
            <h3>AI Forecasting</h3>
            <p>
              Explore air-quality forecasts from the next hour through the
              next 72 hours.
            </p>
          </div>

          <div>
            <span>03</span>
            <h3>Weather Coupling</h3>
            <p>
              Understand how wind, humidity, temperature and rainfall interact
              with pollution.
            </p>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <span>© 2026 AeroNex</span>
        <span>Air Pollution–Weather Coupled Forecasting System</span>
        <span>SIH Prototype · v1.0</span>
      </footer>
    </div>
  );
}
