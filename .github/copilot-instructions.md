# Copilot Instructions

This repository is an Expo + React Native + TypeScript app using Expo Router.

## Tech stack and runtime

- Use Node.js `22.x` (see `.nvmrc`).
- Use npm for scripts and dependency management.
- Primary framework versions:
  - `expo` `~54`
  - `react` `19`
  - `react-native` `0.81`

## Project structure

- Routes live in `app/` and follow Expo Router file-based routing.
- Shared UI belongs in `components/`.
- App-wide constants and theme tokens belong in `constants/`.
- Shared state/context belongs in `context/`.
- Reusable hooks belong in `hooks/`.

## Coding guidelines

- Prefer TypeScript (`.ts`/`.tsx`) and keep types explicit for public props/functions.
- Keep components focused and reusable; avoid duplicating UI patterns.
- Preserve existing theming and responsive behavior patterns.
- Prefer cross-platform React Native APIs unless platform-specific behavior is required.

## Auth and environment rules

- This app uses WorkOS AuthKit with PKCE (`context/AuthContext.tsx`).
- Only use public Expo env vars (`EXPO_PUBLIC_*`) in the mobile app.
- Never introduce server secrets (for example `WORKOS_API_KEY`) into this repo.
- `.env` is local-only; update `.env.example` when adding new public env keys.

## Commands Copilot should use/suggest

- Install deps: `npm install`
- Run dev server: `npm start`
- Run linter: `npm run lint`
- Platform targets: `npm run ios`, `npm run android`, `npm run web`

## Change quality checklist

- Keep changes minimal and aligned with existing file organization.
- If a new dependency is required, justify it and keep `package.json` tidy.
- Ensure lint passes for touched files before finalizing suggestions.

## Global UI/UX Design Guidelines

This is a multi-feature Super App.  
All screens and mini-apps MUST follow a unified design system to ensure consistency.

---

### 🎯 Design Philosophy

- Style: Modern, premium, minimal, trustworthy.
- UI should feel consistent across all app modules.
- Prioritize clarity, hierarchy, and usability over decoration.
- Avoid trendy or playful visual styles unless explicitly requested.

---

### 🎨 Color System (Color Theory Based)

Use a structured color hierarchy:

Primary (Brand / Trust / Navigation):

- #0A2540 (Deep luxury blue)

Accent (Interactive / CTA / Highlight):

- #3B82F6

Background:

- #FFFFFF

Surface / Cards:

- #F8FAFC

Text:

- Primary: #111827
- Secondary: #6B7280

Borders / Dividers:

- #E5E7EB

Rules:

- Use primary color for navigation and branding.
- Accent color only for actions, active states, and emphasis.
- Avoid random colors across modules.
- Maintain strong contrast for readability.

---

### 🔵 Border Radius (Golden Ratio Inspired)

Use a consistent radius scale:

- Small elements (inputs, buttons): 4px
- Standard containers/cards: 8px
- Large surfaces/modals: 12px

Rules:

- Use radius scale consistently.
- Avoid excessive rounding.
- Do not mix many radius values in one screen.

---

### 🔠 Typography & Hierarchy

Typography must clearly communicate hierarchy.

Heading scale:

- H1: 32 / weight 700
- H2: 24 / weight 600
- H3: 20 / weight 600
- Body: 16 / weight 400
- Small text: 14 / weight 400

Rules:

- Use consistent spacing between heading and content.
- Avoid too many font sizes on one screen.
- Prefer visual hierarchy over bold everywhere.

---

### 📐 Spacing System (8pt Grid)

Use spacing based on an 8-point system:

4, 8, 12, 16, 24, 32, 40, 48

Rules:

- Avoid arbitrary spacing values.
- Use consistent vertical rhythm.
- Keep layouts breathable.

---

### 🧩 Component Design Principles

General:

- Components must be reusable.
- Follow consistent padding and alignment.
- Avoid visual noise.

Buttons:

- Minimal style.
- Clear pressed/hover/disabled states.
- Radius: 4px.

Cards:

- Radius: 8px.
- Subtle border or soft shadow.
- Clear separation from background.

Navigation:

- Clean and stable layout.
- Consistent icon sizes.
- Active state must be obvious.

---

### 📱 Super App Consistency Rules

Since this is a Super App:

- All mini-apps MUST share:
  - color system
  - typography scale
  - spacing scale
  - component behavior

- New features should feel native to the main app.
- Avoid redesigning components per module.

---

### ♿ UX & Accessibility

- Ensure readable contrast ratios.
- Touchable areas should be large enough for mobile.
- Avoid relying only on color to indicate state.
- Provide clear visual feedback for interactions.

---

### ✨ Motion & Animation

- Animations should be subtle and purposeful.
- Duration: 150–250ms.
- Avoid flashy or distracting transitions.

---

### 🧑‍💻 UI Coding Rules

- Prefer design tokens/constants instead of hardcoded values.
- Reuse existing components before creating new ones.
- Maintain consistent layout patterns across screens.

---

### ❌ Avoid

- Neon or overly saturated colors.
- Heavy gradients.
- Excessive shadows.
- Random spacing or font sizes.
- Inconsistent border radius.
