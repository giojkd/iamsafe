export type CityCoordinates = {
  name: string;
  lat: number;
  lng: number;
  region: string;
};

export const ITALIAN_CITIES: CityCoordinates[] = [
  { name: 'Milano', lat: 45.4642, lng: 9.1900, region: 'Lombardia' },
  { name: 'Roma', lat: 41.9028, lng: 12.4964, region: 'Lazio' },
  { name: 'Napoli', lat: 40.8518, lng: 14.2681, region: 'Campania' },
  { name: 'Torino', lat: 45.0703, lng: 7.6869, region: 'Piemonte' },
  { name: 'Palermo', lat: 38.1157, lng: 13.3615, region: 'Sicilia' },
  { name: 'Genova', lat: 44.4056, lng: 8.9463, region: 'Liguria' },
  { name: 'Bologna', lat: 44.4949, lng: 11.3426, region: 'Emilia-Romagna' },
  { name: 'Firenze', lat: 43.7696, lng: 11.2558, region: 'Toscana' },
  { name: 'Bari', lat: 41.1171, lng: 16.8719, region: 'Puglia' },
  { name: 'Catania', lat: 37.5079, lng: 15.0830, region: 'Sicilia' },
  { name: 'Venezia', lat: 45.4408, lng: 12.3155, region: 'Veneto' },
  { name: 'Verona', lat: 45.4384, lng: 10.9916, region: 'Veneto' },
  { name: 'Messina', lat: 38.1938, lng: 15.5540, region: 'Sicilia' },
  { name: 'Padova', lat: 45.4064, lng: 11.8768, region: 'Veneto' },
  { name: 'Trieste', lat: 45.6495, lng: 13.7768, region: 'Friuli-Venezia Giulia' },
  { name: 'Brescia', lat: 45.5416, lng: 10.2118, region: 'Lombardia' },
  { name: 'Parma', lat: 44.8015, lng: 10.3279, region: 'Emilia-Romagna' },
  { name: 'Prato', lat: 43.8777, lng: 11.1023, region: 'Toscana' },
  { name: 'Modena', lat: 44.6471, lng: 10.9252, region: 'Emilia-Romagna' },
  { name: 'Reggio Calabria', lat: 38.1084, lng: 15.6435, region: 'Calabria' },
  { name: 'Reggio Emilia', lat: 44.6989, lng: 10.6297, region: 'Emilia-Romagna' },
  { name: 'Perugia', lat: 43.1107, lng: 12.3908, region: 'Umbria' },
  { name: 'Livorno', lat: 43.5485, lng: 10.3106, region: 'Toscana' },
  { name: 'Ravenna', lat: 44.4184, lng: 12.2035, region: 'Emilia-Romagna' },
  { name: 'Cagliari', lat: 39.2238, lng: 9.1216, region: 'Sardegna' },
  { name: 'Foggia', lat: 41.4621, lng: 15.5446, region: 'Puglia' },
  { name: 'Rimini', lat: 44.0678, lng: 12.5695, region: 'Emilia-Romagna' },
  { name: 'Salerno', lat: 40.6824, lng: 14.7681, region: 'Campania' },
  { name: 'Ferrara', lat: 44.8381, lng: 11.6198, region: 'Emilia-Romagna' },
  { name: 'Sassari', lat: 40.7259, lng: 8.5594, region: 'Sardegna' },
  { name: 'Monza', lat: 45.5845, lng: 9.2744, region: 'Lombardia' },
  { name: 'Latina', lat: 41.4677, lng: 12.9036, region: 'Lazio' },
  { name: 'Siracusa', lat: 37.0755, lng: 15.2866, region: 'Sicilia' },
  { name: 'Bergamo', lat: 45.6983, lng: 9.6773, region: 'Lombardia' },
  { name: 'Como', lat: 45.8080, lng: 9.0851, region: 'Lombardia' },
  { name: 'Vicenza', lat: 45.5455, lng: 11.5354, region: 'Veneto' },
  { name: 'Terni', lat: 42.5632, lng: 12.6466, region: 'Umbria' },
  { name: 'Bolzano', lat: 46.4983, lng: 11.3548, region: 'Trentino-Alto Adige' },
  { name: 'Trento', lat: 46.0664, lng: 11.1257, region: 'Trentino-Alto Adige' },
  { name: 'Novara', lat: 45.4469, lng: 8.6218, region: 'Piemonte' },
  { name: 'Piacenza', lat: 45.0526, lng: 9.6929, region: 'Emilia-Romagna' },
  { name: 'Ancona', lat: 43.6158, lng: 13.5189, region: 'Marche' },
  { name: 'Lecce', lat: 40.3515, lng: 18.1750, region: 'Puglia' },
  { name: 'Udine', lat: 46.0710, lng: 13.2345, region: 'Friuli-Venezia Giulia' },
  { name: 'Pescara', lat: 42.4618, lng: 14.2158, region: 'Abruzzo' },
];

export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function getCityCoordinates(cityName: string): CityCoordinates | undefined {
  return ITALIAN_CITIES.find(
    city => city.name.toLowerCase() === cityName.toLowerCase()
  );
}

export function isWithinRadius(
  targetCity: string,
  workCity: string,
  radiusKm: number
): boolean {
  const target = getCityCoordinates(targetCity);
  const work = getCityCoordinates(workCity);

  if (!target || !work) {
    return targetCity.toLowerCase() === workCity.toLowerCase();
  }

  const distance = calculateDistance(target.lat, target.lng, work.lat, work.lng);
  return distance <= radiusKm;
}
