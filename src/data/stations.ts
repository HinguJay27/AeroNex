export type AQILevel = 'Good' | 'Satisfactory' | 'Moderate' | 'Poor' | 'Very Poor' | 'Severe';

export interface StationReading {
  name: string;
  lat: number;
  lon: number;
  aqi: number;
  pm25: number;
  pm10: number;
  no2: number;
  so2: number;
  o3: number;
  co: number;
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDir: number;
  precipitation: number;
  pressure: number;
  cloudCover: number;
  weatherCode: number;
  category: AQILevel;
  updatedAt: string;
}

export interface StationInfo {
  name: string;
  lat: number;
  lon: number;
}

export const STATION_COORDS: StationInfo[] = [
  { name: 'New Delhi',    lat: 28.6139, lon: 77.2090 },
  { name: 'North Delhi',  lat: 28.7041, lon: 77.1025 },
  { name: 'South Delhi',  lat: 28.5355, lon: 77.2510 },
  { name: 'East Delhi',   lat: 28.6280, lon: 77.2980 },
  { name: 'West Delhi',   lat: 28.6500, lon: 77.1210 },
  { name: 'Noida',        lat: 28.5355, lon: 77.3910 },
  { name: 'Gurugram',     lat: 28.4595, lon: 77.0266 },
  { name: 'Faridabad',    lat: 28.4089, lon: 77.3178 },
  { name: 'Ghaziabad',    lat: 28.6692, lon: 77.4538 },
];

export const aqiLevel = (value: number): AQILevel => {
  if (value <= 50) return 'Good';
  if (value <= 100) return 'Satisfactory';
  if (value <= 200) return 'Moderate';
  if (value <= 300) return 'Poor';
  if (value <= 400) return 'Very Poor';
  return 'Severe';
};

export const levelClass: Record<AQILevel, string> = {
  Good: 'good', Satisfactory: 'satisfactory', Moderate: 'moderate', Poor: 'poor', 'Very Poor': 'very-poor', Severe: 'severe',
};

export const levelColor: Record<AQILevel, string> = {
  Good: '#41a66c', Satisfactory: '#8fc642', Moderate: '#f4c642', Poor: '#f39a35', 'Very Poor': '#e25a4e', Severe: '#9e2b2b',
};

export const levelRange: Array<{ level: AQILevel; range: string; min: number; max: number }> = [
  { level: 'Good',        range: '0–50',    min: 0,   max: 50 },
  { level: 'Satisfactory', range: '51–100', min: 51,  max: 100 },
  { level: 'Moderate',    range: '101–200', min: 101, max: 200 },
  { level: 'Poor',        range: '201–300', min: 201, max: 300 },
  { level: 'Very Poor',   range: '301–400', min: 301, max: 400 },
  { level: 'Severe',      range: '401+',    min: 401, max: 9999 },
];

// CPCB India AQI sub-index breakpoints for PM2.5, PM10, NO2, SO2, CO, O3
const CPCB_BREAKPOINTS: Record<string, Array<[number, number, number, number]>> = {
  pm25: [[0, 30, 0, 50], [31, 60, 51, 100], [61, 90, 101, 200], [91, 120, 201, 300], [121, 250, 301, 400], [251, 500, 401, 500]],
  pm10: [[0, 50, 0, 50], [51, 100, 51, 100], [101, 250, 101, 200], [251, 350, 201, 300], [351, 430, 301, 400], [431, 600, 401, 500]],
  no2:  [[0, 40, 0, 50], [41, 80, 51, 100], [81, 180, 101, 200], [181, 280, 201, 300], [281, 400, 301, 400], [401, 600, 401, 500]],
  so2:  [[0, 40, 0, 50], [41, 80, 51, 100], [81, 380, 101, 200], [381, 800, 201, 300], [801, 1600, 301, 400], [1601, 2400, 401, 500]],
  co:   [[0, 1, 0, 50], [1.1, 2, 51, 100], [2.1, 10, 101, 200], [10.1, 17, 201, 300], [17.1, 34, 301, 400], [34.1, 50, 401, 500]],
  o3:   [[0, 50, 0, 50], [51, 100, 51, 100], [101, 168, 101, 200], [169, 208, 201, 300], [209, 748, 301, 400], [749, 1000, 401, 500]],
};

function subIndex(pollutant: string, concentration: number): number | null {
  const bps = CPCB_BREAKPOINTS[pollutant];
  if (!bps || concentration == null || isNaN(concentration) || concentration < 0) return null;
  for (const [cLow, cHigh, iLow, iHigh] of bps) {
    if (concentration >= cLow && concentration <= cHigh) {
      return Math.round(((iHigh - iLow) / (cHigh - cLow)) * (concentration - cLow) + iLow);
    }
  }
  // Above all breakpoints → max index
  return bps[bps.length - 1][3];
}

// CPCB AQI = max of all available sub-indices, requires at least 3 pollutants
export function calculateAQI(p: { pm25?: number; pm10?: number; no2?: number; so2?: number; co?: number; o3?: number }): { aqi: number; pollutants: Record<string, number | null> } {
  const pollutants: Record<string, number | null> = {};
  const indices: number[] = [];
  for (const key of ['pm25', 'pm10', 'no2', 'so2', 'co', 'o3']) {
    const val = p[key as keyof typeof p];
    const si = subIndex(key, val as number);
    pollutants[key] = si;
    if (si != null) indices.push(si);
  }
  // If we have at least PM2.5 or PM10, compute a best-effort AQI even with fewer than 3
  const aqi = indices.length > 0 ? Math.max(...indices) : 0;
  return { aqi, pollutants };
}

export const WMO_CODES: Record<number, { label: string; icon: string }> = {
  0: { label: 'Clear sky', icon: 'sun' },
  1: { label: 'Mainly clear', icon: 'sun' },
  2: { label: 'Partly cloudy', icon: 'cloud-sun' },
  3: { label: 'Overcast', icon: 'cloud' },
  45: { label: 'Fog', icon: 'fog' },
  48: { label: 'Rime fog', icon: 'fog' },
  51: { label: 'Light drizzle', icon: 'cloud-rain' },
  53: { label: 'Drizzle', icon: 'cloud-rain' },
  55: { label: 'Heavy drizzle', icon: 'cloud-rain' },
  61: { label: 'Light rain', icon: 'cloud-rain' },
  63: { label: 'Rain', icon: 'cloud-rain' },
  65: { label: 'Heavy rain', icon: 'cloud-rain' },
  71: { label: 'Light snow', icon: 'cloud-snow' },
  73: { label: 'Snow', icon: 'cloud-snow' },
  75: { label: 'Heavy snow', icon: 'cloud-snow' },
  80: { label: 'Rain showers', icon: 'cloud-rain' },
  81: { label: 'Heavy showers', icon: 'cloud-rain' },
  82: { label: 'Violent showers', icon: 'cloud-rain' },
  95: { label: 'Thunderstorm', icon: 'cloud-lightning' },
  96: { label: 'Storm with hail', icon: 'cloud-lightning' },
  99: { label: 'Severe hail', icon: 'cloud-lightning' },
};

export function getWeatherInfo(code: number) { return WMO_CODES[code] ?? { label: 'Unknown', icon: 'cloud' }; }

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}
