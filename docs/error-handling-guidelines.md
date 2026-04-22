# Error Handling Guidelines

## General Pattern

Use `try-catch-finally` for all async operations. Always set loading state in `finally`:

```typescript
try {
  const result = await someAsyncOperation();
  setData(result);
} catch (error) {
  console.error('Context-specific message', error);
  setError(error instanceof Error ? error : new Error('Operation failed'));
} finally {
  setLoading(false);
}
```

## Authentication Errors

### Silent Degradation

Auth failures for individual AI services should be silent — the service simply won't appear:

```typescript
// Correct: silent degradation
setIsAuthenticated(false);

// Wrong: showing error to user
showErrorNotification('ARH authentication failed');
```

### Auth Check Pattern

All auth hooks (`useArhAuthenticated`, `useRhelLightspeedAuthenticated`, etc.) return `ClientAuthStatus`:

```typescript
interface ClientAuthStatus {
  loading: boolean;
  isAuthenticated: boolean;
  error: Error | undefined;
  model: Models;
}
```

- `loading: true` — service is checking auth, don't render yet
- `isAuthenticated: false` — service unavailable, hide from selector
- `error` — logged for debugging, not shown to users

## API Call Errors

### Network Failures

- Catch `fetch` failures and surface a user-friendly message in the chat
- Do not expose HTTP status codes or backend error details to users
- Log the full error (including status, response body) to console

### Streaming Errors

When a streamed response fails mid-stream:
- Display the partial content received so far
- Append an error indicator message
- Allow the user to retry

## Component Error Boundaries

- The app does not use React Error Boundaries globally — individual features handle their own errors
- If a manager hook throws during initialization, `useStateManager` catches it and excludes that service

## Console Logging

- Use `console.error` for errors that need investigation
- Use `console.warn` for degraded functionality (e.g., missing feature flags)
- Do not use `console.log` for errors — it's harder to filter in production
- Never log sensitive data (tokens, user details, message content)

## Error States in UI

- **Initialization failure**: Show a generic "Something went wrong" message in the chatbot area
- **Send failure**: Show an error message in the conversation thread, keep the input enabled for retry
- **Auth failure**: Service silently disappears from the model selector
- **Feature flag off**: Same as auth failure — silent exclusion
