# AGENTS for rms-frontend

## Scope
- Target scope: only this project directory (`rms-frontend`) and files under it.
- Applies to React/TypeScript frontend work only.
- Coordinate with backend via REST APIs and shared contracts, but do not modify backend files from this scope.

## Stack
- React + TypeScript + Vite
- ESLint / frontend build tooling from `package.json`

## Collaboration Rules
- Prefer minimal, localized changes.
- Keep existing component structure and naming style.
- Do not rename or delete files unless explicitly requested.
- If a request is unclear, infer the smallest safe change and flag assumptions clearly.
- Never edit outside `rms-frontend` from this context.

## Code Style
- Use TypeScript-first patterns with explicit types where practical.
- Prefer small, reusable components with clear props interfaces.
- Keep side-effects and API calls in service/repository-like modules when possible.
- Use existing utility classes/components instead of creating duplicate styles.
- Favor accessibility (semantic elements, labels, keyboard navigation, visible focus states).

## Commands
- `npm install` : install dependencies
- `npm run dev` : run dev server
- `npm run build` : production build
- `npm run lint` : lint check

## Common Task Focus
- Page/component implementation and styling
- API type modeling for frontend contracts
- UI state handling and error/loading UX
- Form validation and interaction behavior
- Build/route changes

## Safety
- Do not commit secrets or API keys.
- Remove debug logs and temporary test data before finalizing.

## Notes
- If backend contract changes are required, document the expected API shape and ask for a backend-side follow-up.
