import { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';


import {
    Activity, AlertTriangle, AlertOctagon,Bell, CalendarDays,ChevronDown,ChevronRight, Cloud,
    CloudRain,CloudSun, Droplets, Gauge, HeartPulse, History, LayoutDashboard, Leaf, Map as         MapIcon, MapPin,Menu, Moon, MoreHorizontal, RefreshCw, Search, Settings as SettingsIcon,        SlidersHorizontal,Sparkles, Sun, Thermometer, Wind, Zap, CloudLightning, CloudSnow,             TrendingUp, TrendingDown,Minus
} from 'lucide-react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis
} from 'recharts';
import {
  aqiLevel, formatTime, formatDate, getWeatherInfo, levelClass, levelColor, levelRange,
  STATION_COORDS, type AQILevel, type StationReading
} from '@/data/stations';
import {
  fetchAllStations, fetchCurrentStation, fetchForecast, fetchHistorical, fetchModelStatus, geocodeLocation,
  type ForecastPoint, type HistoryPoint
} from '@/services/api';
import { useApi, useClock } from '@/hooks/useApi';



const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'AQI Monitor', path: '/aqi', icon: Gauge },
  { label: 'Forecast', path: '/forecast', icon: Activity },
  { label: 'Map View', path: '/map', icon: MapIcon },
  { label: 'Historical Data', path: '/historical', icon: History },
  { label: 'Insights', path: '/insights', icon: Sparkles },
  { label: 'Alerts', path: '/alerts', icon: Bell },
  { label: 'Settings', path: '/settings', icon: SettingsIcon },
];

const HORIZONS = [1, 2, 4, 6, 8, 12, 24, 36, 48, 60, 72];

function weatherIcon(code: number, size = 24) {
  const info = getWeatherInfo(code);
  const map: Record<string, any> = {
    'sun': Sun, 'cloud-sun': CloudSun, 'cloud': Cloud, 'fog': Cloud,
    'cloud-rain': CloudRain, 'cloud-snow': CloudSnow, 'cloud-lightning': CloudLightning,
  };
  const Icon = map[info.icon] ?? Cloud;
  return <Icon size={size} />;
}

const THEME_KEY = 'aeronex-theme';

function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
    }
    return 'light';
  });
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);
  const toggle = () => setTheme(t => t === 'light' ? 'dark' : 'light');
  return { theme, toggle, setTheme };
}

function App() {
  return <BrowserRouter><Shell /></BrowserRouter>;
}

function Shell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const location = useLocation();
  const current = navItems.find((item) => location.pathname.startsWith(item.path))?.label ?? 'Dashboard';
  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} close={() => setSidebarOpen(false)} />
      <div className="main-area">
        <Header title={current} menu={() => setSidebarOpen(true)} theme={theme} toggleTheme={toggle} />
        <main className="content">
          <Routes>
            {/* Public authentication pages */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected AeroNex application */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/aqi" element={<AQIMonitor />} />
              <Route path="/forecast" element={<Forecast />} />
              <Route path="/map" element={<MapView />} />
              <Route path="/historical" element={<HistoricalData />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Routes>
        </main>
      </div>
    </div>
  );
}

