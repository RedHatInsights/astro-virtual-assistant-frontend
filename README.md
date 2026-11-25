This repository holds the federated modules for Console's virtual assistant (Chameleon).
This can be tested on the landing page.

Note: You don't have to run it anymore with the landing page frontend.

For more detailed information about the virtual assistant and what it provides, [look through the detailed documentation](./docs/).

## For AI Agent Onboarding

**See [ONBOARDING_GUIDE.md](./ONBOARDING_GUIDE.md)** for instructions on how to integrate your AI agent into Chameleon.

## Getting started

1. `npm install`
2. `npm run start` or `npm run start` if running on beta/preview.
3. Navigate to the landing page (you're going to get a 404)
4. You should be able to see it on the bottom right. To make changes to the position/alignment relative to the landing page, check out the landing page code.

If you want to run your backend locally:
- Virtual Assistant (Rasa): `USE_LOCAL_RASA=1 npm run start`
- Multi-Agent System (MAS): `USE_LOCAL_MAS=1 npm run start`

### Preview a federated component in a MAS reply

This developer-only preview works without a MAS backend. Chrome must still provide an authenticated, enabled chat manager (MAS or another available assistant) so the chat can open. Run `npm run start -- --clouddotEnv=stage`, open the chat on `localhost`, `127.0.0.1`, or `stage.foo.redhat.com` with `?masComponentPreview=1`, and dispatch an event in the browser console:

```js
window.dispatchEvent(new CustomEvent('mas-component-preview', { detail: {
  scope: 'yourChromeScope', module: './YourExposedModule',
  importName: 'YourExport', // optional; defaults to default
  props: '{"example":"value"}' // JSON object string
} }));
```

Use a scope already configured by Chrome. Dispatch again with a different module or export to append another reply; no widget registration or provider changes are needed. Invalid JSON is reported in the console. Loading or rendering failures affect only that reply. Previews are in memory, disappear when the chat unmounts, and never send data to MAS. Production builds and non-local hosts ignore the event; MAS response attributes are never used as component targets.

#### Example: frontend starter app HelloWorld

The [starter app](https://github.com/RedHatInsights/frontend-starter-app) exposes `./HelloWorld` as a default React component under the Chrome scope `frontendStarterApp`. Its `runId` prop is required; `text` is optional. This example loads the remote component at runtime, rather than bundling a copy in Astro.

1. On a machine with the Console hosts setup, a container runtime, stage access, and a Red Hat login, install the starter app dependencies and run `npm run static -- --port=8005` in its checkout. Wait for its build to finish and leave it running.
2. In this checkout, temporarily add the following route inside `getRoutes()` in `fec.config.js`, keeping any existing routes. It routes the starter manifest and chunks to the local build:

   ```js
   routes['/apps/frontend-starter-app'] = { host: 'http://127.0.0.1:8005' };
   ```

   Run `npm install` and `npm run start -- --clouddotEnv=stage`. Revert the local-only route when finished.
3. Open `https://stage.foo.redhat.com:1337/staging/starter?masComponentPreview=1`, authenticate, and open an enabled chat. In DevTools, disable the cache and reload. Confirm `/apps/frontend-starter-app/fed-mods.json` is the local manifest with `name: "frontendStarterApp"` and `baseURL: "/apps/frontend-starter-app/"`. Chrome's `/api/chrome-service/v1/static/fed-modules-generated.json` must register `frontendStarterApp` with that manifest location; the manifest's name alone does not register the scope.
4. With the chat open, paste this into the browser console:

   ```js
   window.dispatchEvent(new CustomEvent('mas-component-preview', {
     detail: {
       scope: 'frontendStarterApp',
       module: './HelloWorld',
       props: JSON.stringify({ text: 'Hello from the starter app', runId: 'preview-123' }),
     },
   }));
   ```

   Omitting `importName` selects the default export. The reply should display `Hello from the starter app preview-123`. Check the network and console for loading errors, and stop both servers after testing.


### Static mode

A static mode is provided to be able to host the federated modules:

1. `npm run start:static`
2. Download the landing page frontend code and update the fec config to include these routes.

```javascript
   
module.exports = {
  // ...

  routes: {
    '/apps/virtual-assistant/': { host: 'http://localhost:8003' },

    // Optional. If you want to run a local instance of Rasa add this entry
    '/api/virtual-assistant/v1': { host: 'http://localhost:5005' },
  }
};
```

You still need to complete once the `Initial etc/hosts setup` as detailed in the landing page repository.
After that, you can run `npm run start:standalone`.


## Virtual Assistant State Management

The Virtual Assistant uses a singleton pattern for global state management, allowing control from anywhere in the application - inside or outside of React. This is particularly useful for:

- Opening/closing the assistant from external events
- Setting the current model programmatically
- Passing messages to the assistant
- Integration with federated modules via remote hooks

### Available State

- `isOpen` - Boolean indicating if the assistant is open
- `message` - Optional string message to pass to the assistant
- `currentModel` - Currently selected AI model (enum: `Models`)

### Usage via Remote Hooks (Scalprum)

For federated modules that want to integrate with the Virtual Assistant, use the [Scalprum remote hook pattern](https://github.com/scalprum/scaffolding/blob/main/packages/react-core/docs/use-remote-hook.md):

```typescript
import React from 'react';
import { useRemoteHook } from '@scalprum/react-core';

function RemoteComponent() {
  // Import the entire module to access both the hook and ModelValues
  const { hookResult: module, loading, error } = useRemoteHook({
    scope: 'virtualAssistant',
    module: './state/globalState',
    // Omit importName to get the entire module namespace
    //importName: 'useIsOpen' // to import just the hook to control open state
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error loading hook</div>;

  // Destructure what we need from the module
  const { useVirtualAssistant, ModelValues } = module;
  
  // Now call the hook
  const [state, setState] = useVirtualAssistant();

  return (
    <button onClick={() => {
      // Open VA with a specific model and message using a single setState call
      setState({
        isOpen: true,
        currentModel: ModelValues.RHEL_LIGHTSPEED,
        message: 'Help me with RHEL configuration'
      });
    }}>
      Ask Virtual Assistant (Current: {state.currentModel || 'None'})
    </button>
  );
}
```

### Available Hooks

- `useVirtualAssistant()` - **Recommended**: Returns `[VirtualAssistantState, (updates: Partial<VirtualAssistantState>) => void]` - Unified hook for managing all VA state (isOpen, message, currentModel)
- `useIsOpen()` - Returns `[boolean, Dispatch<SetStateAction<boolean>>]` - Individual hook for open/close state
- `useCurrentModel()` - Returns `[Models | undefined, Dispatch<SetStateAction<Models | undefined>>]` - Individual hook for model selection
- `useMessage()` - Returns `[string | undefined, Dispatch<SetStateAction<string | undefined>>]` - Individual hook for message state

### Available Models

```typescript
import { Models, ModelValues } from './utils/VirtualAssistantStateSingleton';

// TypeScript enum
Models.ASK_RED_HAT
Models.RHEL_LIGHTSPEED
Models.VA
Models.HCC_AI
Models.MAS

// Plain object (JavaScript-friendly)
ModelValues.ASK_RED_HAT      // "Ask Red Hat"
ModelValues.RHEL_LIGHTSPEED  // "RHEL Lightspeed"
ModelValues.VA               // "Virtual Assistant"
ModelValues.HCC_AI           // "HCC AI Assistant"
ModelValues.MAS              // "Multi-Agent System"
```

### Testing

`npm run verify` will run `npm run lint` (eslint) and `npm test` (Jest)

#### ARH Chatbot Component Testing

For comprehensive testing of ARH chatbot components, see the **[ARH Chatbot Testing Guide](./ARH_CHATBOT_TESTING_GUIDE.md)**.

**Available test commands:**
- `npm run test` - Run Jest unit tests
- `npm run test:watch` - Run Jest in watch mode  
- `npm run test:coverage` - Run Jest with coverage report
- `npm run cypress:open:cp` - Open Cypress component test runner
- `npm run cypress:run:cp` - Run Cypress component tests headlessly

**Testing Strategy:**
- **Cypress Component Tests**: UI components, user interactions, accessibility
- **Jest Tests**: React hooks, utility functions, business logic
- **Mocking**: Third-party dependencies (`arh-client`, `ai-client-state`, `ai-react-state`) are mocked to ensure test isolation
