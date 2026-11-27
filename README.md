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

### Simulate a MAS reply with a federated widget

Astro passes `item.envelope.input` directly as the React `input` prop, alongside host-owned `meta`. The starter app's existing `HelloWorld` exports `getContract()`, but returns the ID `starter.hello-world` and accepts flat `runId` and `text` props. A provider wrapper must declare `frontendStarterApp.HelloWorld`, validate `input`, and forward `runId` and `text` to that component. That is separate provider work; `StartApp` below is a worked example, not a shipped module.

The event accepts the **chunk emitted by `handleChunk`**, not a wire event. In [ai-web-clients #73](https://github.com/RedHatInsights/ai-web-clients/pull/73), mas-client has already processed the wire events into `additionalAttributes.widgets`.

#### Try the example

Register the contract-compatible HelloWorld provider in Chrome. Open Astro on `stage.foo.redhat.com` (the development proxy) or `console.stage.redhat.com`, authenticate, enable and select MAS, and open an active MAS conversation. The debug path is enabled on those stage hosts only; other hosts ignore the event. A captured chunk can be dispatched unchanged. The complete example below is also the integration-test fixture; replace `session-1` with the active conversation ID when trying it:

```js
const chunk = {
  messageId: 'message-1',
  conversationId: 'session-1',
  answer: 'Here is the starter widget.',
  additionalAttributes: {
    activeAgents: [],
    hasPendingInteraction: false,
    widgets: [{
      key: 'exec-7::inv-2::hello-1',
      executionId: 'exec-7',
      invocationId: 'inv-2',
      widgetId: 'hello-1',
      revision: 1,
      envelope: {
        type: 'widget',
        widgetId: 'hello-1',
        widget: 'frontendStarterApp.HelloWorld',
        schemaVersion: '1.0',
        revision: 1,
        input: { runId: 'FooBar', text: 'Hello from MAS' },
      },
    }],
  },
};
window.dispatchEvent(new CustomEvent('mas-debug-message', { detail: chunk }));
```

The reply shows “Here is the starter widget.” and “Hello from MAS FooBar”. The provider receives `input={{ runId: 'FooBar', text: 'Hello from MAS' }}` and host-owned `meta`:

```js
{ widget: 'frontendStarterApp.HelloWorld', schemaVersion: '1.0', sessionId: '<active MAS conversation>', turnId: 'exec-7', instanceId: 'exec-7::inv-2::hello-1', source: 'debug' }
```

Dispatching the same chunk again updates the same reply rather than appending another. A later chunk for the same `messageId`, with the same widget key and a higher revision, updates its input in place. These are already-processed snapshots; Astro does not parse wire events or implement the mas-client store. For an output-capable provider such as the hypothetical StartApp below, clicking Approve emits `{ type: 'approve' }` and produces a host `console.info` entry:

```js
'[Astro → MAS client] Would send widget action', {
  sessionId: '<active MAS conversation>',
  turnId: 'exec-7',
  instanceId: 'exec-7::inv-2::hello-1',
  widget: 'frontendStarterApp.StartApp',
  schemaVersion: '1.0',
  actionId: '<fresh generated UUID>',
  output: { type: 'approve' },
}
```

Reject emits `{ type: 'reject' }` through the same callback with a fresh `actionId`. The console event only simulates delivery: it sends no MAS action request, starts or rejects no application, and writes no history. Loading the provider may still make federation network requests.

#### How the host loads widgets

The widget ID is `app_id.module_path`: Chrome's existing federation configuration resolves the app scope; Scalprum loads the exposed `./module_path`. Slash-separated module segments use identifier characters and cannot contain empty, `.` or `..` segments. No packet-supplied URLs, manifests, or separate coordinates are used. The module must export a default React component accepting `{ input, meta, onOutput? }`. An optional `getContract()` returns at least its exact widget ID and schema version, for example `{ widget: 'frontendStarterApp.StartApp', schemaVersion: '1.0' }`. When present, Astro checks that `getContract` is callable and that its result matches the full requested widget ID and `schemaVersion`; the provider validates input and output. An absent export, or an absent/null `outputSchema`, omits `onOutput`. A broken or mismatched contract shows an inline error. Read-only means Astro provides no action callback, **not** that the provider is security-sandboxed. The provider must accept `input` and `meta` and hide or disable action buttons when `onOutput` is absent. A failed module load, missing default, or render error also shows an inline error without hiding the answer. Both modes use the same message format and renderer. Duplicate keys within one message's `widgets` array render once.

Only a stage debug reply supplies one `onOutput` callback per widget declaring a non-null `outputSchema`, for all its actions. Each event logs `[Astro → MAS client] Would send widget action` with the originating widget ID, schema version, session ID, execution ID, instance key, a fresh action ID and the provider output. Context comes from the message and selected conversation, never widget input. Live replies currently receive no callback, even on a stage host: live interaction reply support is still pending. Debug replies are local to the selected conversation and use the same `MASMessageEntry` path as live widget attributes. They are not sent to MAS or written to history.

Debug entries are merged at the current in-memory message-list position because the state manager has no local append API. They survive switching conversations while the chat remains mounted; if a history reload changes the number or order of earlier messages, their original position cannot be reconstructed reliably. The current `mas-client` version does not forward widget attributes from streamed or history responses, so live widget delivery requires a separate client/backend follow-up.

**Manual contract verification:** Register the provider, dispatch the chunk, replay it, and confirm one reply/widget; dispatch a newer snapshot with changed input and confirm an in-place update. For StartApp, change the envelope widget and input to the provider example below; click Approve/Reject and check the originating context and output in the logs. Switch conversations and verify retained callbacks use their original context. Remove `getContract` and verify read-only rendering; introduce a mismatched contract and verify the answer stays visible with an inline error. Stop local servers afterwards.

#### Create a federated widget and render it in an Astro message.

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

These schemas describe the **contents of `input`** and the **emitted event**, not the React props object, host-owned `meta`, or callback itself. Do not put `meta` in `inputSchema` or the envelope's `input`. Valid inputs:

```json
{"appName":"Inventory","environment":"staging"}
```

```json
{"appName":"Inventory","environment":"staging","text":"Start the inventory service now?"}
```

The first renders “Start Inventory in staging?”; the second renders “Start the inventory service now?”. Missing `appName` is invalid:

```json
{"environment":"staging"}
```

Valid emitted outputs:

```json
{"type":"approve"}
```

```json
{"type":"reject"}
```

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

type WidgetMeta = Readonly<{
  widget: string;
  schemaVersion: string;
  sessionId?: string;
  turnId?: string;
  instanceId: string;
  source?: 'debug' | 'live' | 'history';
}>;

interface StartAppProps {
  input: unknown;
  meta: WidgetMeta;
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

These dependency-free validators enforce the example schemas; `Object.hasOwn` requires ES2022-compatible typings and runtime support. Without `onOutput`, the question remains readable but no buttons appear. The provider receives host context in `meta` but knows nothing about a MAS client or endpoint. Extend the existing provider `fec.config.js` configuration, retaining its root entry and other settings:

```js
moduleFederation: {
  // Keep the provider's other moduleFederation settings.
  exposes: {
    './RootApp': './src/AppEntry',
    './StartApp': './src/Components/StartApp/StartApp',
    './widgets/HelloWorld': './src/widgets/HelloWorld',
  },
},
```

This **single exposure** provides both the named `getContract` export and the default `StartApp` export:

| Packet widget | Chrome scope | Exposed module | Contract version |
| --- | --- | --- | --- |
| `frontendStarterApp.StartApp` | `frontendStarterApp` | `./StartApp` | `1.0` |
| `frontendStarterApp.widgets/HelloWorld` | `frontendStarterApp` | `./widgets/HelloWorld` | `1.0` |

Rebuild the provider and verify Chrome's `/api/chrome-service/v1/static/fed-modules-generated.json` registers that scope to the intended provider manifest. Inspect `/apps/frontend-starter-app/fed-mods.json` and its loaded federation entry/chunks in DevTools to confirm the rebuilt deployment contains `./StartApp` and both exports. A correct widget ID cannot load a module absent from the registered provider; a manifest name alone is not registration. The existing starter app does **not** ship this hypothetical `StartApp` or its contract.

For a local provider build, use a machine with the Console hosts setup, container runtime, stage access, and Red Hat login. Install provider dependencies, implement the files and exposure above, then run `npm run static -- --port=8005` in its checkout. Wait for its build. In the Astro checkout temporarily add this route inside `getRoutes()` in `fec.config.js`, retaining existing routes:

```js
routes['/apps/frontend-starter-app'] = { host: 'http://127.0.0.1:8005' };
```

Run `npm run start -- --clouddotEnv=stage`, open `https://stage.foo.redhat.com:1337/staging/starter`, authenticate, disable cache in DevTools, and reload. Confirm the local manifest has `name: "frontendStarterApp"` and `baseURL: "/apps/frontend-starter-app/"`, Chrome registers it, and its federation entry/chunks contain the new exposure. Stop both servers and revert the local-only route after testing.

Astro's host render passes the stored envelope input directly:

```tsx
// Both modes receive the same input and host-owned metadata.
<Widget input={item.envelope.input} meta={meta} />
// A debug widget declaring outputSchema on a stage host gets the callback.
<Widget input={item.envelope.input} meta={meta} onOutput={debugOutputHandler} />
```

`item.envelope.input` becomes `input` directly, without spreading or double-wrapping. Astro builds `meta` from the owning conversation and stored instance (`key`, `executionId`, and envelope identity). Debug ingress stamps `source: 'debug'`; other replies have no source until mas-client provides a live/history distinction. Neither input nor event-supplied source overrides this context, and `actionId` is not part of `meta`.

To reproduce provider validation failure with StartApp, change the example chunk's envelope widget to `frontendStarterApp.StartApp` and its input to `{ environment: 'staging' }` (missing `appName`), then dispatch it.

The answer remains visible and the provider displays “Cannot display start request: invalid input.” A missing module instead shows Astro's “Unable to load widget.” error, distinct from provider validation.

For a contract mismatch on a stage debug host, Astro shows the requested and returned values. For example, if the message requests the nested exposure `frontendStarterApp.widgets/HelloWorld` but `getContract()` returns the flat ID, the widget shows:

```text
Widget ID mismatch.
Requested by message: frontendStarterApp.widgets/HelloWorld
Returned by getContract(): frontendStarterApp.HelloWorld
```

Check the provider's exposure path and make its contract ID match the full message ID. If IDs match but schema versions differ, the error reports the requested and returned versions instead. Outside debug mode, Astro shows “This widget doesn’t match the reply’s contract.” The error affects only that widget; the assistant answer remains visible. An absent `getContract` still renders read-only without an action callback.

The console event only simulates delivery; the callback logs a proposed mas-client payload. It sends no MAS action request, starts or rejects no application, and writes no history. Loading the provider may still make federation network requests. Local debug support does not imply live MAS support: the current mas-client does not forward live widget attributes, and transport requires separate work.

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
