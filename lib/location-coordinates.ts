// A mapping of city names to coordinates and additional information for our location database
export const cityCoordinates: Record<
  string,
  { lat: number; lng: number; city?: string; state?: string; zip?: string }
> = {
  // Major US cities
  "new york, ny": { lat: 40.7128, lng: -74.006, city: "New York", state: "NY", zip: "10001" },
  "los angeles, ca": { lat: 34.0522, lng: -118.2437, city: "Los Angeles", state: "CA", zip: "90001" },
  "chicago, il": { lat: 41.8781, lng: -87.6298, city: "Chicago", state: "IL", zip: "60601" },
  "houston, tx": { lat: 29.7604, lng: -95.3698, city: "Houston", state: "TX", zip: "77001" },
  "phoenix, az": { lat: 33.4484, lng: -112.074, city: "Phoenix", state: "AZ", zip: "85001" },
  "philadelphia, pa": { lat: 39.9526, lng: -75.1652, city: "Philadelphia", state: "PA", zip: "19101" },
  "san antonio, tx": { lat: 29.4241, lng: -98.4936, city: "San Antonio", state: "TX", zip: "78201" },
  "san diego, ca": { lat: 32.7157, lng: -117.1611, city: "San Diego", state: "CA", zip: "92101" },
  "dallas, tx": { lat: 32.7767, lng: -96.797, city: "Dallas", state: "TX", zip: "75201" },
  "san jose, ca": { lat: 37.3382, lng: -121.8863, city: "San Jose", state: "CA", zip: "95101" },
  "austin, tx": { lat: 30.2672, lng: -97.7431, city: "Austin", state: "TX", zip: "78701" },
  "jacksonville, fl": { lat: 30.3322, lng: -81.6557, city: "Jacksonville", state: "FL", zip: "32099" },
  "san francisco, ca": { lat: 37.7749, lng: -122.4194, city: "San Francisco", state: "CA", zip: "94103" },
  "columbus, oh": { lat: 39.9612, lng: -82.9988, city: "Columbus", state: "OH", zip: "43201" },
  "indianapolis, in": { lat: 39.7684, lng: -86.1581, city: "Indianapolis", state: "IN", zip: "46201" },
  "fort worth, tx": { lat: 32.7555, lng: -97.3308, city: "Fort Worth", state: "TX", zip: "76101" },
  "charlotte, nc": { lat: 35.2271, lng: -80.8431, city: "Charlotte", state: "NC", zip: "28201" },
  "seattle, wa": { lat: 47.6062, lng: -122.3321, city: "Seattle", state: "WA", zip: "98101" },
  "denver, co": { lat: 39.7392, lng: -104.9903, city: "Denver", state: "CO", zip: "80201" },
  "washington, dc": { lat: 38.9072, lng: -77.0369, city: "Washington", state: "DC", zip: "20001" },
  "boston, ma": { lat: 42.3601, lng: -71.0589, city: "Boston", state: "MA", zip: "02108" },
  "nashville, tn": { lat: 36.1627, lng: -86.7816, city: "Nashville", state: "TN", zip: "37201" },
  "baltimore, md": { lat: 39.2904, lng: -76.6122, city: "Baltimore", state: "MD", zip: "21201" },
  "oklahoma city, ok": { lat: 35.4676, lng: -97.5164, city: "Oklahoma City", state: "OK", zip: "73101" },
  "portland, or": { lat: 45.5051, lng: -122.675, city: "Portland", state: "OR", zip: "97201" },
  "las vegas, nv": { lat: 36.1699, lng: -115.1398, city: "Las Vegas", state: "NV", zip: "89101" },
  "milwaukee, wi": { lat: 43.0389, lng: -87.9065, city: "Milwaukee", state: "WI", zip: "53201" },
  "albuquerque, nm": { lat: 35.0844, lng: -106.6504, city: "Albuquerque", state: "NM", zip: "87101" },
  "tucson, az": { lat: 32.2226, lng: -110.9747, city: "Tucson", state: "AZ", zip: "85701" },
  "fresno, ca": { lat: 36.7378, lng: -119.7871, city: "Fresno", state: "CA", zip: "93701" },
  "sacramento, ca": { lat: 38.5816, lng: -121.4944, city: "Sacramento", state: "CA", zip: "95801" },
  "atlanta, ga": { lat: 33.749, lng: -84.388, city: "Atlanta", state: "GA", zip: "30301" },
  "kansas city, mo": { lat: 39.0997, lng: -94.5786, city: "Kansas City", state: "MO", zip: "64101" },
  "miami, fl": { lat: 25.7617, lng: -80.1918, city: "Miami", state: "FL", zip: "33101" },
  "raleigh, nc": { lat: 35.7796, lng: -78.6382, city: "Raleigh", state: "NC", zip: "27601" },
  "omaha, ne": { lat: 41.2565, lng: -95.9345, city: "Omaha", state: "NE", zip: "68101" },
  "minneapolis, mn": { lat: 44.9778, lng: -93.265, city: "Minneapolis", state: "MN", zip: "55401" },
  "cleveland, oh": { lat: 41.4993, lng: -81.6944, city: "Cleveland", state: "OH", zip: "44101" },
  "new orleans, la": { lat: 29.9511, lng: -90.0715, city: "New Orleans", state: "LA", zip: "70112" },
  "honolulu, hi": { lat: 21.3069, lng: -157.8583, city: "Honolulu", state: "HI", zip: "96801" },
  "oxford, ms": { lat: 34.3668, lng: -89.5192, city: "Oxford", state: "MS", zip: "38655" }, // Added Oxford, MS

  // Common locations (using San Francisco as default)
  home: { lat: 37.7749, lng: -122.4194, city: "San Francisco", state: "CA", zip: "94103" },
  work: { lat: 37.7749, lng: -122.4194, city: "San Francisco", state: "CA", zip: "94103" },
  downtown: { lat: 37.7749, lng: -122.4194, city: "San Francisco", state: "CA", zip: "94103" },
  uptown: { lat: 37.7749, lng: -122.4194, city: "San Francisco", state: "CA", zip: "94103" },
  midtown: { lat: 37.7749, lng: -122.4194, city: "San Francisco", state: "CA", zip: "94103" },
  suburb: { lat: 37.7749, lng: -122.4194, city: "San Francisco", state: "CA", zip: "94103" },
  "shopping center": { lat: 37.7749, lng: -122.4194, city: "San Francisco", state: "CA", zip: "94103" },
  mall: { lat: 37.7749, lng: -122.4194, city: "San Francisco", state: "CA", zip: "94103" },
  airport: { lat: 37.7749, lng: -122.4194, city: "San Francisco", state: "CA", zip: "94103" },
  university: { lat: 37.7749, lng: -122.4194, city: "San Francisco", state: "CA", zip: "94103" },
  college: { lat: 37.7749, lng: -122.4194, city: "San Francisco", state: "CA", zip: "94103" },
  hospital: { lat: 37.7749, lng: -122.4194, city: "San Francisco", state: "CA", zip: "94103" },
  park: { lat: 37.7749, lng: -122.4194, city: "San Francisco", state: "CA", zip: "94103" },
  beach: { lat: 37.7749, lng: -122.4194, city: "San Francisco", state: "CA", zip: "94103" },
}

