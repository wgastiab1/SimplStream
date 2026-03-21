# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WilFlix (also named SimplStream/WilStream) is a streaming aggregation app that provides movies, TV shows, and live TV channels. It consists of a React web frontend wrapped in Capacitor for Android, with a Python FastAPI backend deployed on Vercel.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Mobile**: Capacitor (Android APK builds)
- **Backend**: Python FastAPI (Vercel serverless)
- **API**: TMDB (The Movie Database) for metadata

## Common Commands

```bash
# Frontend development
npm run dev          # Start Vite dev server at localhost:5173
npm run build        # Build for production (outputs to /dist)
npm run lint         # Run ESLint

# Capacitor (Android)
npx cap sync android    # Sync web build to Android project
npx cap open android    # Open Android project in Android Studio
# Then build APK in Android Studio

# Backend (Python/FastAPI)
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000   # Local dev server
```

## Architecture

### Frontend (`/src`)

- **Components**: Major views in `/src/components`:
  - `HomeView.tsx` - Main dashboard with trending content
  - `PlayerView.tsx` - Video player with server switching
  - `LiveTVView.tsx` - Live TV channel grid
  - `DetailView.tsx` - Movie/TV show details with cast, trailers
  - `ProfileSelector.tsx` - Profile management
- **Context** (`/src/context`): ThemeContext, LanguageContext for app-wide state
- **Lib** (`/src/lib`):
  - `tmdb.ts` - TMDB API client
  - `storage.ts` - localStorage persistence helpers
  - `liveChannels.ts` - Live TV channel definitions
  - `translations.ts` - i18n strings

### Backend (`/backend`)

- FastAPI app with CORS middleware
- `/api/search`, `/api/trending`, `/api/details/{media_type}/{tmdb_id}` routes
- TMDB proxy service to hide API keys and add caching

### Configuration

- `src/config.ts` - Frontend config (TMDB key, backend URL, feature flags)
- `capacitor.config.ts` - Capacitor settings (app ID: `com.justanormalchurro.wilstream`)
- `backend/.env` - Backend environment variables (TMDB_API_KEY)

### Build Output

- Web build: `/dist`
- Android APK: Built via Android Studio from `/android`

## API Integration

The app uses TMDB API for metadata (posters, trailers, cast). The backend proxies requests to hide the API key. Set `USE_BACKEND: false` in `src/config.ts` to use direct TMDB calls instead.

## Argentina Channel Data

Channel lists are stored in JSON files (`argentina_channels.json`, `argentina_list_final.json`) and loaded by `liveChannels.ts`.
