# Security Guidelines

## Authentication

### Red Hat SSO Integration

All API calls require JWT bearer tokens obtained through Red Hat external SSO. The platform handles SSO login — this app consumes tokens via the Chrome auth API.

```typescript
const chrome = useChrome();
const token = await chrome.auth.getToken();
```

### Token Usage Rules

- Never store tokens in localStorage or sessionStorage
- Always fetch fresh tokens via `chrome.auth.getToken()` before each API call
- Pass tokens in the `Authorization: Bearer <token>` header
- Never log or expose token values

### Per-Service Auth Checks

Each AI client performs its own authentication/entitlement check before becoming available:

| Service | Auth Check | Location |
|---------|-----------|----------|
| ARH (Ask Red Hat) | `/hydra/rest/contacts/sso/current` on access.redhat.com | `src/aiClients/useArhClient.ts` |
| RHEL Lightspeed | `user.entitlements.rhel.is_entitled` | `src/aiClients/useRhelLightSpeedManager.ts` |
| VA | No additional check (available to all authenticated users) | `src/aiClients/useVaManager.ts` |

### Auth Failure Handling

- If auth check fails, set `isAuthenticated = false` — the service simply won't appear in the model selector
- Never show error messages to users about auth failures for individual AI services
- Log auth failures to console for debugging

## Feature Flags

Feature toggles use Unleash (`@unleash/proxy-client-react`). AI services can be gated behind feature flags to control rollout:

```typescript
const isEnabled = useFlagEnabled('platform.ai.your-service');
```

- Feature flags are checked in `useStateManager.ts` alongside auth
- A service must pass both feature flag and auth checks to be available

## API Security

### Fetch Wrapper Pattern

All API clients use a custom `fetchFunction` that injects auth headers:

```typescript
fetchFunction: async (input, options) => {
  const token = await chrome.auth.getToken();
  if (!token) throw new Error('User is not authenticated');
  return fetch(input, {
    ...options,
    headers: { ...options?.headers, Authorization: `Bearer ${token}` },
  });
}
```

- Never bypass this pattern with direct `fetch()` calls
- Never hardcode API keys or tokens

### CORS and CSP

CORS and Content Security Policy are managed by the platform (insights-chrome and the proxy layer). This app does not configure CORS headers directly.

## Sensitive Data

- User avatars are loaded from `https://access.redhat.com/api/users/avatar/` — the username in the URL is acceptable (it's the SSO username, not PII)
- Conversation history is stored in-memory only (no persistence to localStorage or backend)
- Do not log message content to the console in production builds
