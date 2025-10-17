This repository holds the federated modules for Console's virtual assistant (Chameleon).
This can be tested on the landing page.

Note: You don't have to run it anymore with the landing page frontend.

## For AI Agent Onboarding

**See [ONBOARDING_GUIDE.md](./ONBOARDING_GUIDE.md)** for instructions on how to integrate your AI agent into Chameleon.

## Getting started

1. `npm install`
2. `npm run start` or `npm run start` if running on beta/preview.
3. Navigate to the landing page (you're going to get a 404)
4. You should be able to see it on the bottom right. To make changes to the position/alignment relative to the landing page, check out the landing page code.

If you want to run your backend locally, use `USE_LOCAL_RASA=1 npm run start`.


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
import React, { useEffect } from 'react';
import { useRemoteHook } from '@scalprum/react-core';
import { getModule } from '@scalprum/core';

function RemoteComponent() {
  // Access the isOpen state
  const { hookResult: [isOpen, setIsOpen], loading, error } = useRemoteHook({
    scope: 'virtualAssistant',
    module: './VirtualAssistantStateSingleton',
    importName: 'useIsOpen',
  });

  // Access the current model
  const { hookResult: [currentModel, setCurrentModel], loading: modelLoading } = useRemoteHook({
    scope: 'virtualAssistant',
    module: './VirtualAssistantStateSingleton',
    importName: 'useCurrentModel',
  });

  // Access the message state
  const { hookResult: [message, setMessage], loading: messageLoading } = useRemoteHook({
    scope: 'virtualAssistant',
    module: './VirtualAssistantStateSingleton',
    importName: 'useMessage',
  });

  if (loading || modelLoading || messageLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading hook</div>;

  // Example: Load ModelValues and set default model on mount
  useEffect(() => {
    const setDefaultModel = async () => {
      const models = await getModule('virtualAssistant', 'VirtualAssistantStateSingleton', 'ModelValues');
      setCurrentModel(models.RHEL_LIGHTSPEED);
    }
  }, []);

  return (
    <button onClick={() => {
      setMessage('Help me with RHEL configuration');
      setIsOpen(true);
    }}>
      Ask Virtual Assistant
    </button>
  );
}
```

### Available Hooks

- `useIsOpen()` - Returns `[boolean, Dispatch<SetStateAction<boolean>>]`
- `useCurrentModel()` - Returns `[Models | undefined, Dispatch<SetStateAction<Models | undefined>>]`
- `useMessage()` - Returns `[string | undefined, Dispatch<SetStateAction<string | undefined>>]`

### Available Models

```typescript
import { Models, ModelValues } from './utils/VirtualAssistantStateSingleton';

// TypeScript enum
Models.ASK_RED_HAT
Models.RHEL_LIGHTSPEED
Models.VA
Models.OAI

// Plain object (JavaScript-friendly)
ModelValues.ASK_RED_HAT      // "Ask Red Hat"
ModelValues.RHEL_LIGHTSPEED  // "RHEL Lightspeed"
ModelValues.VA               // "Virtual Assistant"
ModelValues.OAI              // "OpenShift assisted Installer"
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
