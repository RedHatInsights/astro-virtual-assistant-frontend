# Chameleon Project Onboarding Guide

## ⚠️ Important Disclaimer

**This is a TEMPORARY solution.** Chameleon exists as an interim interface before we have a single AI service that can route seamlessly between different agents. 

HCC is a frontend platform with multiple independent services, and each service is adding their own AI chatbots. This creates a poor user experience. Chameleon ensures users have one interaction point while we work toward an overarching AI interface.

**This solution should be considered temporary and will be replaced once a unified AI routing service is available.** There is no specific timeline for when this replacement will occur.

## What is Chameleon?

Chameleon is a user interface based on PatternFly that allows users to switch between different AI agents in HCC (Hybrid Cloud Console).

For state management and network handling, it uses the [ai-web-clients](https://github.com/RedHatInsights/ai-web-clients) package.

## Project Scope

### In Scope
- Provide a single user interface for multiple AI agents
- Interface that allows users to switch between agents
- Unify the user experience across different AI agents

### Out of Scope
- **Blending of conversation history**: If you ask something in Agent A, Agent B will not have any knowledge of it
- **Backend AI agent routing**: No intelligent routing between agents on the backend
- **Proprietary UI elements**: Custom UI components are not provided (though they can be implemented by AI agent owners and plugged into the UI)
- **Team coordination**: Coordination between different teams that provide AI agents

## TL;DR - Onboarding Requirements

To onboard your AI agent to Chameleon, you will need:

1. **API**: An API with authentication based on Red Hat external SSO that can accept JWT-based API auth
2. **API Client**: Create an API client that is compatible with the interface defined by the ai-web-clients package
3. **UI Integration**: Hook your client into the PatternFly-based UI

---

# Onboarding Guide

## Prerequisites

- An AI agent/chatbot that can be interacted with via REST API
  - Response streaming is supported
- Accept authentication from Red Hat external SSO
- Your REST API must be able to accept Auth header with JWT bearer token
- Approval to expose your AI agent in HCC (coordinate with the platform team for this step)

## Creating Client

### Distribution

Your client package can be distributed in two ways:

1. **Recommended**: Add it to the [ai-web-clients](https://github.com/RedHatInsights/ai-web-clients) monorepo
2. **Alternative**: Distribute through other means, but it must be installable via npm on the public network

### Implementation Requirements

Your client must implement the `IAIClient` interface from the [ai-client-common](https://github.com/RedHatInsights/ai-web-clients/tree/main/packages/ai-client-common) package.

**Key Points:**
- Follow the class definition provided in the ai-client-common package
- Your client can contain additional methods for your specific use case, but only the `IAIClient` interface methods will be used by the state manager
- **If your project depends on Lightspeed Core (LSC)**: Consider using the existing [lightspeed-client](https://github.com/RedHatInsights/ai-web-clients/tree/main/packages/lightspeed-client)
  - If your REST API strictly follows the LSC interface without extra functionality, you can re-use the lightspeed client directly
  - If you need custom functionality, extend the LSC client class and override the methods as needed

### Recommended Approach: AI-Assisted Development

**Use generative AI** to create your client implementation:

- Provide your OpenAPI spec (or equivalent) to generative AI tools to generate the client code
- This approach works well due to the well-defined interfaces on both sides
- All existing clients in the ai-web-clients package were primarily created using generative AI
- Reference the [ai-rules directory](https://github.com/RedHatInsights/ai-web-clients/tree/main/ai-rules) for AI-assisted coding guidelines

## Adding New AI State Manager to UI

To integrate your new AI client into the Chameleon UI, you need to create a state manager and add it to the system. This involves creating two hooks and updating the state manager array.

### Step 1: Create Authentication Hook

Create a hook that checks if your AI service is authenticated and available (similar to `useArhAuthenticated` in `src/aiClients/useArhClient.ts:24`):

```typescript
import { useEffect, useState } from 'react';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { ClientAuthStatus, Models } from './types';

export function useYourServiceAuthenticated(): ClientAuthStatus {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | undefined>(undefined);
  const chrome = useChrome();
  
  useEffect(() => {
    // Your authentication logic here
    // Example: check if user has access to your service
    async function checkAuth() {
      try {
        const user = await chrome.auth.getUser();
        if (user) {
          // Implement your service-specific auth check
          setIsAuthenticated(true); // Replace with actual auth logic
        }
      } catch (error) {
        setIsAuthenticated(false);
        setError(error instanceof Error ? error : new Error('Authentication failed'));
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [chrome.auth.token]);
  
  return {
    loading,
    isAuthenticated,
    error,
    model: Models.YOUR_SERVICE,
  };
}
```

### Step 2: Create State Manager Configuration Hook

Create a hook that returns a `StateManagerConfiguration` object (similar to `useArhClient` in `src/aiClients/useArhClient.ts:66`):

```typescript
import { useMemo } from 'react';
import { createClientStateManager } from '@redhat-cloud-services/ai-client-state';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { Models, StateManagerConfiguration } from './types';
import UniversalChatbot from '../Components/UniversalChatbot/UniversalChatbot';

function useYourServiceManager(): StateManagerConfiguration<YourClient> {
  const chrome = useChrome();
  const stateManager = useMemo(() => {
    const client = new YourClient({
      // Your client configuration
      baseUrl: 'https://your-service-api.example.com',
      fetchFunction: async (input, options) => {
        const token = await chrome.auth.getToken();
        if (!token) {
          throw new Error('User is not authenticated');
        }
        return fetch(input, {
          ...options,
          headers: {
            ...options?.headers,
            Authorization: `Bearer ${token}`,
          },
        });
      },
    });
    return createClientStateManager(client);
  }, [chrome]);

  const configuration: StateManagerConfiguration<YourClient> = {
    model: Models.YOUR_SERVICE,
    historyManagement: true, // Set based on your service capabilities
    streamMessages: true, // Set based on your service capabilities
    modelName: 'Your Service Name',
    selectionTitle: 'Your Service Display Title',
    selectionDescription: 'Description of what your service does and its use cases',
    Component: UniversalChatbot,
    stateManager,
    docsUrl: 'https://docs.example.com/your-service',
  };
  return configuration;
}

export default useYourServiceManager;
```

### Step 3: Add Your Model to Types

Add your new model to the `Models` enum in `src/aiClients/types.ts`:

```typescript
export enum Models {
  ASK_RED_HAT = 'Ask Red Hat',
  RHEL_LIGHTSPEED = 'RHEL Lightspeed',
  VA = 'Virtual Assistant',
  YOUR_SERVICE = 'Your Service Name',
}
```

### Step 4: Update useStateManager.ts

Integrate your new state manager by updating `src/aiClients/useStateManager.ts`:

1. **Import your hooks** at the top of the file:
```typescript
import useYourServiceManager, { useYourServiceAuthenticated } from './useYourServiceManager';
```

2. **Add authentication check** in `useInitialModel()` function:
```typescript
const yourServiceEnabled = useYourServiceAuthenticated();
```

3. **Update the `enabledList` array** in `useInitialModel()` (around line 21):
```typescript
const enabledList = [arhEnabled, rhelLightspeedEnabled, vaEnabled, yourServiceEnabled];
```

4. **Add your service manager** in `useStateManager()` function:
```typescript
const yourServiceManager = useYourServiceManager();
```

5. **Update the stateManagers array** (around line 65-67):
```typescript
const stateManagers = useMemo(() => {
  const managers = [arhManager, rhelLightspeedManager, vaManager, yourServiceManager];
  return managers;
}, [initializing]);
```

### ⚠️ Critical: Manager Order

The order of managers in the `stateManagers` array is **critical**:
- The system picks the **first manager** in the array that meets the enablement requirements
- This becomes the default AI agent when the chatbot opens
- Place your manager in the appropriate priority position based on your use case and intended default behavior

## Optional: Custom Elements

The `UniversalChatbot` component provides two customizable component props that allow you to override default behavior with custom implementations:

### Available Customization Points

1. **MessageEntryComponent**: Custom message rendering component
2. **FooterComponent**: Custom footer component (defaults to `UniversalFooter`)

### Example: Custom Component Integration

If you need custom functionality (like feedback, quota alerts, or special message handling), you can create a custom chatbot component:

```typescript
import UniversalChatbot from '../UniversalChatbot/UniversalChatbot';
import YourCustomMessageEntry from './YourCustomMessageEntry';
import YourCustomFooter from './YourCustomFooter';

function YourServiceChatbot(props: ChatbotProps) {
  return (
    <UniversalChatbot
      {...props}
      MessageEntryComponent={YourCustomMessageEntry}
      FooterComponent={YourCustomFooter}
    />
  );
}
```

Then use this custom component in your state manager configuration:

```typescript
const configuration: StateManagerConfiguration<YourClient> = {
  // ... other config
  Component: YourServiceChatbot, // Use your custom component instead of UniversalChatbot
};
```

### Real-World Example: ARH Message Entry

The ARH implementation uses a custom `ARHMessageEntry` component that adds:
- **Feedback functionality**: Message rating and feedback forms
- **Quota alerts**: Display warnings when message limits are reached
- **Custom sources handling**: Special navigation handling for internal vs external links

```typescript
// ARHMessageEntry.tsx example features:
const { messageActions, userFeedbackForm, feedbackCompleted } = useMessageFeedback(message);
const quota = useArhMessageQuota(message);

return (
  <>
    <Message
      // ... standard message props
      actions={messageActions}           // Custom feedback actions
      userFeedbackForm={userFeedbackForm} // Feedback form integration
      userFeedbackComplete={feedbackCompleted}
    />
    {quota && <Alert {...quota} />}      {/* Custom quota alerts */}
  </>
);
```

### When to Use Custom Components

- **Message-specific functionality**: Feedback, rating, custom formatting
- **Service-specific alerts**: Quota warnings, service status
- **Custom navigation**: Special link handling or routing
- **Additional UI elements**: Extra buttons, forms, or interactive elements

### Implementation Notes

- Custom components receive the same props as the default components
- You can extend or completely replace the default behavior
- Make sure to maintain accessibility and PatternFly design consistency
