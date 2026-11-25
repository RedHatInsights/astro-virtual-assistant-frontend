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

Use a scope already configured by Chrome. Dispatch again with a different module or export to append another reply; no widget registration or provider changes are needed. Invalid JSON is reported in the console. Loading or rendering failures affect only that reply. Previews are in memory, disappear when the chat unmounts, and never send data to MAS. Production builds and non-local hosts ignore the event.

To exercise the MAS widget path, create and register the hypothetical provider in [the worked example](#create-a-federated-widget-and-render-it-in-an-astro-message) below. The existing `HelloWorld` component is an arbitrary-component preview, not a contract-capable MAS widget.

The widget ID is exactly `app_id.module_id`: Chrome's existing federation configuration resolves the app scope; Scalprum loads the exposed `./module_id`. No packet-supplied URLs, manifests, or separate coordinates are used. The module must export `getContract()` returning at least its exact widget ID and schema version, for example `{ widget: 'frontendStarterApp.StartApp', schemaVersion: '1.0' }`, and a default React component accepting `{ input, onOutput? }`. Astro checks the exact ID and version, then passes the complete packet `props` as `input`. The provider owns input validation and event `outputSchema` validation. A missing export, failed contract, mismatch, or render error shows an inline error without hiding the answer. Repeated instance IDs in one assistant turn render once; the same ID in another turn is independent.

Only local development preview mode supplies one `onOutput` callback per widget for all its actions. Each event logs `[Astro → MAS client] Would send widget action` with the originating session ID, assistant turn ID, packet instance ID, a fresh action ID and the provider output. Context comes from the message and selected conversation, never widget props. The debug event requires a nonempty `turnId`; live messages without a MAS-provided turn ID log it as undefined. No request or history write occurs. Outside debug mode the callback is omitted entirely. Debug replies are local to the selected conversation and use the same `MASMessageEntry` path as live widget attributes. They are not sent to MAS or written to history.

Debug entries are merged at the current in-memory message-list position because the state manager has no local append API. They survive switching conversations while the chat remains mounted; if a history reload changes the number or order of earlier messages, their original position cannot be reconstructed reliably. The current `mas-client` version does not forward widget attributes from streamed or history responses, so live widget delivery requires a separate client/backend follow-up. The current starter app also needs a separate provider follow-up to export the contract and accept `input`; this Astro change does not implement it.

**Manual contract verification:** With the example provider registered in Chrome, select MAS, dispatch its debug message below, and check the answer and widget appear. Add the same packet twice to `widgets` and confirm one widget renders; dispatch another message with the same instance ID and confirm it renders in that new turn. Trigger approve and reject, checking each console log contains the originating session and turn, instance ID, fresh action ID, and emitted output; switch conversations and verify any retained callback still uses its original context. Using a live-attribute fixture without `?masComponentPreview=1`, confirm the provider receives no callback (the debug event itself is disabled there). Change the schema version or use a provider missing `getContract` or its default export and confirm the answer remains visible with an inline error. Verify widget-owned input/output validation in the provider. Stop local servers afterwards.

#### Create a federated widget and render it in an Astro message

This is a **hypothetical provider example**, not a shipped starter-app module. It describes provider files to create separately; Astro only loads the resulting federation module. The example asks “Start Inventory in staging?” and emits Approve or Reject.

In a provider, create `src/Components/StartApp/start-app.contract.ts`:

```ts
export const startAppContract = {
  widget: 'frontendStarterApp.StartApp',
  schemaVersion: '1.0',
  inputSchema: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    properties: {
      appName: { type: 'string', minLength: 1 },
      environment: { type: 'string', minLength: 1 },
      text: { type: 'string' },
    },
    required: ['appName', 'environment'],
    additionalProperties: false,
  },
  outputSchema: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    properties: { type: { type: 'string', enum: ['approve', 'reject'] } },
    required: ['type'],
    additionalProperties: false,
  },
} as const;
```

These schemas describe the **contents of `input`** and the **emitted event**, not the React props object or callback itself. Valid inputs include `{ appName: 'Inventory', environment: 'staging' }` and `{ appName: 'Inventory', environment: 'staging', text: 'Start the inventory service now?' }`; `{ environment: 'staging' }` is invalid. Valid outputs are `{ type: 'approve' }` and `{ type: 'reject' }`.

Create `src/Components/StartApp/StartApp.tsx` alongside the contract:

```tsx
import React from 'react';
import { startAppContract } from './start-app.contract';

interface StartAppInput {
  appName: string;
  environment: string;
  text?: string;
}

interface StartAppOutput {
  type: 'approve' | 'reject';
}

interface StartAppProps {
  input: unknown;
  onOutput?: (event: StartAppOutput) => void;
}

export function getContract() {
  return startAppContract;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isInput(value: unknown): value is StartAppInput {
  if (!isRecord(value)) return false;
  if (!Object.keys(value).every((key) => Object.hasOwn(startAppContract.inputSchema.properties, key))) return false;
  return (
    Object.hasOwn(value, 'appName') && typeof value.appName === 'string' && value.appName.length > 0 &&
    Object.hasOwn(value, 'environment') && typeof value.environment === 'string' && value.environment.length > 0 &&
    (!Object.hasOwn(value, 'text') || typeof value.text === 'string')
  );
}

function isOutput(value: unknown): value is StartAppOutput {
  if (!isRecord(value)) return false;
  return Object.keys(value).length === 1 && Object.hasOwn(value, 'type') &&
    (value.type === 'approve' || value.type === 'reject');
}

export default function StartApp({ input, onOutput }: StartAppProps) {
  if (!isInput(input)) return <p role="alert">Cannot display start request: invalid input.</p>;

  const respond = (output: StartAppOutput) => {
    if (isOutput(output)) onOutput?.(output);
  };

  return (
    <div>
      <p>{input.text ?? `Start ${input.appName} in ${input.environment}?`}</p>
      {onOutput && (
        <div>
          <button type="button" onClick={() => respond({ type: 'approve' })}>Approve</button>
          <button type="button" onClick={() => respond({ type: 'reject' })}>Reject</button>
        </div>
      )}
    </div>
  );
}
```

These dependency-free validators enforce the example schemas; `Object.hasOwn` requires ES2022-compatible typings and runtime support. The provider knows nothing about a MAS client, session, or endpoint. Extend the existing provider `fec.config.js` exposes map, retaining its root entry:

```js
exposes: {
  './RootApp': './src/AppEntry',
  './StartApp': './src/Components/StartApp/StartApp',
},
```

This **single exposure** provides both the named `getContract` export and the default `StartApp` export. Its Chrome scope is `frontendStarterApp` and its module is `./StartApp`. Rebuild the provider and verify Chrome's `/api/chrome-service/v1/static/fed-modules-generated.json` registers that scope to the intended provider manifest. Inspect `/apps/frontend-starter-app/fed-mods.json` and its loaded federation entry/chunks in DevTools to confirm the rebuilt deployment contains `./StartApp` and both exports. A correct widget ID cannot load a module absent from the registered provider; a manifest name alone is not registration. The local routing and authentication setup in the [HelloWorld example](#example-frontend-starter-app-helloworld) can be used for a local provider build.

Astro's `MASWidgets` loader does the following (excerpt; `widget` is the packet and `sessionId`/`turnId` come from the originating reply):

```tsx
const getContract = await getModule<unknown>(target.scope, target.module, 'getContract');
if (typeof getContract !== 'function') throw new Error('Missing widget contract');
const contract: unknown = await getContract();
if (!isRecord(contract) || contract.widget !== widget.widget || contract.schemaVersion !== widget.schemaVersion) {
  throw new Error('Widget contract mismatch');
}
const loaded = await getModule<React.ComponentType<WidgetProps> | undefined>(target.scope, target.module, 'default');
if (!loaded) throw new Error('Missing widget component');
if (mounted) setComponent(() => loaded);

// After loading, in local preview mode only:
const instanceId = widget.instanceId;
const onOutput = isComponentPreviewEnabled()
  ? (output: unknown) =>
      console.info('[Astro → MAS client] Would send widget action', {
        sessionId, turnId, instanceId, actionId: crypto.randomUUID(), output,
      })
  : undefined;
return React.createElement(component, { input: widget.props, ...(onOutput && { onOutput }) });
```

The host checks identity and version; the provider validates schema contents. Packet `props` becomes `input` directly: do **not** double-wrap it as `props: { input: ... }`.

With the rebuilt provider registered and its `./StartApp` available, run Astro in development on `localhost`, `127.0.0.1`, or `stage.foo.redhat.com` with `?masComponentPreview=1`. Open an authenticated, enabled chat, select MAS, and open an active MAS conversation. Then dispatch in DevTools:

```js
window.dispatchEvent(new CustomEvent('mas-debug-message', {
  detail: {
    turnId: 'turn-7',
    answer: 'Starting this application requires your approval.',
    widgets: [{
      type: 'widget',
      widget: 'frontendStarterApp.StartApp',
      schemaVersion: '1.0',
      instanceId: 'start-app-1',
      props: { appName: 'Inventory', environment: 'staging' },
    }],
  },
}));
```

The reply shows “Starting this application requires your approval.” followed by “Start Inventory in staging?” and Approve/Reject buttons. Clicking Approve produces a `console.info` entry in this format:

```js
'[Astro → MAS client] Would send widget action', {
  sessionId: '<session ID owning turn-7>',
  turnId: 'turn-7',
  instanceId: 'start-app-1',
  actionId: '<fresh generated UUID>',
  output: { type: 'approve' },
}
```

Reject uses the same callback with a fresh `actionId` and `output: { type: 'reject' }`. A new action ID is generated for each click; session, turn, and instance context comes from the originating reply, not the widget input.

To reproduce provider validation failure, dispatch a new reply with a fresh instance ID and missing `appName`:

```js
window.dispatchEvent(new CustomEvent('mas-debug-message', {
  detail: {
    turnId: 'turn-8',
    answer: 'Starting this application requires your approval.',
    widgets: [{
      type: 'widget',
      widget: 'frontendStarterApp.StartApp',
      schemaVersion: '1.0',
      instanceId: 'start-app-invalid',
      props: { environment: 'staging' },
    }],
  },
}));
```

The answer remains visible and the provider displays “Cannot display start request: invalid input.” A missing module or contract mismatch instead shows Astro's “Unable to load widget.” error, distinct from provider validation.

The console event only simulates delivery; the callback logs a proposed mas-client payload. It sends no MAS action request, starts or rejects no application, and writes no history. Loading the provider may still make federation network requests. Local debug support does not imply live MAS support: the current mas-client does not forward live widget attributes, and transport requires separate work.

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
