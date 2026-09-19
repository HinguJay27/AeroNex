import {
  STATION_COORDS, calculateAQI, getWeatherInfo, type StationReading
} from '@/data/stations';

const AIR_QUALITY_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';
const FORECAST_AQ_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';
const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive';
const ML_BACKEND_URL =  import.meta.env.VITE_ML_BACKEND_URL || 'http://localhost:8000'; // changed

const AQ_PARAMS = 'pm2_5,pm10,nitrogen_dioxide,sulphur_dioxide,carbon_monoxide,ozone';
const WEATHER_PARAMS = 'temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,precipitation,surface_pressure,cloud_cover,weather_code';

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error ${res.status}: ${res.statusText}`);
  return res.json();
}

function processStationData(name: string, lat: number, lon: number, aq: any, weather: any): StationReading {
  const current = aq.current;
  const wCurrent = weather.current;

  const pm25 = current?.pm2_5 ?? 0;
  const pm10 = current?.pm10 ?? 0;
  const no2 = current?.nitrogen_dioxide ?? 0;
  const so2 = current?.sulphur_dioxide ?? 0;
  const co = (current?.carbon_monoxide ?? 0) / 1000;
  const o3 = current?.ozone ?? 0;

  

  const { aqi } = calculateAQI({ pm25, pm10, no2, so2, co, o3 });
  const wInfo = getWeatherInfo(wCurrent?.weather_code ?? 0);

  return {
    name,
    lat,
    lon,
    aqi,
    pm25: Math.round(pm25 * 10) / 10,
    pm10: Math.round(pm10 * 10) / 10,
    no2: Math.round(no2 * 10) / 10,
    so2: Math.round(so2 * 10) / 10,
    o3: Math.round(o3 * 10) / 10,
    co: Math.round(co * 10000) / 10000,
    temperature: Math.round((wCurrent?.temperature_2m ?? 0) * 10) / 10,
    humidity: Math.round(wCurrent?.relative_humidity_2m ?? 0),
    windSpeed: Math.round((wCurrent?.wind_speed_10m ?? 0) * 10) / 10,
    windDir: Math.round(wCurrent?.wind_direction_10m ?? 0),
    precipitation: Math.round((wCurrent?.precipitation ?? 0) * 100) / 100,
    pressure: Math.round((wCurrent?.surface_pressure ?? 0)),
    cloudCover: Math.round(wCurrent?.cloud_cover ?? 0),
    weatherCode: wCurrent?.weather_code ?? 0,
    category: aqi <= 50 ? 'Good' : aqi <= 100 ? 'Satisfactory' : aqi <= 200 ? 'Moderate' : aqi <= 300 ? 'Poor' : aqi <= 400 ? 'Very Poor' : 'Severe',
    updatedAt: current?.time ?? new Date().toISOString(),
  };
}

export async function fetchAllStations(): Promise<StationReading[]> {
  const results = await Promise.all(
    STATION_COORDS.map(async (station) => {
      try {
        const [aq, weather] = await Promise.all([
          fetchJson(`${AIR_QUALITY_URL}?latitude=${station.lat}&longitude=${station.lon}&current=${AQ_PARAMS}&timezone=Asia%2FKolkata`),
          fetchJson(`${WEATHER_URL}?latitude=${station.lat}&longitude=${station.lon}&current=${WEATHER_PARAMS}&timezone=Asia%2FKolkata`),
        ]);
        return processStationData(station.name, station.lat, station.lon, aq, weather);
      } catch {
        return null;
      }
    })
  );
  return results.filter((r): r is StationReading => r !== null);
}

export async function fetchStation(name: string, lat: number, lon: number): Promise<StationReading> {
  const [aq, weather] = await Promise.all([
    fetchJson(`${AIR_QUALITY_URL}?latitude=${lat}&longitude=${lon}&current=${AQ_PARAMS}&timezone=Asia%2FKolkata`),
    fetchJson(`${WEATHER_URL}?latitude=${lat}&longitude=${lon}&current=${WEATHER_PARAMS}&timezone=Asia%2FKolkata`),
  ]);
  return processStationData(name, lat, lon, aq, weather);
}

export interface ForecastPoint {
  time: string;
  hour: string;
  timestamp: number;
  aqi: number;
  predictedAQI: number;
  pm25: number;
  pm10: number;
  no2: number;
  so2: number;
  co: number;
  o3: number;
  temperature: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  category: string;
  confidence: number;
}

export async function fetchForecast(lat: number, lon: number, hours: number): Promise<ForecastPoint[]> {
  // Try ML backend first
  try {
    const res = await fetch(`${ML_BACKEND_URL}/api/forecast?lat=${lat}&lon=${lon}&hours=${hours}`, { signal: AbortSignal.timeout(15000) });
    if (res.ok) {
      const data = await res.json();
      if (data.predictions && data.predictions.length > 0) {
        return data.predictions.map((p: any) => ({
          time: p.time,
          hour: p.hour,
          timestamp: p.timestamp,
          aqi: p.base_aqi,
          predictedAQI: p.predicted_aqi,
          pm25: p.pm25, pm10: p.pm10, no2: p.no2, so2: p.so2, co: p.co, o3: p.o3,
          temperature: p.temperature, humidity: p.humidity,
          windSpeed: p.wind_speed, precipitation: p.precipitation,
          category: p.category, confidence: p.confidence,
        }));
      }
    }
  } catch {
    // ML backend unavailable — fall through to Open-Meteo
  }

  // Fallback: Open-Meteo direct with weather-coupling adjustment
  const [aq, weather] = await Promise.all([
    fetchJson(`${FORECAST_AQ_URL}?latitude=${lat}&longitude=${lon}&hourly=${AQ_PARAMS}&forecast_days=${Math.min(Math.ceil(hours / 24) + 1, 7)}&timezone=Asia%2FKolkata`),
    fetchJson(`${WEATHER_URL}?latitude=${lat}&longitude=${lon}&hourly=${WEATHER_PARAMS}&forecast_days=${Math.min(Math.ceil(hours / 24) + 1, 7)}&timezone=Asia%2FKolkata`),
  ]);

  const aqTimes: string[] = aq.hourly?.time ?? [];
  const now = Date.now();
  const points: ForecastPoint[] = [];
  for (let i = 0; i < aqTimes.length; i++) {
    const ts = new Date(aqTimes[i]).getTime();
    if (ts < now - 3600000) continue;
    const pm25 = aq.hourly.pm2_5?.[i] ?? 0;
    const pm10 = aq.hourly.pm10?.[i] ?? 0;
    const no2 = aq.hourly.nitrogen_dioxide?.[i] ?? 0;
    const so2 = aq.hourly.sulphur_dioxide?.[i] ?? 0;
    const co = (aq.hourly.carbon_monoxide?.[i] ?? 0) / 1000;
    const o3 = aq.hourly.ozone?.[i] ?? 0;
    const { aqi } = calculateAQI({ pm25, pm10, no2, so2, co, o3 });
    const wind = weather.hourly.wind_speed_10m?.[i] ?? 0;
    const hum = weather.hourly.relative_humidity_2m?.[i] ?? 0;
    const precip = weather.hourly.precipitation?.[i] ?? 0;
    const windFactor = wind < 5 ? 1.08 : wind > 15 ? 0.92 : 1.0;
    const humidFactor = hum > 70 ? 1.04 : 1.0;
    const rainFactor = precip > 0.5 ? 0.90 : precip > 0 ? 0.95 : 1.0;
    const predictedAQI = Math.round(aqi * windFactor * humidFactor * rainFactor);
    const hourStr = new Date(aqTimes[i]).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const hoursAhead = Math.round((ts - now) / 3600000);
    const confidence = Math.max(55, Math.round(92 - hoursAhead * 0.5));
    points.push({
      time: aqTimes[i], hour: hourStr, timestamp: ts, aqi, predictedAQI,
      pm25: Math.round(pm25 * 10) / 10, pm10: Math.round(pm10 * 10) / 10,
      no2: Math.round(no2 * 10) / 10, so2: Math.round(so2 * 10) / 10,
      co: Math.round(co * 10000) / 10000, o3: Math.round(o3 * 10) / 10,
      temperature: Math.round((weather.hourly.temperature_2m?.[i] ?? 0) * 10) / 10,
      humidity: Math.round(hum), windSpeed: Math.round(wind * 10) / 10,
      precipitation: Math.round(precip * 100) / 100,
      category: predictedAQI <= 50 ? 'Good' : predictedAQI <= 100 ? 'Satisfactory' : predictedAQI <= 200 ? 'Moderate' : predictedAQI <= 300 ? 'Poor' : predictedAQI <= 400 ? 'Very Poor' : 'Severe',
      confidence,
    });
    if (points.length >= hours) break;
  }
  return points;
}

export async function fetchModelStatus(): Promise<{ loaded: boolean; models?: string[]; trainedAt?: string; samples?: number } | null> {
  try {
    const res = await fetch(`${ML_BACKEND_URL}/api/model-info`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = await res.json();
    return { loaded: data.loaded, models: data.models, trainedAt: data.trained_at, samples: data.n_samples };
  } catch {
    return null;
  }
}

export async function fetchCurrentStation(lat: number, lon: number, name: string): Promise<StationReading | null> {
  try {
    return await fetchStation(name, lat, lon);
  } catch {
    return null;
  }
}

export interface HistoryPoint {
  date: string;
  label: string;
  aqi: number;
  pm25: number;
  pm10: number;
  no2: number;
  so2: number;
  temperature: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
}

export async function fetchHistorical(lat: number, lon: number, range: string): Promise<HistoryPoint[]> {
  const now = new Date();
  const daysMap: Record<string, number> = { '7 Days': 7, '30 Days': 30, '3 Months': 90, '6 Months': 180, '1 Year': 365 };
  const days = daysMap[range] ?? 7;

  // The Air Quality API supports past_days up to 730, so we can use it for all ranges.
  // The forecast weather API only supports past_days up to 92, so for longer ranges
  // we use the Archive API with start_date/end_date for weather data.
  const aqPromise = fetchJson(`${AIR_QUALITY_URL}?latitude=${lat}&longitude=${lon}&hourly=${AQ_PARAMS}&past_days=${Math.min(days, 730)}&timezone=Asia%2FKolkata`);

  let weatherPromise: Promise<any>;
  if (days <= 92) {
    weatherPromise = fetchJson(`${WEATHER_URL}?latitude=${lat}&longitude=${lon}&hourly=${WEATHER_PARAMS}&past_days=${days}&timezone=Asia%2FKolkata`);
  } else {
    const startDate = new Date(now.getTime() - days * 86400000).toISOString().split('T')[0];
    const endDate = now.toISOString().split('T')[0];
    weatherPromise = fetchJson(`${ARCHIVE_URL}?latitude=${lat}&longitude=${lon}&start_date=${startDate}&end_date=${endDate}&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation&timezone=Asia%2FKolkata`);
  }

  const [aq, weather] = await Promise.all([aqPromise, weatherPromise]);

  const aqTimes: string[] = aq.hourly?.time ?? [];
  const wTimes: string[] = weather.hourly?.time ?? [];
  const dailyMap = new Map<string, { pm25s: number[]; pm10s: number[]; no2s: number[]; so2s: number[]; cos: number[]; o3s: number[]; temps: number[]; hums: number[]; winds: number[]; precips: number[] }>();

  for (let i = 0; i < aqTimes.length; i++) {
    const day = aqTimes[i].split('T')[0];
    if (!dailyMap.has(day)) dailyMap.set(day, { pm25s: [], pm10s: [], no2s: [], so2s: [], cos: [], o3s: [], temps: [], hums: [], winds: [], precips: [] });
    const d = dailyMap.get(day)!;
    d.pm25s.push(aq.hourly.pm2_5?.[i] ?? 0);
    d.pm10s.push(aq.hourly.pm10?.[i] ?? 0);
    d.no2s.push(aq.hourly.nitrogen_dioxide?.[i] ?? 0);
    d.so2s.push(aq.hourly.sulphur_dioxide?.[i] ?? 0);
    d.cos.push((aq.hourly.carbon_monoxide?.[i] ?? 0) / 1000);
    d.o3s.push(aq.hourly.ozone?.[i] ?? 0);

    // Match weather by time index
    const wIdx = wTimes.indexOf(aqTimes[i]);
    if (wIdx >= 0) {
      d.temps.push(weather.hourly.temperature_2m?.[wIdx] ?? 0);
      d.hums.push(weather.hourly.relative_humidity_2m?.[wIdx] ?? 0);
      d.winds.push(weather.hourly.wind_speed_10m?.[wIdx] ?? 0);
      d.precips.push(weather.hourly.precipitation?.[wIdx] ?? 0);
    } else {
      d.temps.push(0); d.hums.push(0); d.winds.push(0); d.precips.push(0);
    }
  }

  const allDays = Array.from(dailyMap.entries()).map(([day, d]) => {
    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / (arr.length || 1);
    const pm25 = avg(d.pm25s), pm10 = avg(d.pm10s), no2 = avg(d.no2s), so2 = avg(d.so2s), co = avg(d.cos), o3 = avg(d.o3s);
    const { aqi } = calculateAQI({ pm25, pm10, no2, so2, co, o3 });
    const dt = new Date(day);
    return {
      date: day,
      label: dt.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
      aqi: Math.round(aqi),
      pm25: Math.round(pm25 * 10) / 10,
      pm10: Math.round(pm10 * 10) / 10,
      no2: Math.round(no2 * 10) / 10,
      so2: Math.round(so2 * 10) / 10,
      temperature: Math.round(avg(d.temps) * 10) / 10,
      humidity: Math.round(avg(d.hums)),
      windSpeed: Math.round(avg(d.winds) * 10) / 10,
      precipitation: Math.round(avg(d.precips) * 100) / 100,
    };
  });

  // Downsample for long ranges to keep charts readable
  if (range === '3 Months') return allDays.filter((_, i) => i % 2 === 0);
  if (range === '6 Months') return allDays.filter((_, i) => i % 4 === 0);
  if (range === '1 Year') return allDays.filter((_, i) => i % 7 === 0);
  return allDays;
}

export async function geocodeLocation(query: string): Promise<{ name: string; lat: number; lon: number }[]> {
  const data = await fetchJson(`${GEO_URL}?name=${encodeURIComponent(query)}&count=5&language=en&format=json`);
  if (!data.results) return [];
  return data.results.map((r: any) => ({ name: r.name, lat: r.latitude, lon: r.longitude }));
}
