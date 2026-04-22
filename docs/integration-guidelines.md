# Integration Guidelines

## Module Federation (Scalprum)

This app is a **federated module provider** — it exposes components and hooks that other HCC applications consume at runtime via Scalprum.

### Exposed Modules

Defined in `fec.config.js`:

| Module Path | Source | Purpose |
|-------------|--------|---------|
| `./AstroVirtualAssistant` | `src/SharedComponents/AstroVirtualAssistant/` | Portal-based chatbot overlay |
| `./VAEmbed` | `src/SharedComponents/VAEmbed/` | Inline embedded chatbot |
| `./useArhChatbot` | `src/aiClients/useArhClient.ts` | ARH client manager hook |
| `./useRhelChatbot` | `src/aiClients/useRhelLightSpeedManager.ts` | RHEL Lightspeed manager hook |
| `./useVaChatbot` | `src/aiClients/useVaManager.ts` | VA manager hook |
| `./state/globalState` | `src/utils/VirtualAssistantStateSingleton.ts` | Global state hooks |

### Shared Dependencies

`react-router-dom` is shared as a singleton and excluded from the bundle. Other shared deps are managed by `@redhat-cloud-services/frontend-components-config`.

### Consuming Federated Modules

Other HCC apps use Scalprum's `useRemoteHook` to load hooks from this app:

```typescript
const { hookResult, loading } = useRemoteHook({
  scope: 'virtualAssistant',
  module: './state/globalState',
});
```

### Rules for Exposed Modules

- Exposed modules must have stable APIs — breaking changes affect all consumers
- Do not add new exports to exposed modules without coordinating with consumer apps
- Test exposed hooks independently (not just as part of the full UI)
- The `Models` enum and `ModelValues` object from `globalState` are part of the public API

## Platform Integration (insights-chrome)

### Chrome Context

The app depends on `insights-chrome` for:

- **Authentication**: `chrome.auth.getToken()`, `chrome.auth.getUser()`
- **Analytics**: `chrome.analytics.track()`
- **Navigation**: Chrome provides the shell (top nav, side nav)
- **Feature flags**: Access to Unleash feature toggles

### Entry Point

`src/entry.ts` is minimal (single line). The actual app bootstrapping happens in the `AstroVirtualAssistant` shared component, which renders via a React Portal into the Chrome shell.

## State Management

### Singleton Pattern

`VirtualAssistantStateSingleton.ts` provides global state accessible from inside and outside React:

- **Inside React**: Use hooks (`useIsOpen`, `useCurrentModel`, `useMessage`, `useVirtualAssistant`)
- **Outside React**: Use static methods on the singleton

### Subscription Model

The singleton uses a subscriber pattern — external consumers subscribe to state changes. React hooks internally use `useState` + subscription to trigger re-renders.

### Rules

- Always use `useVirtualAssistant()` for new code (unified hook)
- Individual hooks (`useIsOpen`, `useCurrentModel`, `useMessage`) exist for backward compatibility
- Never mutate singleton state directly — always use the setter functions
- State is in-memory only — not persisted across page reloads

## Deployment

### Frontend CRD

`deploy/frontend.yaml` defines the `Frontend` custom resource for the frontend-operator:

- App name: `virtual-assistant`
- Path: `/apps/virtual-assistant`
- Module federation manifest: `/apps/virtual-assistant/fed-mods.json`

### Konflux/Tekton

- PR pipeline: `.tekton/virtual-assistant-frontend-pull-request.yaml` (image expires after 5 days)
- Push pipeline: `.tekton/virtual-assistant-frontend-push.yaml` (permanent image)
- Image: `quay.io/redhat-user-workloads/hcc-platex-services-tenant/virtual-assistant/virtual-assistant-frontend`

## CSS Integration

- SASS prefix: `.virtualAssistant` (set in `fec.config.js`)
- All custom styles must be scoped under this prefix to avoid conflicts with other federated apps
- Use PatternFly 6 utility classes (`pf-v6-u-*`) for layout and spacing
- Component SCSS files are colocated with their components
