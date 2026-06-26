# Cameroon Weather Dashboard

A single-page dashboard for real-time weather information in Cameroonian cities.

## Features

- Single page dashboard layout
- Fetches live weather from OpenWeatherMap
- City quick selection for major Cameroonian cities
- Search input for custom city names in Cameroon
- 5-day forecast cards with weather icons
- Temperature unit toggle between Celsius and Fahrenheit
- Favorite cities saved in local storage
- Live status updates with error handling

## Setup

1. Install dependencies

   npm install

2. Copy `.env.example` to `.env` and add your OpenWeatherMap API key:

   cp .env.example .env
   VITE_OPENWEATHER_API_KEY=your_api_key_here

3. Start the development server

   npm run dev

4. Open the local URL shown in the terminal.

## Notes

- This project uses the OpenWeatherMap current weather endpoint.
- If no API key is configured, the app shows a warning to add `VITE_OPENWEATHER_API_KEY`.