function Sidebar({ open, close }: { open: boolean; close: () => void }) {
  return <>
    <div className={`sidebar-backdrop ${open ? 'visible' : ''}`} onClick={close} />
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="brand">
        <div className="brand-mark"><Leaf size={24} /></div>
        <div><strong>Aero<span>Nex</span></strong><small>Air & weather intelligence</small></div>
      </div>
      <div className="sidebar-label">Workspace</div>
      <nav>
        {navItems.map(({ label, path, icon: Icon }) => (
          <NavLink onClick={close} key={path} to={path} className={({ isActive }) => isActive ? 'active' : ''}>
            <Icon size={18} /><span>{label}</span>
            {label === 'Alerts' && <i className="nav-count">!</i>}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="mini-status"><span className="status-dot live" /> Live data connected</div>
        <div className="sidebar-note"><Leaf size={18} /><span>Predicting air.<br /><b>Understanding weather.</b></span></div>
        <div className="sidebar-legal">SIH prototype · v1.0</div>
      </div>
    </aside>
  </>;
}

function Header({ title, menu, theme, toggleTheme }: { title: string; menu: () => void; theme: string; toggleTheme: () => void }) {
  const now = useClock();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  return (
    <header className="topbar">
      <button className="icon-button mobile-menu" onClick={menu} aria-label="Open navigation"><Menu size={21} /></button>
      <div className="crumbs"><span>Workspace</span><ChevronRight size={14} /><b>{title}</b></div>
      <div className="header-actions">
        <button className="location-pill"><MapPin size={15} /> Delhi NCR <ChevronDown size={14} /></button>
        <div className="header-date"><b>{formatDate(now)}</b><span>{formatTime(now)}</span></div>
        <button className="icon-button theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'light' ? <Moon size={19} /> : <Sun size={19} />}
        </button>
        <button className="icon-button" onClick={() => navigate('/alerts')} aria-label="Notifications"><Bell size={19} /><i className="notification-dot" /></button>
        <div className="profile-wrapper">
        <button
          className="avatar"
          onClick={() => setShowProfileMenu((prev) => !prev)}
          title="Profile"
          aria-label="Open profile menu"
        >
          AN
        </button>

        {showProfileMenu && (
          <div className="profile-menu">
            <div className="profile-menu-name">
              AeroNex User
            </div>

            <button
              className="profile-logout"
              onClick={async () => {
                setShowProfileMenu(false);
                await signOut();
                navigate('/login');
              }}>
                
              Logout
            </button>
          </div>
        )}
      </div>
      </div>
    </header>
  );
}

function PageHeader({ eyebrow, title, subtitle, action }: { eyebrow?: string; title: string; subtitle: string; action?: React.ReactNode }) {
  return <div className="page-header"><div><div className="eyebrow">{eyebrow ?? 'AeroNex live platform'}</div><h1>{title}</h1><p>{subtitle}</p></div>{action}</div>;
}

function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return <div className="section-title"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</div>;
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{children}</section>;
}

function AQIBadge({ value, category }: { value: number; category?: AQILevel }) {
  const level = category ?? aqiLevel(value);
  return <span className={`aqi-badge ${levelClass[level]}`}><i />{level}</span>;
}

function MetricCard({ label, value, unit, category, icon: Icon, tone = 'blue', change }: {
  label: string; value: string | number; unit?: string; category: AQILevel; icon: typeof Activity; tone?: string; change?: string;
}) {
  return (
    <div className={`metric-card ${tone}`}>
      <div className="metric-top"><span>{label}</span><div className="metric-icon"><Icon size={16} /></div></div>
      <div className="metric-value">{value}<small>{unit}</small></div>
      <div className="metric-bottom"><AQIBadge value={typeof value === 'number' ? value : 0} category={category} />{change && <span className="change">{change}</span>}</div>
    </div>
  );
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color?: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return <div className="chart-tooltip"><b>{label}</b>{payload.map((entry) => <div key={entry.name}><i style={{ background: entry.color }} />{entry.name}: <strong>{entry.value}</strong></div>)}</div>;
}

function LoadingState({ label = 'Loading live data...' }: { label?: string }) {
  return <div className="loading-state"><div className="spinner" /><span>{label}</span></div>;
}

function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div className="error-state"><AlertTriangle size={28} /><b>Couldn't load data</b><p>{message}</p>{onRetry && <button className="button primary" onClick={onRetry}><RefreshCw size={15} /> Try again</button>}</div>;
}

function LiveBanner({ lastUpdated }: { lastUpdated: Date | null }) {
  return <div className="demo-banner live">
    <span><span className="status-dot live" /> <b>Live data</b> — real air quality & weather readings from Open-Meteo APIs · CPCB India AQI standard</span>
    <span>Updated {lastUpdated ? formatTime(lastUpdated) : '—'}</span>
  </div>;
}

// ============ DASHBOARD ============
function Dashboard() {
  const { data: stations, loading, error, refresh, lastUpdated } = useApi(fetchAllStations, { intervalMs: 600000 });

const eventStation = STATION_COORDS[0];

const { data: eventHistory } = useApi(
  () => fetchHistorical(eventStation.lat, eventStation.lon, '7 Days'),
  { deps: [eventStation.name] }
);

  if (loading && !stations) return <><PageHeader title="AeroNex Dashboard" subtitle="Real-time air quality and weather intelligence across Delhi NCR" /><LoadingState label="Fetching live air quality from all 9 monitoring stations..." /></>;
  if (error && !stations) return <><PageHeader title="AeroNex Dashboard" subtitle="Real-time air quality and weather intelligence across Delhi NCR" /><ErrorState message={error} onRetry={refresh} /></>;

  const readings = stations ?? [];
  const delhiAvg = readings.length > 0
    ? Math.round(readings.reduce((sum, s) => sum + s.aqi, 0) / readings.length)
    : 0;
  const avgPm25 = readings.length > 0 ? Math.round(readings.reduce((s, r) => s + r.pm25, 0) / readings.length * 10) / 10 : 0;
  const avgPm10 = readings.length > 0 ? Math.round(readings.reduce((s, r) => s + r.pm10, 0) / readings.length * 10) / 10 : 0;
  const avgNo2 = readings.length > 0 ? Math.round(readings.reduce((s, r) => s + r.no2, 0) / readings.length * 10) / 10 : 0;
  const avgSo2 = readings.length > 0 ? Math.round(readings.reduce((s, r) => s + r.so2, 0) / readings.length * 10) / 10 : 0;
  const avgCo = readings.length > 0 ? Math.round(readings.reduce((s, r) => s + r.co, 0) / readings.length * 100) / 100 : 0;
  const first = readings[0];
  const wInfo = first ? getWeatherInfo(first.weatherCode) : { label: '—' };

  return <>
    <PageHeader eyebrow={lastUpdated ? `Last updated ${formatTime(lastUpdated)}` : 'AeroNex live platform'} title="AeroNex Dashboard" subtitle="Real-time air quality and weather intelligence across Delhi NCR" action={<button className="button secondary" onClick={refresh}><RefreshCw size={15} /> Refresh data</button>} />
    <LiveBanner lastUpdated={lastUpdated} />
    <div className="metric-grid">
      <MetricCard label="Delhi NCR AQI" value={delhiAvg} category={aqiLevel(delhiAvg)} icon={Gauge} tone={delhiAvg > 300 ? 'red' : delhiAvg > 200 ? 'orange' : 'yellow'} />
      <MetricCard label="PM2.5" value={avgPm25} unit=" µg/m³" category={aqiLevel(avgPm25 * 2)} icon={Activity} tone={avgPm25 > 90 ? 'red' : avgPm25 > 60 ? 'orange' : 'yellow'} />
      <MetricCard label="PM10" value={avgPm10} unit=" µg/m³" category={aqiLevel(avgPm10)} icon={Activity} tone={avgPm10 > 250 ? 'red' : avgPm10 > 100 ? 'orange' : 'yellow'} />
      <MetricCard label="NO₂" value={avgNo2} unit=" µg/m³" category={aqiLevel(avgNo2 * 2.5)} icon={Wind} tone={avgNo2 > 80 ? 'red' : avgNo2 > 40 ? 'yellow' : 'green'} />
      <MetricCard label="SO₂" value={avgSo2} unit=" µg/m³" category={aqiLevel(avgSo2 * 2.5)} icon={Leaf} tone="green" />
      <MetricCard label="CO" value={avgCo} unit=" mg/m³" category={aqiLevel(avgCo * 40)} icon={Activity} tone="green" />
    </div>
    <div className="dashboard-grid">
      <Card className="chart-card span-2">
        <SectionTitle title="Station AQI comparison" subtitle="Live readings across all monitoring stations" action={<span className="chart-legend"><i className="blue-dot" /> AQI value</span>} />
        <ResponsiveContainer width="100%" height={270}>
          <BarChart data={readings.map(s => ({ name: s.name, aqi: s.aqi, category: s.category }))} margin={{ top: 8, right: 12, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--chart-text)' }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--chart-text)' }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <ReferenceLine y={300} stroke="#f39a35" strokeDasharray="4 4" />
            <Bar dataKey="aqi" name="AQI" radius={[5, 5, 0, 0]}>
              {readings.map((s, i) => <Cell key={i} fill={levelColor[s.category]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
      {first && <WeatherCard station={first} />}
      <HealthSafetyAdvisor aqi={delhiAvg} />
    </div>
    <Card>
      <SectionTitle title="All monitoring stations" subtitle="Live readings · tap to see details" action={<NavLink to="/aqi" className="text-button">View all <ChevronRight size={15} /></NavLink>} />
      <div className="station-quick-grid">
        {readings.map((s) => (
          <div key={s.name} className="station-quick">
            <div className="station-quick-top"><span className={`station-dot ${levelClass[s.category]}`} />{s.name}</div>
            <strong style={{ color: levelColor[s.category] }}>{s.aqi}</strong>
            <AQIBadge value={s.aqi} category={s.category} />
          </div>
        ))}
      </div>
    </Card>
  </>;
}

function WeatherCard({ station }: { station: StationReading }) {
  const info = getWeatherInfo(station.weatherCode);
  return (
    <Card className="weather-card">
      <SectionTitle title="Weather conditions" subtitle={station.name} />
      <div className="weather-main">{weatherIcon(station.weatherCode, 46)}<div><strong>{station.temperature}°<small>C</small></strong><span>{info.label}</span></div></div>
      <div className="weather-stats">
        <span><Wind size={15} /><b>{station.windSpeed} km/h</b><small>Wind speed</small></span>
        <span><Droplets size={15} /><b>{station.humidity}%</b><small>Humidity</small></span>
        <span><CloudRain size={15} /><b>{station.precipitation} mm</b><small>Rainfall</small></span>
        <span><Gauge size={15} /><b>{station.pressure} hPa</b><small>Pressure</small></span>
      </div>
    </Card>
  );
}

function HealthSafetyAdvisor({ aqi }: { aqi: number }) {
  const level = aqiLevel(aqi);
  const recommendations = [
    'Avoid prolonged outdoor exercise',
    'Consider using a mask outdoors',
    'Keep windows closed during peak pollution',
    'Sensitive individuals should take extra precautions',
  ];

  return (
    <Card className="advisory health-safety-advisor">
      <div className={`advisory-icon ${levelClass[level]}`} style={{ background: levelColor[level] }}><HeartPulse size={21} /></div>
      <div className="health-safety-content">
        <div className="eyebrow">Health &amp; safety advisor</div>
        <h3>{level} air quality</h3>
        <p>Personalized guidance based on the current AQI of {aqi}.</p>
        <ul className="health-safety-list">
          {recommendations.map((recommendation) => <li key={recommendation}><span><HeartPulse size={13} /></span>{recommendation}</li>)}
        </ul>
      </div>
    </Card>
  );
}

// ============ AQI MONITOR ============
function AQIMonitor() {
  const { data: stations, loading, error, refresh, lastUpdated } = useApi(fetchAllStations, { intervalMs: 600000 });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All categories');
  const [sortBy, setSortBy] = useState('name');

  if (loading && !stations) return <><PageHeader title="AQI Monitor" subtitle="Monitor current air quality across Delhi NCR" /><LoadingState label="Connecting to monitoring stations..." /></>;
  if (error && !stations) return <><PageHeader title="AQI Monitor" subtitle="Monitor current air quality across Delhi NCR" /><ErrorState message={error} onRetry={refresh} /></>;

  const readings = stations ?? [];
  const filtered = readings
    .filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
    .filter((s) => filter === 'All categories' || s.category === filter)
    .sort((a, b) => {
      if (sortBy === 'aqi-desc') return b.aqi - a.aqi;
      if (sortBy === 'aqi-asc') return a.aqi - b.aqi;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

  const distribution = levelRange.map(r => ({ name: r.level === 'Satisfactory' ? 'Sat.' : r.level === 'Very Poor' ? 'V.Poor' : r.level, value: readings.filter(s => s.aqi >= r.min && s.aqi <= r.max).length, level: r.level }));

  return <>
    <PageHeader title="AQI Monitor" subtitle="Monitor current air quality across Delhi NCR" action={<div className="connection"><span className="status-dot live" /> {lastUpdated ? `Updated ${formatTime(lastUpdated)}` : 'Live'}</div>} />
    <div className="toolbar">
      <label className="search"><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search station..." /></label>
      <select value={filter} onChange={(e) => setFilter(e.target.value)}>
        <option>All categories</option><option>Good</option><option>Satisfactory</option><option>Moderate</option><option>Poor</option><option>Very Poor</option><option>Severe</option>
      </select>
      <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
        <option value="name">Sort by name</option><option value="aqi-desc">Highest AQI first</option><option value="aqi-asc">Lowest AQI first</option>
      </select>
      <button className="button secondary" onClick={refresh}><RefreshCw size={15} /> Refresh</button>
    </div>
    <div className="monitor-layout">
      <Card className="station-table-card">
        <SectionTitle title="Monitoring stations" subtitle={`${filtered.length} of ${readings.length} stations shown`} />
        <div className="station-table">
          <div className="table-row table-head"><span>Station</span><span>AQI</span><span>Category</span><span>PM2.5</span><span>PM10</span><span>NO₂</span><span>Temp</span><span>Updated</span></div>
          {filtered.length === 0 ? <div className="empty-row">No stations match your filters.</div> : filtered.map((s) => <StationRow key={s.name} station={s} />)}
        </div>
      </Card>
      <Card className="distribution">
        <SectionTitle title="AQI distribution" subtitle="Stations by severity" />
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={distribution}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--chart-text)' }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--chart-text)' }} axisLine={false} tickLine={false} />
            <Tooltip />
            <Bar dataKey="value" radius={[5, 5, 0, 0]}>
              {distribution.map((d, i) => <Cell key={i} fill={levelColor[d.level as AQILevel]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="distribution-note">
          <b style={{ color: levelColor[readings.length > 0 ? readings.reduce((max, s) => s.aqi > max.aqi ? s : max, readings[0]).category : 'Poor'] }}>{readings.filter(s => s.aqi > 300).length}</b> stations in Very Poor/Severe
        </div>
      </Card>
    </div>
  </>;
}

function StationRow({ station }: { station: StationReading }) {
  return (
    <div className="table-row">
      <span className="station-name"><span className={`station-dot ${levelClass[station.category]}`} />{station.name}</span>
      <strong style={{ color: levelColor[station.category] }}>{station.aqi}</strong>
      <AQIBadge value={station.aqi} category={station.category} />
      <span>{station.pm25} <small>µg/m³</small></span>
      <span>{station.pm10} <small>µg/m³</small></span>
      <span>{station.no2} <small>µg/m³</small></span>
      <span>{station.temperature}°C</span>
      <span className="muted">{formatTime(new Date(station.updatedAt))}</span>
    </div>
  );
}

// ============ FORECAST ============
function Forecast() {
  const [horizon, setHorizon] = useState(24);
  const [selectedStation, setSelectedStation] = useState(0);
  const [mlStatus, setMlStatus] = useState<{ loaded: boolean; models?: string[]; trainedAt?: string; samples?: number } | null>(null);
  const station = STATION_COORDS[selectedStation];
  const { data: forecast, loading, error, refresh } = useApi(
    () => fetchForecast(station.lat, station.lon, horizon),
    { deps: [horizon, selectedStation] }
  );
  const { data: currentStation } = useApi(
    () => fetchCurrentStation(station.lat, station.lon, station.name),
    { deps: [selectedStation] }
  );

  useEffect(() => { fetchModelStatus().then(setMlStatus); }, []);

  const points = forecast ?? [];
  const peak = points.length > 0 ? Math.max(...points.map(p => p.predictedAQI)) : 0;
  const min = points.length > 0 ? Math.min(...points.map(p => p.predictedAQI)) : 0;
  const avgConf = points.length > 0 ? Math.round(points.reduce((s, p) => s + p.confidence, 0) / points.length) : 0;
  const current = points[0];
  const last = points[points.length - 1];

  // Choose display interval based on horizon
  const displayStep = horizon <= 6 ? 1 : horizon <= 12 ? 2 : horizon <= 24 ? 4 : horizon <= 48 ? 8 : 12;
  const timelinePoints = points.filter((_, i) => i % displayStep === 0).slice(0, 8);

  return <>
    <PageHeader title="Air Quality Forecast" subtitle="AI-powered air quality and weather forecasting" action={
      <span className="model-chip">
        <Sparkles size={15} />
        {mlStatus?.loaded ? 'ML Ensemble Active' : 'Live forecast model'}
      </span>
    } />
    <Card className="forecast-controls">
      <div>
        <span className="label">Location</span>
        <select className="select-button" value={selectedStation} onChange={(e) => setSelectedStation(Number(e.target.value))}>
          {STATION_COORDS.map((s, i) => <option key={s.name} value={i}>{s.name}</option>)}
        </select>
      </div>
      <div>
        <span className="label">Parameter</span>
        <select className="select-button"><option>AQI</option><option>PM2.5</option><option>PM10</option><option>NO₂</option></select>
      </div>
      <div className="horizon-wrap">
        <span className="label">Forecast horizon <em>next {horizon} hours</em></span>
        <div className="horizons">
          {HORIZONS.map((h) => <button className={horizon === h ? 'selected' : ''} onClick={() => setHorizon(h)} key={h}>{h}h</button>)}
        </div>
      </div>
    </Card>

    {loading && !forecast ? <Card><LoadingState label={`Generating ${horizon}h forecast for ${station.name}...`} /></Card> :
     error && !forecast ? <Card><ErrorState message={error} onRetry={refresh} /></Card> :
     points.length === 0 ? <Card><ErrorState message="No forecast data available for this location." /></Card> : <>
      <div className="forecast-layout">
        <Card className="chart-card span-2">
          <SectionTitle title={`AQI forecast — next ${horizon} hours`} subtitle={`${station.name} · live model output with weather coupling`} action={<span className="chart-legend"><i className="blue-dot" /> Predicted AQI <i className="gray-dot" /> Base AQI</span>} />
          <ResponsiveContainer width="100%" height={310}>
            <AreaChart data={points} margin={{ top: 10, right: 18, bottom: 0, left: -18 }}>
              <defs><linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1767c5" stopOpacity={0.2} /><stop offset="100%" stopColor="#1767c5" stopOpacity={0.02} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'var(--chart-text)' }} axisLine={false} tickLine={false} interval={Math.max(0, Math.floor(points.length / 8))} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--chart-text)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <ReferenceLine y={300} stroke="#f39a35" strokeDasharray="4 4" label={{ value: 'Very Poor', position: 'insideTopRight', fill: '#b46a1b', fontSize: 10 }} />
              <ReferenceLine y={200} stroke="#f4c642" strokeDasharray="4 4" label={{ value: 'Poor', position: 'insideTopRight', fill: '#b8901a', fontSize: 10 }} />
              <Area type="monotone" dataKey="aqi" name="Base AQI" stroke="#a8b5c5" fill="none" strokeDasharray="4 4" strokeWidth={2} />
              <Area type="monotone" dataKey="predictedAQI" name="Predicted AQI" stroke="#1767c5" fill="url(#forecastFill)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card className="forecast-summary">
          <SectionTitle title="Forecast summary" subtitle={station.name} />
          <div className="summary-list">
            <span>Current AQI <b>{currentStation?.aqi ?? current?.aqi ?? '—'}</b></span>
            <span>Predicted (end) <b className="blue-text">{last?.predictedAQI ?? '—'}</b></span>
            <span>Expected category <AQIBadge value={last?.predictedAQI ?? 0} /></span>
            <span>Peak AQI <b style={{ color: levelColor[aqiLevel(peak)] }}>{peak}</b></span>
            <span>Minimum AQI <b style={{ color: levelColor[aqiLevel(min)] }}>{min}</b></span>
            <span>Confidence <b className="green-text">{avgConf}%</b></span>
          </div>
        </Card>
      </div>
      <div className="forecast-layout lower">
        <Card className="coupling">
          <SectionTitle title="Weather coupling" subtitle="How current weather influences this forecast" />
          <div className="coupling-flow">
            <div><span className="flow-icon blue"><Wind size={19} /></span><b>Wind speed</b><small>{currentStation?.windSpeed ?? current?.windSpeed ?? 0} km/h</small></div>
            <ChevronRight />
            <div><span className="flow-icon orange"><Droplets size={19} /></span><b>Humidity</b><small>{currentStation?.humidity ?? current?.humidity ?? 0}%</small></div>
            <ChevronRight />
            <div><span className="flow-icon red"><Activity size={19} /></span><b>Pollution level</b><small>{aqiLevel(currentStation?.aqi ?? current?.predictedAQI ?? 0)}</small></div>
          </div>
          <p className="disclaimer">Predictions from Ridge Regression + Random Forest ensemble trained on 90 days of historical data across 9 stations. Models use AQI lags, weather coupling, and temporal features.</p>
        </Card>
        <Card className="timeline">
          <SectionTitle title="Forecast timeline" subtitle={`Showing every ${displayStep}h`} />
          {timelinePoints.map((p, i) => (
            <div className="timeline-row" key={i}>
              <span>{p.hour}</span>
              <b style={{ color: levelColor[aqiLevel(p.predictedAQI)] }}>{p.predictedAQI}</b>
              <AQIBadge value={p.predictedAQI} />
            </div>
          ))}
        </Card>
      </div>
      <Card className="pollutant-card">
        <SectionTitle title="Current pollutant levels" subtitle="Real-time readings from monitoring station" />
        <div className="pollutant-grid">
          {[
            { name: 'PM2.5', value: currentStation?.pm25 ?? current?.pm25 ?? 0, unit: ' µg/m³', color: '#1767c5', max: 250 },
            { name: 'PM10', value: currentStation?.pm10 ?? current?.pm10 ?? 0, unit: ' µg/m³', color: '#ed8a2f', max: 430 },
            { name: 'NO₂', value: currentStation?.no2 ?? current?.no2 ?? 0, unit: ' µg/m³', color: '#41a66c', max: 400 },
            { name: 'SO₂', value: currentStation?.so2 ?? current?.so2 ?? 0, unit: ' µg/m³', color: '#8f70c8', max: 1600 },
            { name: 'CO', value: currentStation?.co ?? current?.co ?? 0, unit: ' mg/m³', color: '#5b7898', max: 50 },
          ].map((p) => (
            <div className="pollutant-item" key={p.name}>
              <div><span style={{ background: p.color }} />{p.name}</div>
              <b>{p.value}<small>{p.unit}</small></b>
              <div className="bar"><i style={{ width: `${Math.min((p.value / p.max) * 100, 100)}%`, background: p.color }} /></div>
            </div>
          ))}
        </div>
      </Card>
    </>}
  </>;
}

// ============ MAP VIEW ============
function MapView() {
  const { data: stations, loading, error, refresh } = useApi(fetchAllStations, { intervalMs: 600000 });
  const [selected, setSelected] = useState(0);
  const [viewMode, setViewMode] = useState('air');

  if (loading && !stations) return <><PageHeader title="Delhi NCR Air Quality Map" subtitle="Real-time spatial air quality monitoring" /><LoadingState label="Loading station data..." /></>;
  if (error && !stations) return <><PageHeader title="Delhi NCR Air Quality Map" subtitle="Real-time spatial air quality monitoring" /><ErrorState message={error} onRetry={refresh} /></>;

  const readings = stations ?? [];
  const selectedStation = readings[selected] ?? readings[0];

  return <>
    <PageHeader title="Delhi NCR Air Quality Map" subtitle="Real-time spatial air quality monitoring" action={
      <div className="map-toggle">
        <button className={viewMode === 'air' ? 'selected' : ''} onClick={() => setViewMode('air')}>Air quality</button>
        <button className={viewMode === 'weather' ? 'selected' : ''} onClick={() => setViewMode('weather')}>Weather</button>
      </div>
    } />
    <div className="map-layout">
      <Card className="large-map-card">
        <div className="map-toolbar">
          <span><MapIcon size={16} /> Delhi NCR monitoring grid</span>
          <span className="map-live"><i className="status-dot live" /> Live data</span>
        </div>
        <div className="fake-map large-map">
          {readings.map((station, index) => (
            <button
              onClick={() => setSelected(index)}
              key={station.name}
              className={`map-pin pin-${index} ${levelClass[station.category]} ${selected === index ? 'selected-pin' : ''}`}
            >
              <span>{viewMode === 'air' ? station.aqi : `${station.temperature}°`}</span>
              <small>{station.name}</small>
            </button>
          ))}
          <div className="map-label delhi">Delhi NCR</div>
          <div className="map-label noida-label">Noida</div>
          <div className="map-label gurugram-label">Gurugram</div>
          <div className="map-road road-one" /><div className="map-road road-two" />
          <div className="map-road road-three" /><div className="map-road road-four" />
        </div>
        <div className="map-legend">
          <b>AQI severity</b>
          {levelRange.map(r => <span key={r.level}><i className={`legend-dot ${levelClass[r.level]}`} />{r.level}<small>{r.range}</small></span>)}
        </div>
      </Card>
      {selectedStation && <StationDetails station={selectedStation} />}
    </div>
  </>;
}

function StationDetails({ station }: { station: StationReading }) {
  const info = getWeatherInfo(station.weatherCode);
  return (
    <Card className="station-details">
      <SectionTitle title="Station details" subtitle="Selected monitoring station" />
      <div className="detail-heading">
        <div><b>{station.name}</b><span>Updated {formatTime(new Date(station.updatedAt))}</span></div>
        <AQIBadge value={station.aqi} category={station.category} />
      </div>
      <div className="detail-aqi" style={{ background: `linear-gradient(135deg, ${levelColor[station.category]}22, ${levelColor[station.category]}33)` }}>
        <span>AQI</span>
        <strong style={{ color: levelColor[station.category] }}>{station.aqi}</strong>
        <small style={{ color: levelColor[station.category] }}>{station.category}</small>
      </div>
      <div className="detail-list">
        <span>PM2.5 <b>{station.pm25} µg/m³</b></span>
        <span>PM10 <b>{station.pm10} µg/m³</b></span>
        <span>NO₂ <b>{station.no2} µg/m³</b></span>
        <span>SO₂ <b>{station.so2} µg/m³</b></span>
        <span>O₃ <b>{station.o3} µg/m³</b></span>
        <span>CO <b>{station.co} mg/m³</b></span>
      </div>
      <div className="detail-weather">
        <b>Weather</b>
        <div>{weatherIcon(station.weatherCode, 26)}<strong>{station.temperature}°C</strong><span>{info.label}</span></div>
        <p><Wind size={14} /> {station.windSpeed} km/h &nbsp; <Droplets size={14} /> {station.humidity}% &nbsp; <CloudRain size={14} /> {station.precipitation}mm</p>
      </div>
    </Card>
  );
}

// ============ HISTORICAL DATA ============
function HistoricalData() {
  const [range, setRange] = useState('7 Days');
  const [stationIdx, setStationIdx] = useState(0);
  const station = STATION_COORDS[stationIdx];
  const { data: history, loading, error, refresh } = useApi(
    () => fetchHistorical(station.lat, station.lon, range),
    { deps: [range, stationIdx] }
  );

  const points = history ?? [];
  const avg = (arr: number[], round = 1) => arr.length > 0 ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(round) : '—';
  const pm25s = points.map(p => p.pm25);
  const pm10s = points.map(p => p.pm10);
  const no2s = points.map(p => p.no2);
  const so2s = points.map(p => p.so2);
  const aqis = points.map(p => p.aqi);

  const summaryData = [
    { name: 'AQI', avg: avg(aqis, 0), max: aqis.length > 0 ? Math.max(...aqis) : '—', min: aqis.length > 0 ? Math.min(...aqis) : '—', trend: aqis.length > 2 && aqis[aqis.length - 1] > aqis[0] ? 'Rising' : aqis.length > 2 && aqis[aqis.length - 1] < aqis[0] ? 'Falling' : 'Stable' },
    { name: 'PM2.5', avg: avg(pm25s), max: pm25s.length > 0 ? Math.max(...pm25s).toFixed(1) : '—', min: pm25s.length > 0 ? Math.min(...pm25s).toFixed(1) : '—', trend: pm25s.length > 2 && pm25s[pm25s.length - 1] > pm25s[0] ? 'Rising' : 'Stable' },
    { name: 'PM10', avg: avg(pm10s), max: pm10s.length > 0 ? Math.max(...pm10s).toFixed(1) : '—', min: pm10s.length > 0 ? Math.min(...pm10s).toFixed(1) : '—', trend: 'Stable' },
    { name: 'NO₂', avg: avg(no2s), max: no2s.length > 0 ? Math.max(...no2s).toFixed(1) : '—', min: no2s.length > 0 ? Math.min(...no2s).toFixed(1) : '—', trend: 'Stable' },
  ];

  return <>
    <PageHeader title="Historical Data" subtitle="Analyze past pollution and weather patterns" action={<button className="button secondary" onClick={refresh}><RefreshCw size={15} /> Refresh</button>} />
    <div className="toolbar filters">
      <label><span>Location</span>
        <select value={stationIdx} onChange={(e) => setStationIdx(Number(e.target.value))}>
          {STATION_COORDS.map((s, i) => <option key={s.name} value={i}>{s.name}</option>)}
        </select>
      </label>
      <label><span>Time range</span>
        <select value={range} onChange={(e) => setRange(e.target.value)}>
          {['7 Days', '30 Days', '3 Months', '6 Months', '1 Year'].map(r => <option key={r}>{r}</option>)}
        </select>
      </label>
      <button className="button primary" onClick={refresh}>Apply filters</button>
    </div>

    {loading && !history ? <Card><LoadingState label={`Fetching historical data for ${station.name}...`} /></Card> :
     error && !history ? <Card><ErrorState message={error} onRetry={refresh} /></Card> :
     points.length === 0 ? <Card><ErrorState message="No historical data available." /></Card> : <>
      <div className="history-grid">
        <Card className="chart-card span-2">
          <SectionTitle title="AQI trend" subtitle={`${range} · ${station.name}`} />
          <ResponsiveContainer width="100%" height={270}>
            <AreaChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: -20 }}>
              <defs><linearGradient id="histAqi" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2676df" stopOpacity={0.22} /><stop offset="100%" stopColor="#2676df" stopOpacity={0.01} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--chart-text)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--chart-text)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="aqi" name="AQI" stroke="#1767c5" fill="url(#histAqi)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card className="chart-card">
          <SectionTitle title="Pollutant trend" subtitle="µg/m³" />
          <ResponsiveContainer width="100%" height={205}>
            <LineChart data={points}><CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="label" hide /><YAxis tick={{ fontSize: 10, fill: 'var(--chart-text)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} /><Legend wrapperStyle={{ fontSize: 10 }} />
              <Line dataKey="pm25" name="PM2.5" stroke="#1767c5" dot={false} strokeWidth={2} />
              <Line dataKey="pm10" name="PM10" stroke="#ed8a2f" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card className="chart-card">
          <SectionTitle title="Weather trend" subtitle={`${range}`} />
          <ResponsiveContainer width="100%" height={205}>
            <LineChart data={points}><CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="label" hide /><YAxis tick={{ fontSize: 10, fill: 'var(--chart-text)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} /><Legend wrapperStyle={{ fontSize: 10 }} />
              <Line dataKey="temperature" name="Temp (°C)" stroke="#ed8a2f" dot={false} strokeWidth={2} />
              <Line dataKey="humidity" name="Humidity (%)" stroke="#41a66c" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <Card className="data-table-card">
        <SectionTitle title="Pollutant summary" subtitle={`${range} · ${station.name}`} />
        <div className="summary-table">
          <div className="table-row table-head"><span>Pollutant</span><span>Average</span><span>Maximum</span><span>Minimum</span><span>Trend</span></div>
          {summaryData.map((row) => (
            <div className="table-row" key={row.name}>
              <span><b>{row.name}</b></span>
              <span>{row.avg}</span><span>{row.max}</span><span>{row.min}</span>
              <span className={row.trend === 'Rising' ? 'trend-up' : row.trend === 'Falling' ? 'trend-down' : 'trend-stable'}>
                {row.trend === 'Rising' ? <><TrendingUp size={14} /> Rising</> : row.trend === 'Falling' ? <><TrendingDown size={14} /> Falling</> : <><Minus size={14} /> Stable</>}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </>}
  </>;
}

// ============ INSIGHTS ============
function Insights() {
  const { data: stations, loading, error } = useApi(fetchAllStations, { intervalMs: 600000 });
  const readings = stations ?? [];

  const hottest = readings.length > 0 ? readings.reduce((max, s) => s.temperature > max.temperature ? s : max, readings[0]) : null;
  const mostPolluted = readings.length > 0 ? readings.reduce((max, s) => s.aqi > max.aqi ? s : max, readings[0]) : null;
  const leastPolluted = readings.length > 0 ? readings.reduce((min, s) => s.aqi < min.aqi ? s : min, readings[0]) : null;
  const avgWind = readings.length > 0 ? readings.reduce((s, r) => s + r.windSpeed, 0) / readings.length : 0;
  const avgHum = readings.length > 0 ? readings.reduce((s, r) => s + r.humidity, 0) / readings.length : 0;
  const avgAqi = readings.length > 0 ? Math.round(readings.reduce((s, r) => s + r.aqi, 0) / readings.length) : 0;

  const insightCards = [
    { title: 'Weather impact', text: avgWind < 5 ? `Low wind speed (${avgWind.toFixed(1)} km/h) may reduce pollution dispersion, leading to accumulation.` : `Wind speed at ${avgWind.toFixed(1)} km/h is helping disperse pollutants moderately.`, icon: Wind, color: 'blue' },
    { title: 'Pollution trend', text: mostPolluted ? `Highest AQI recorded at ${mostPolluted.name} (${mostPolluted.aqi}). ${leastPolluted ? `Cleanest air at ${leastPolluted.name} (${leastPolluted.aqi}).` : ''}` : 'Loading...', icon: TrendingUp, color: 'orange' },
    { title: 'Pollution hotspot', text: mostPolluted ? `${mostPolluted.name} is currently the most polluted station with AQI ${mostPolluted.aqi} (${mostPolluted.category}).` : 'Loading...', icon: MapPin, color: 'red' },
    { title: 'Humidity effect', text: avgHum > 70 ? `High humidity (${Math.round(avgHum)}%) can increase particulate matter by enabling secondary aerosol formation.` : `Humidity at ${Math.round(avgHum)}% is within normal range.`, icon: Droplets, color: 'green' },
  ];

  // Build scatter data: wind vs AQI
  const scatterData = readings.map(s => ({ x: s.windSpeed, y: s.aqi, name: s.name }));

  return <>
    <PageHeader title="Smart Insights" subtitle="Understand air pollution and weather relationships" action={<span className="model-chip"><Sparkles size={15} /> Live analysis</span>} />
    {loading && !stations ? <LoadingState /> : error && !stations ? <ErrorState message={error} /> : <>
      <div className="insight-grid">
        {insightCards.map((item) => (
          <Card className="insight-card" key={item.title}>
            <div className={`insight-symbol ${item.color}`}><item.icon size={19} /></div>
            <div><span className="eyebrow">{item.title}</span><p>{item.text}</p></div>
          </Card>
        ))}
      </div>
      <Card className="correlation-card">
        <SectionTitle title="Wind speed vs AQI" subtitle="Lower wind speeds tend to correlate with higher pollution" />
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart margin={{ top: 20, right: 30, bottom: 10, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis type="number" dataKey="x" name="Wind speed" unit=" km/h" tick={{ fontSize: 11, fill: 'var(--chart-text)' }} axisLine={false} tickLine={false} />
            <YAxis type="number" dataKey="y" name="AQI" tick={{ fontSize: 11, fill: 'var(--chart-text)' }} axisLine={false} tickLine={false} />
            <ZAxis range={[120, 120]} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<ChartTooltip />} />
            <Scatter data={scatterData} fill="#1767c5">
              {scatterData.map((d, i) => <Cell key={i} fill={levelColor[aqiLevel(d.y)]} />)}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </Card>
      <Card>
        <SectionTitle title="Temperature vs PM2.5" subtitle="Exploring the relationship across stations" />
        <ResponsiveContainer width="100%" height={280}>
          <ScatterChart margin={{ top: 20, right: 30, bottom: 10, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis type="number" dataKey="x" name="Temperature" unit="°C" tick={{ fontSize: 11, fill: 'var(--chart-text)' }} axisLine={false} tickLine={false} />
            <YAxis type="number" dataKey="y" name="PM2.5" unit=" µg/m³" tick={{ fontSize: 11, fill: 'var(--chart-text)' }} axisLine={false} tickLine={false} />
            <ZAxis range={[120, 120]} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<ChartTooltip />} />
            <Scatter data={readings.map(s => ({ x: s.temperature, y: s.pm25, name: s.name }))} fill="#ed8a2f" />
          </ScatterChart>
        </ResponsiveContainer>
      </Card>
      <div className="activity-window">
        <div>
          <div className="eyebrow">Outdoor activity window</div>
          <h2>{avgAqi <= 100 ? 'Conditions are suitable for outdoor activities' : avgAqi <= 200 ? 'Sensitive groups should take precautions' : 'Limit prolonged outdoor activity'}</h2>
          <p>Based on current live readings across Delhi NCR. Average AQI is {avgAqi} ({aqiLevel(avgAqi)}).</p>
        </div>
        <div className="window-time">
          {avgAqi <= 200 ? <Sun size={24} /> : <Moon size={24} />}
          <b>{avgAqi <= 200 ? 'Safe to go out' : 'Stay indoors'}</b>
          <span>Live recommendation</span>
        </div>
      </div>
    </>}
  </>;
}

// ============ ALERTS ============
interface AlertItem {
  id: string; title: string; location: string; time: string; description: string;
  severity: 'critical' | 'warning' | 'info'; read: boolean; category: string;
}

function Alerts() {
  const { data: stations, loading, error } = useApi(fetchAllStations, { intervalMs: 600000 });
  const readings = stations ?? [];
  const [filter, setFilter] = useState('all');

  // Generate real alerts from live data
  const generatedAlerts: AlertItem[] = useMemo(() => {
    const alerts: AlertItem[] = [];
    readings.forEach((s) => {
      if (s.aqi > 300) {
        alerts.push({ id: `aqi-${s.name}`, title: 'High Pollution Alert', location: s.name, time: 'Just now', description: `AQI is ${s.aqi} (${s.category}). Avoid prolonged outdoor activity.`, severity: 'critical', read: false, category: 'High Pollution' });
      } else if (s.aqi > 200) {
        alerts.push({ id: `poor-${s.name}`, title: 'Poor Air Quality', location: s.name, time: 'Just now', description: `AQI is ${s.aqi} (${s.category}). Sensitive groups should limit outdoor exertion.`, severity: 'warning', read: false, category: 'Poor Air Quality' });
      }
      if (s.windSpeed < 5) {
        alerts.push({ id: `wind-${s.name}`, title: 'Low Wind Speed', location: s.name, time: 'Just now', description: `Wind speed is only ${s.windSpeed} km/h, which may worsen air quality due to reduced dispersion.`, severity: 'info', read: false, category: 'Weather' });
      }
      if (s.precipitation > 0) {
        alerts.push({ id: `rain-${s.name}`, title: 'Rainfall Detected', location: s.name, time: 'Just now', description: `${s.precipitation}mm rainfall detected, which may temporarily improve air quality.`, severity: 'info', read: true, category: 'Rainfall' });
      }
      if (s.humidity > 80) {
        alerts.push({ id: `hum-${s.name}`, title: 'High Humidity', location: s.name, time: 'Just now', description: `Humidity at ${s.humidity}% can contribute to secondary particulate formation.`, severity: 'warning', read: true, category: 'Weather' });
      }
    });
    return alerts;
  }, [readings]);

  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  useEffect(() => { if (generatedAlerts.length > 0) setAlerts(generatedAlerts); }, [generatedAlerts]);

  const filtered = filter === 'all' ? alerts : filter === 'unread' ? alerts.filter(a => !a.read) : alerts.filter(a => a.severity === filter);
  const unread = alerts.filter(a => !a.read).length;

  const markRead = (id: string) => setAlerts(curr => curr.map(a => a.id === id ? { ...a, read: true } : a));
  const dismiss = (id: string) => setAlerts(curr => curr.filter(a => a.id !== id));
  const markAllRead = () => setAlerts(curr => curr.map(a => ({ ...a, read: true })));

  return <>
    <PageHeader title="Alerts & Notifications" subtitle="Stay informed about important air quality and weather conditions" action={<button className="button secondary" onClick={markAllRead}><SettingsIcon size={15} /> Mark all read</button>} />
    {loading && !stations ? <LoadingState /> : error && !stations ? <ErrorState message={error} /> : (
      <div className="alert-layout">
        <Card className="alerts-card">
          <SectionTitle title="Active alerts" subtitle={`${unread} unread · ${alerts.length} total`} action={
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All alerts</option><option value="unread">Unread</option><option value="critical">Critical</option><option value="warning">Warning</option><option value="info">Info</option>
            </select>
          } />
          {filtered.length === 0 ? <div className="empty-row">No alerts in this category. Air quality is being monitored.</div> :
            filtered.map((item) => (
              <div className={`alert-item ${item.read ? 'read' : ''}`} key={item.id}>
                <div className={`alert-icon ${item.severity}`}><AlertTriangle size={17} /></div>
                <div className="alert-content">
                  <div><b>{item.title}</b><span>{item.time}</span></div>
                  <small>{item.location}</small>
                  <p>{item.description}</p>
                  <div className="alert-actions">
                    <button onClick={() => markRead(item.id)}>{item.read ? '✓ Read' : 'Mark as read'}</button>
                    <button onClick={() => dismiss(item.id)}>Dismiss</button>
                  </div>
                </div>
              </div>
            ))
          }
        </Card>
        <Card className="quick-actions">
          <SectionTitle title="Quick actions" subtitle="Jump to a workspace" />
          {[
            { label: 'View forecast', path: '/forecast', icon: Activity },
            { label: 'Check map', path: '/map', icon: MapIcon },
            { label: 'Historical data', path: '/historical', icon: History },
            { label: 'Alert settings', path: '/settings', icon: SettingsIcon },
          ].map(({ label, path, icon: Icon }) => (
            <NavLink to={path} key={label}><span><Icon size={17} /></span>{label}<ChevronRight size={15} /></NavLink>
          ))}
        </Card>
      </div>
    )}
  </>;
}

// ============ SETTINGS ============
function Settings() {
  const [refreshInterval, setRefreshInterval] = useState('600');
  const [tempUnit, setTempUnit] = useState('C');
  const [alertsOn, setAlertsOn] = useState(true);
  const [forecastAlerts, setForecastAlerts] = useState(true);
  const [weatherAlerts, setWeatherAlerts] = useState(false);
  const { theme, setTheme } = useTheme();

  return <>
    <PageHeader title="Settings" subtitle="Configure your AeroNex workspace" />
    <div className="settings-grid">
      <Card>
        <SectionTitle title="Location" subtitle="Choose the default monitoring context" />
        <SettingRow label="Default location" description="Used across your dashboard" control={<select><option>Delhi NCR</option><option>New Delhi</option><option>North Delhi</option></select>} />
        <SettingRow label="Monitoring station" description="The station shown in detail views" control={<select>{STATION_COORDS.map(s => <option key={s.name}>{s.name}</option>)}</select>} />
      </Card>
      <Card>
        <SectionTitle title="Alert preferences" subtitle="Choose what should reach you" />
        <SettingRow label="AQI alerts" description="Notify when pollution crosses a threshold" control={<Toggle active={alertsOn} onClick={() => setAlertsOn(!alertsOn)} />} />
        <SettingRow label="Forecast alerts" description="Notify about predicted AQI changes" control={<Toggle active={forecastAlerts} onClick={() => setForecastAlerts(!forecastAlerts)} />} />
        <SettingRow label="Weather alerts" description="Notify about weather shifts" control={<Toggle active={weatherAlerts} onClick={() => setWeatherAlerts(!weatherAlerts)} />} />
      </Card>
      <Card>
        <SectionTitle title="Display" subtitle="Make AeroNex feel like yours" />
        <SettingRow label="Theme" description="Switch between light and dark mode" control={
          <div className="theme-options">
            <button className={theme === 'light' ? 'selected' : ''} onClick={() => setTheme('light')}><Sun size={15} /> Light</button>
            <button className={theme === 'dark' ? 'selected' : ''} onClick={() => setTheme('dark')}><Moon size={15} /> Dark</button>
          </div>
        } />
        <SettingRow label="Temperature unit" description="Used in weather cards" control={<select value={tempUnit} onChange={(e) => setTempUnit(e.target.value)}><option value="C">Celsius (°C)</option><option value="F">Fahrenheit (°F)</option></select>} />
        <SettingRow label="Map default view" description="Which layer to show first" control={<select><option>Air quality</option><option>Weather</option></select>} />
      </Card>
      <Card>
        <SectionTitle title="Data" subtitle="Refresh and transparency" />
        <SettingRow label="Refresh interval" description="How often the app checks for updates" control={<select value={refreshInterval} onChange={(e) => setRefreshInterval(e.target.value)}><option value="300">Every 5 minutes</option><option value="600">Every 10 minutes</option><option value="1800">Every 30 minutes</option></select>} />
        <div className="about-box">
          <Leaf size={22} />
          <div><b>AeroNex</b><span>Air Pollution–Weather Coupled Forecasting System</span><small>Prototype v1.0 · Live data from Open-Meteo APIs · CPCB India AQI standard</small></div>
        </div>
      </Card>
    </div>
  </>;
}

function SettingRow({ label, description, control }: { label: string; description: string; control: React.ReactNode }) {
  return <div className="setting-row"><div><b>{label}</b><span>{description}</span></div>{control}</div>;
}

function Toggle({ active = false, onClick }: { active?: boolean; onClick?: () => void }) {
  return <button onClick={onClick} className={`toggle ${active ? 'active' : ''}`} aria-label="Toggle setting"><i /></button>;
}

export default App;