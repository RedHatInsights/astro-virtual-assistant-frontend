import React, { useEffect, useState } from 'react';
import { getModule } from '@scalprum/core';
import { isComponentPreviewEnabled } from './ComponentPreview';

export const MAS_DEBUG_MESSAGE_EVENT = 'mas-debug-message';

export interface MASWidget {
  type: 'widget';
  widget: string;
  schemaVersion: string;
  instanceId: string;
  props: Record<string, unknown>;
}

// Provider-owned contract: input/output schemas and validation remain with the widget.
export interface MASWidgetContract {
  widget: string;
  schemaVersion: string;
}

interface WidgetProps {
  input: Record<string, unknown>;
  onOutput?: (event: unknown) => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

export function isMASWidget(value: unknown): value is MASWidget {
  return (
    isRecord(value) &&
    value.type === 'widget' &&
    typeof value.widget === 'string' &&
    value.widget.length > 0 &&
    typeof value.schemaVersion === 'string' &&
    value.schemaVersion.length > 0 &&
    typeof value.instanceId === 'string' &&
    value.instanceId.length > 0 &&
    isRecord(value.props)
  );
}

export function parseDebugMessage(value: unknown): { answer: string; widgets: MASWidget[] } {
  if (!isRecord(value) || typeof value.answer !== 'string' || !Array.isArray(value.widgets) || !value.widgets.every(isMASWidget)) {
    throw new Error('Expected an answer and an array of widget descriptors');
  }
  return { answer: value.answer, widgets: value.widgets };
}

// The qualified ID selects only an existing Chrome-configured scope and exposed module.
// It cannot provide a URL, manifest, or separate federation coordinates.
function resolveWidgetId(id: string): { scope: string; module: string } | undefined {
  const match = /^([A-Za-z_$][\w$-]*)\.([A-Za-z_$][\w$-]*)$/.exec(id);
  return match ? { scope: match[1], module: `./${match[2]}` } : undefined;
}

class WidgetErrorBoundary extends React.Component<React.PropsWithChildren, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? <span role="alert">Unable to render widget.</span> : this.props.children;
  }
}

function MASWidgetLoader({ widget }: { widget: MASWidget }) {
  const [component, setComponent] = useState<React.ComponentType<WidgetProps>>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let mounted = true;
    setComponent(undefined);
    setFailed(false);
    const load = async () => {
      const target = resolveWidgetId(widget.widget);
      if (!target) throw new Error('Invalid widget ID');
      const getContract = await getModule<unknown>(target.scope, target.module, 'getContract');
      if (typeof getContract !== 'function') throw new Error('Missing widget contract');
      const contract: unknown = await getContract();
      if (!isRecord(contract) || contract.widget !== widget.widget || contract.schemaVersion !== widget.schemaVersion) {
        throw new Error('Widget contract mismatch');
      }
      const loaded = await getModule<React.ComponentType<WidgetProps> | undefined>(target.scope, target.module, 'default');
      if (!loaded) throw new Error('Missing widget component');
      if (mounted) setComponent(() => loaded);
    };
    load().catch(() => {
      if (mounted) setFailed(true);
    });
    return () => {
      mounted = false;
    };
  }, [widget.widget, widget.schemaVersion]);

  if (failed) return <span role="alert">Unable to load widget.</span>;
  if (!component) return <span>Loading widget...</span>;
  const onOutput = isComponentPreviewEnabled()
    ? (event: unknown) => console.info('MAS widget output', { widget: widget.widget, instanceId: widget.instanceId, event })
    : undefined;
  return React.createElement(component, { input: widget.props, ...(onOutput && { onOutput }) });
}

export function MASWidgets({ widgets }: { widgets: unknown }) {
  if (!Array.isArray(widgets)) return null;
  const seen = new Set<string>();
  return (
    <>
      {widgets.map((widget, index) => {
        if (!isMASWidget(widget))
          return (
            <span key={`invalid-${index}`} role="alert">
              Unable to load widget.
            </span>
          );
        if (seen.has(widget.instanceId)) return null;
        seen.add(widget.instanceId);
        return (
          <WidgetErrorBoundary key={`${widget.instanceId}-${widget.widget}-${widget.schemaVersion}`}>
            <MASWidgetLoader widget={widget} />
          </WidgetErrorBoundary>
        );
      })}
    </>
  );
}
