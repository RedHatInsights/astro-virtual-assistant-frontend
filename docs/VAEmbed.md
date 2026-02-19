# VAEmbed Component

A version of the Virtual Assistant that can be embedded inline within other components, such as help panels or sidebars, rather than rendered as a floating overlay.

## Overview

Unlike `AstroVirtualAssistant` which uses `createPortal` to render to `document.body`, `VAEmbed` renders inline and can be placed anywhere in the component tree. This makes it ideal for embedding within existing UI components.

## Usage

### Basic Usage

```tsx
import VAEmbed from './src/SharedComponents/VAEmbed/VAEmbed';

function HelpPanel() {
  return (
    <Panel>
      <PanelMain>
        <h2>Help</h2>
        <VAEmbed />
      </PanelMain>
    </Panel>
  );
}
```

### With Custom Styling

```tsx
<VAEmbed
  className="my-custom-embed"
  onClose={() => console.log('AI Assistant closed')}
/>
```

### Module Federation

VAEmbed is exposed as a federated module and can be consumed by other applications:

```tsx
// In consuming application
const VAEmbed = React.lazy(() => import('astro-virtual-assistant/VAEmbed'));

function MyComponent() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <VAEmbed className="help-ai" />
    </React.Suspense>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onClose` | `() => void` | `undefined` | Optional callback function called when the virtual assistant should be closed |
| `className` | `string` | `undefined` | Additional CSS class name for custom styling |

## Features

- **Embedded Display Mode**: Uses PatternFly's `ChatbotDisplayMode.embedded` for inline rendering
- **No Fullscreen Toggle**: Fullscreen mode is disabled since it doesn't make sense for embedded contexts
- **Inline Rendering**: Renders within the normal component tree, not as a portal
- **Custom Styling**: Accepts `className` prop for custom styling
- **Error Handling**: Shows user-friendly error messages if initialization fails
- **Loading States**: Displays spinner while AI managers are loading

## CSS Classes

- `.va-embed` - Main container class
- `.va-embed-error` - Error state styling (red text, centered, with padding)

## Comparison with AstroVirtualAssistant

| Feature | AstroVirtualAssistant | VAEmbed |
|---------|----------------------|---------|
| **Rendering** | Portal to `document.body` | Inline in component tree |
| **Position** | Fixed (bottom-right overlay) | Flexible (within parent) |
| **Display Mode** | Default/Fullscreen toggle | Embedded only |
| **Use Case** | Global floating assistant | Embedded in panels/sidebars |
| **Trigger** | Chat badge click | Always visible when mounted |

## Examples

### Help Panel Integration

```tsx
import { Panel, PanelMain, Button } from '@patternfly/react-core';
import VAEmbed from 'astro-virtual-assistant/VAEmbed';

function HelpPanelWithAI() {
  const [showAI, setShowAI] = useState(false);

  return (
    <Panel>
      <PanelMain>
        <h2>Help & Support</h2>
        <Button onClick={() => setShowAI(!showAI)}>
          {showAI ? 'Hide' : 'Show'} AI Assistant
        </Button>

        {showAI && (
          <VAEmbed
            onClose={() => setShowAI(false)}
            className="help-ai-embed"
          />
        )}
      </PanelMain>
    </Panel>
  );
}
```

### Sidebar Integration

```tsx
import { PageSidebar, SidebarPanel } from '@patternfly/react-core';
import VAEmbed from 'astro-virtual-assistant/VAEmbed';

function AppSidebar() {
  return (
    <PageSidebar>
      <SidebarPanel variant="sticky">
        <nav>
          <h3>Quick Help</h3>
          <VAEmbed className="sidebar-ai" />
        </nav>
      </SidebarPanel>
    </PageSidebar>
  );
}
```

## Custom Styling

```scss
.my-custom-embed {
  max-height: 500px;
  border: 1px solid var(--pf-global--BorderColor--100);
  border-radius: var(--pf-global--BorderRadius--sm);
}

.help-ai-embed {
  margin-top: 1rem;
}

.sidebar-ai {
  height: 400px;
}
```