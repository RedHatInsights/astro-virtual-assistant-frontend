# VA Client Async Initialization Test

This document shows how the VA client now handles async initialization of the dynamic initial message.

## Changes Made

### 1. VA Client (`src/aiClients/vaClient.ts`)
- Added `isInitialized` and `isInitializing` state tracking
- Modified `getConversationHistory()` to return empty array until initialized
- Enhanced `init()` method with proper state management
- Added `isInitialized()` and `isInitializing()` methods for StateManager integration

### 2. VA Manager (`src/aiClients/useVaManager.ts`)
- Removed automatic initialization on page load
- Initialization now happens only when VA model is selected
- Relies on existing `useStateManager` logic to trigger init when needed
- More efficient - no unnecessary API calls on page load

## Expected Behavior

1. **Page Load**: VA client is created but not initialized
2. **User Opens Chatbot**: Shows static welcome message from `welcome` config
3. **User Selects VA Model**: `useStateManager` triggers initialization
4. **Background**: VA client calls `/session_start` API
5. **After Init**: VA client returns dynamic initial message from API
6. **UI Updates**: Messages re-render to show dynamic content

## Flow Diagram

```
User Opens Chatbot
    ↓
Static welcome message shows
    ↓
User Selects VA Model
    ↓
useStateManager triggers stateManager.init()
    ↓
VA Client init() calls postTalk('/session_start')
    ↓
API responds with dynamic message
    ↓
VA Client updates initialMessage 
    ↓
stateManager.notifyAll() triggers UI update
    ↓
useMessages() re-runs and gets new conversation history
    ↓
UniversalMessages re-renders with dynamic content
```

## Testing

To test this behavior:
1. Open the chatbot (any model)
2. Switch to VA model - you should see the static welcome message
3. VA client initializes in background and calls `/session_start` API
4. After API call completes: Dynamic message from API should appear
5. The static welcome should be replaced by the dynamic message

The key improvement is that the dynamic initial message now shows up properly instead of being hidden behind the static welcome message.
