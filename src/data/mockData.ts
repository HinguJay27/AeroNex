export type AQILevel = 'Good' | 'Satisfactory' | 'Moderate' | 'Poor' | 'Very Poor' | 'Severe';

export type Station = {
  name: string;
  aqi: number;
  pm25: number;
  pm10: number;
  no2: number;
  temperature: number;
  category: AQILevel;
};

export const aqiLevel = (value: number): AQILevel => {
  if (value <= 50) return 'Good';
  if (value <= 100) return 'Satisfactory';
  if (value <= 200) return 'Moderate';
  if (value <= 300) return 'Poor';
  if (value <= 400) return 'Very Poor';
  return 'Severe';
};

export const stations: Station[] = [
  { name: 'New Delhi', aqi: 320, pm25: 178, pm10: 268, no2: 62, temperature: 19, category: 'Very Poor' },
  { name: 'North Delhi', aqi: 342, pm25: 192, pm10: 284, no2: 70, temperature: 18, category: 'Very Poor' },
  { name: 'South Delhi', aqi: 241, pm25: 130, pm10: 210, no2: 48, temperature: 20, category: 'Poor' },
  { name: 'East Delhi', aqi: 265, pm25: 147, pm10: 226, no2: 54, temperature: 19, category: 'Poor' },
  { name: 'West Delhi', aqi: 278, pm25: 155, pm10: 239, no2: 58, temperature: 19, category: 'Poor' },
  { name: 'Noida', aqi: 290, pm25: 162, pm10: 244, no2: 60, temperature: 18, category: 'Poor' },
  { name: 'Gurugram', aqi: 260, pm25: 141, pm10: 224, no2: 51, temperature: 20, category: 'Poor' },
  { name: 'Faridabad', aqi: 275, pm25: 151, pm10: 238, no2: 56, temperature: 19, category: 'Poor' },
  { name: 'Ghaziabad', aqi: 304, pm25: 171, pm10: 259, no2: 65, temperature: 18, category: 'Very Poor' },
];

export const trendData = [
  { time: '4 PM', aqi: 318, pm25: 165, pm10: 241, no2: 58, so2: 12, temp: 19 },
  { time: '7 PM', aqi: 307, pm25: 158, pm10: 236, no2: 57, so2: 13, temp: 18 },
  { time: '10 PM', aqi: 328, pm25: 171, pm10: 249, no2: 60, so2: 13, temp: 17 },
  { time: '1 AM', aqi: 344, pm25: 185, pm10: 265, no2: 64, so2: 14, temp: 17 },
  { time: '4 AM', aqi: 352, pm25: 190, pm10: 274, no2: 66, so2: 15, temp: 16 },
  { time: '7 AM', aqi: 335, pm25: 178, pm10: 258, no2: 62, so2: 14, temp: 17 },
  { time: '10 AM', aqi: 301, pm25: 162, pm10: 232, no2: 56, so2: 12, temp: 19 },
  { time: '1 PM', aqi: 294, pm25: 158, pm10: 225, no2: 54, so2: 11, temp: 21 },
  { time: '4 PM', aqi: 320, pm25: 178, pm10: 268, no2: 62, so2: 12, temp: 19 },
];

export const alerts = [
  { title: 'High Pollution Alert', location: 'Delhi NCR', time: '2 hours ago', description: 'AQI is expected to remain in the Very Poor category for the next 12 hours.', severity: 'critical', read: false },
  { title: 'Poor Air Quality', location: 'Gurugram', time: '4 hours ago', description: 'PM2.5 levels are 3.2x higher than safe limits.', severity: 'warning', read: false },
  { title: 'AQI Increase Forecast', location: 'North Delhi', time: '6 hours ago', description: 'The model estimates elevated AQI overnight.', severity: 'warning', read: true },
  { title: 'Rainfall Likely', location: 'Delhi NCR', time: '8 hours ago', description: 'Light rainfall is possible in the next 24 hours.', severity: 'info', read: true },
];

export const insights = [
  { title: 'Weather impact', text: 'Model data indicates changes in wind speed and humidity are associated with changes in pollution levels.', icon: 'wind', color: 'blue' },
  { title: 'Pollution trend', text: 'PM2.5 levels have increased during the selected period compared with last week.', icon: 'trend', color: 'orange' },
  { title: 'Pollution hotspot', text: 'Selected monitoring stations show comparatively higher AQI values in North Delhi.', icon: 'pin', color: 'red' },
  { title: 'Forecast insight', text: 'The forecasting model estimates elevated AQI during the selected period.', icon: 'spark', color: 'green' },
];

export const forecastFor = (horizon: number) => {
  const scale = Math.min(horizon / 24, 3);
  return trendData.map((point, index) => ({ ...point, predicted: Math.round(point.aqi + (index - 3) * 3 + scale * 4), confidence: Math.round(15 + scale * 4) }));
};
