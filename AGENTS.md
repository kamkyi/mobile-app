# AGENTS.md

Instructions for coding agents working in this repository.

## Project context

- Stack: Expo + React Native + TypeScript + Expo Router.
- Runtime: Node.js `22.x` (see `.nvmrc`).
- Package manager: npm.

## Repo map

- `app/`: Expo Router screens/routes.
- `components/`: shared UI.
- `constants/`: theme tokens and static config.
- `context/`: app state/auth providers.
- `hooks/`: reusable hooks.

## Working rules

- Keep edits minimal and focused on the request.
- Reuse existing patterns before introducing new abstractions.
- Prefer typed interfaces for component props and exported APIs.
- Avoid adding dependencies unless clearly necessary.

## Auth and security

- This app uses WorkOS AuthKit PKCE in `context/AuthContext.tsx`.
- Use only `EXPO_PUBLIC_*` vars in client code.
- Do not add server secrets (for example `WORKOS_API_KEY`) to this repo.
- When adding env keys, update `.env.example`.

## Validation

- Run lint after meaningful code changes: `npm run lint`.
- If behavior is changed, include a short verification note in your final response.

## UI consistency

- Follow existing design tokens and spacing/typography conventions.
- Keep cross-platform behavior consistent unless platform-specific handling is required.
