# mobile-app

A cross-platform mobile application built with [Expo](https://expo.dev) and [React Native](https://reactnative.dev), featuring file-based routing via [Expo Router](https://docs.expo.dev/router/introduction).

## Features

- **Hero Banner Slider** - Auto-advancing image carousel with animated dot indicators and manual swipe/tap navigation
- **Feature Grid** - Responsive, paginated grid of app features with haptic feedback
- **Popular Chips** - Quick-access shortcuts to frequently used features
- **Authentication Flow** - Protected routes that redirect unauthenticated users to the login screen
- **Adaptive Layout** - Responsive across phones, tablets, and desktop (web) breakpoints
- **Themed UI** - Light/dark color scheme with a consistent design token system

## Project Structure

```txt
app/                 # File-based routes (Expo Router)
  (tabs)/            # Bottom-tab navigator screens
  feature/[key].tsx  # Dynamic feature screen
  index.tsx          # Landing screen (hero slider + feature grid)
  login.tsx          # Authentication screen
components/          # Shared UI components
constants/           # Pages config, theme tokens
context/             # AuthContext (authentication state)
hooks/               # Custom hooks (color scheme, theme color)
assets/images/       # Static image assets
Dockerfile           # Node 22 container image
docker-compose.yml   # Local container orchestration
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) `22.x`
- npm (comes with Node)
- Docker + Docker Compose (optional)

### Use Node 22

```bash
nvm use
```

`.nvmrc` is set to `22`.

### Configure Environment Variables

```bash
cp .env.example .env
```

Set at least:

```env
EXPO_PUBLIC_WORKOS_CLIENT_ID=client_...
```

Current env keys:

- `EXPO_PUBLIC_WORKOS_CLIENT_ID` - WorkOS AuthKit public client id (safe for mobile/public client use)
- `EXPO_PUBLIC_WORKOS_API_HOSTNAME` - WorkOS API host (`api.workos.com` default)
- `EXPO_PUBLIC_WORKOS_REDIRECT_SCHEME` - App scheme for auth redirect (`mobile` by default)
- `EXPO_PUBLIC_WORKOS_REDIRECT_PATH` - Callback path (`auth/callback` by default)
- `EXPO_PUBLIC_WORKOS_WEB_REDIRECT_URI` - Optional full web callback URI override (recommended for GitHub Pages)
- `EXPO_PUBLIC_WORKOS_ORGANIZATION_ID` - Optional organization hint
- `EXPO_PUBLIC_WORKOS_CONNECTION_ID` - Optional connection hint
- `EXPO_PUBLIC_WORKOS_DOMAIN_HINT` - Optional domain hint
- `EXPO_PUBLIC_WORKOS_LOGIN_HINT` - Optional login email hint

Register these redirect URIs in WorkOS AuthKit:

```txt
mobile://auth/callback
https://kamkyi.github.io/mobile-app/auth/callback
```

### Install Dependencies

```bash
npm install
```

### Start the Development Server

```bash
npx expo start
```

From the terminal output you can open the app in:

- **Expo Go** - scan the QR code with the [Expo Go](https://expo.dev/go) app (iOS / Android)
- **iOS Simulator** - press `i`
- **Android Emulator** - press `a`
- **Web browser** - press `w`

## WorkOS Security Model (No Backend Yet)

- Mobile app should use only **public** config (`client_id`).
- Do not add `WORKOS_API_KEY` to this app or `.env` here.
- `WORKOS_API_KEY` must live on a backend/server only.
- `.env` is gitignored; `.env.example` is committed for onboarding.

## Current Auth Integration

- `context/AuthContext.tsx` uses AuthKit PKCE with `expo-auth-session`.
- Login state is persisted in `expo-secure-store`.
- Authorization request: `https://api.workos.com/user_management/authorize`
- Code exchange request: `https://api.workos.com/user_management/authenticate`
- Successful login stores WorkOS session data locally and populates the signed-in user.

## Docker (Node 22)

Build and run with Docker Compose:

```bash
docker compose up --build
```

The compose service exposes:

- `8081` (Metro)
- `19000`, `19001`, `19002` (Expo dev ports)

## Key Implementation Notes

### Hero Banner Slider (`app/index.tsx`)

The hero section uses a `FlatList` with `pagingEnabled` for smooth slide transitions. Key details:

- `HERO_AUTO_MS = 4500` - auto-advance interval in milliseconds
- `HERO_H_PAD = 12` - horizontal padding applied inside the slider container so slides are inset from the screen edge
- Slides auto-advance via `setInterval` and support manual navigation by tapping the dot indicators
- Layout dimensions (`heroH`, `heroW`) are computed from `useWindowDimensions` to adapt to any screen size

### Responsive Layout

Column count and card/hero dimensions scale across breakpoints:

| Screen width  | Columns | Layout class  |
| ------------- | ------- | ------------- |
| < 480 px      | 2       | Phone         |
| 480 - 767 px  | 3       | Large phone   |
| 768 - 899 px  | 4       | Tablet        |
| 900 - 1199 px | 5       | Large tablet  |
| >= 1200 px    | 6       | Desktop / web |

## Scripts

| Command                 | Description                        |
| ----------------------- | ---------------------------------- |
| `npm start`             | Start the Expo dev server          |
| `npm run start:docker`  | Start Expo server for Docker usage |
| `npm run android`       | Open on Android emulator           |
| `npm run ios`           | Open on iOS simulator              |
| `npm run web`           | Open in web browser                |
| `npm run reset-project` | Reset app to blank starter         |
| `npm run lint`          | Run ESLint                         |

## Learn More

- [Expo documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [React Native documentation](https://reactnative.dev/docs/getting-started)
- [Expo on GitHub](https://github.com/expo/expo)