// Function to get coordinates for a location
export function getCoordinatesForLocation(location: string): { lat: number; lng: number } | null {
  const normalizedLocation = location.toLowerCase().trim()

  // Check if it's in our database
  if (cityCoordinates[normalizedLocation]) {
    return cityCoordinates[normalizedLocation]
  }

  // Try to match partial names
  for (const [city, coords] of Object.entries(cityCoordinates)) {
    if (normalizedLocation.includes(city) || city.includes(normalizedLocation)) {
      return coords
    }
  }

  return null
}

// Function to get city information for a location
export function getCityInfo(location: string): { city: string; state: string; zip: string } | null {
  const normalizedLocation = location.toLowerCase().trim()

  // Check if it's in our database
  if (cityCoordinates[normalizedLocation]) {
    const coords = cityCoordinates[normalizedLocation]
    return {
      city: coords.city || "San Francisco",
      state: coords.state || "CA",
      zip: coords.zip || "94103",
    }
  }

  // Try to match partial names
  for (const [city, coords] of Object.entries(cityCoordinates)) {
    if (normalizedLocation.includes(city) || city.includes(normalizedLocation)) {
      return {
        city: coords.city || "San Francisco",
        state: coords.state || "CA",
        zip: coords.zip || "94103",
      }
    }
  }

  return null
}
