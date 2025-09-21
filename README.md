# Fullstack Grocery Finder

A web application that helps users find grocery items across different stores, compare prices, and plan shopping trips efficiently.

## Features

- Search for grocery items across multiple stores
- Compare prices between different retailers
- Save shopping lists for future reference
- Get directions to stores
- View store locations on a map

## Environment Variables

This project requires the following environment variables to be set:
env

# Google Maps API Key for geocoding and places API (server-side only)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Google Maps ID for client-side map rendering
NEXT_PUBLIC_GOOGLE_MAPS_ID=your_google_maps_id_here

# Kroger API credentials
KROGER_CLIENT_ID=your_kroger_client_id_here
KROGER_CLIENT_SECRET=your_kroger_client_secret_here

## Deployment Instructions

### Prerequisites

1. Google Maps API key with the following APIs enabled:
   - Maps JavaScript API
   - Places API
   - Geocoding API
   - Directions API

2. Kroger API credentials (Client ID and Client Secret)

### Deploying to Vercel

1. Fork or clone this repository
2. Create a new project on Vercel
3. Connect your GitHub repository to Vercel
4. Add the required environment variables in the Vercel project settings
5. Deploy the project

### Local Development

1. Clone the repository
2. Copy `.env.local.example` to `.env.local` and fill in your API keys
3. Install dependencies with `npm install`
4. Run the development server with `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## API Integrations

This project integrates with the following APIs:

- Google Maps API for location services and mapping
- Kroger API for product and store information

## License

[MIT](LICENSE)
