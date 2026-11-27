import React, { useEffect, useState } from 'react';
import { getModule, getScalprum } from '@scalprum/core';
import { isMASDebugEnabled } from './MASDebug';
import { WidgetMeta } from './types';

// The fields consumed from mas-client's StoredWidgetInstance. The installed
// client predates its export; use its published type when that version lands.
interface StoredWidgetInstance {
  key: string;
  executionId: string;
  envelope: {
    widget: string;
    schemaVersion: string;
    input: Record<string, unknown>;
  };
}

// Provider-owned contract: input/output schemas and validation remain with the widget.
export interface MASWidgetContract {
  widget: string;
  schemaVersion: string;
}

interface WidgetProps {
  input: Record<string, unknown>;
  meta: WidgetMeta;
  onOutput?: (event: unknown) => void;
}

type WidgetLoadError = { kind: 'load' } | { kind: 'mismatch'; field: 'widget' | 'schemaVersion'; requested: string; returned: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isMASWidget(value: unknown): value is StoredWidgetInstance {
  return (
    isRecord(value) &&
    typeof value.key === 'string' &&
    value.key.length > 0 &&
    typeof value.executionId === 'string' &&
    value.executionId.length > 0 &&
    isRecord(value.envelope) &&
    typeof value.envelope.widget === 'string' &&
    value.envelope.widget.length > 0 &&
    typeof value.envelope.schemaVersion === 'string' &&
    value.envelope.schemaVersion.length > 0 &&
    isRecord(value.envelope.input)
  );
}

// The qualified ID selects only an existing Chrome-configured scope and exposed module.
// It cannot provide a URL, manifest, or separate federation coordinates.
function resolveWidgetId(id: string): { scope: string; module: string } | undefined {
  const match = /^([A-Za-z_$][\w$-]*)\.([A-Za-z_$][\w$-]*(?:\/[A-Za-z_$][\w$-]*)*)$/.exec(id);
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

function MASWidgetLoader({ widget, sessionId, source }: { widget: StoredWidgetInstance; sessionId?: string; source?: WidgetMeta['source'] }) {
  const { envelope, key: instanceId, executionId: turnId } = widget;
  const [loadedWidget, setLoadedWidget] = useState<{ component: React.ComponentType<WidgetProps>; interactive: boolean }>();
  const [error, setError] = useState<WidgetLoadError>();

  useEffect(() => {
    let mounted = true;
    setLoadedWidget(undefined);
    setError(undefined);
    const load = async () => {
      const target = resolveWidgetId(envelope.widget);
      if (!target) throw new Error('Invalid widget ID');
      // getModule selects one export; inspect the actual namespace to distinguish an absent
      // contract from an explicitly exported undefined value, without hiding load errors.
      const component = await getModule<React.ComponentType<WidgetProps> | undefined>(target.scope, target.module, 'default');
      if (!component) throw new Error('Missing widget component');
      const namespace: unknown = await getScalprum().pluginStore.getExposedModule(target.scope, target.module);
      if (!isRecord(namespace)) throw new Error('Invalid widget module');
      let interactive = false;
      if (Object.prototype.hasOwnProperty.call(namespace, 'getContract')) {
        const getContract: unknown = namespace.getContract;
        if (typeof getContract !== 'function') throw new Error('Invalid widget contract');
        const contract: unknown = await getContract();
        if (!isRecord(contract) || typeof contract.widget !== 'string') throw new Error('Invalid widget contract');
        if (contract.widget !== envelope.widget) {
          if (mounted) setError({ kind: 'mismatch', field: 'widget', requested: envelope.widget, returned: contract.widget });
          return;
        }
        if (typeof contract.schemaVersion !== 'string') throw new Error('Invalid widget contract');
        if (contract.schemaVersion !== envelope.schemaVersion) {
          if (mounted) setError({ kind: 'mismatch', field: 'schemaVersion', requested: envelope.schemaVersion, returned: contract.schemaVersion });
          return;
        }
        interactive = contract.outputSchema !== undefined && contract.outputSchema !== null;
      }
      if (mounted) setLoadedWidget({ component, interactive });
    };
    load().catch(() => {
      if (mounted) setError({ kind: 'load' });
    });
    return () => {
      mounted = false;
    };
  }, [envelope.widget, envelope.schemaVersion]);

  if (error) {
    if (error.kind === 'load') return <span role="alert">Unable to load widget.</span>;
    if (!isMASDebugEnabled()) return <span role="alert">This widget doesn’t match the reply’s contract.</span>;
    return (
      <span role="alert">
        {error.field === 'widget' ? 'Widget ID mismatch.' : 'Widget schema version mismatch.'}
        <br />
        Requested by message: {error.requested}
        <br />
        Returned by getContract(): {error.returned}
      </span>
    );
  }
  if (!loadedWidget) return <span>Loading widget...</span>;
  const meta: WidgetMeta = {
    widget: envelope.widget,
    schemaVersion: envelope.schemaVersion,
    instanceId,
    ...(sessionId !== undefined && { sessionId }),
    ...(turnId !== undefined && { turnId }),
    ...(source !== undefined && { source }),
  };
  const onOutput =
    loadedWidget.interactive && source === 'debug' && isMASDebugEnabled()
      ? (output: unknown) =>
          console.info('[Astro → MAS client] Would send widget action', {
            sessionId,
            turnId,
            instanceId,
            widget: envelope.widget,
            schemaVersion: envelope.schemaVersion,
            actionId: crypto.randomUUID(),
            output,
          })
      : undefined;
  return React.createElement(loadedWidget.component, { input: envelope.input, meta, ...(onOutput && { onOutput }) });
}

export function MASWidgets({ widgets, sessionId, source }: { widgets: unknown; sessionId?: string; source?: WidgetMeta['source'] }) {
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
        if (seen.has(widget.key)) return null;
        seen.add(widget.key);
        return (
          <WidgetErrorBoundary key={`${widget.key}-${widget.envelope.widget}-${widget.envelope.schemaVersion}`}>
            <MASWidgetLoader widget={widget} sessionId={sessionId} source={source} />
          </WidgetErrorBoundary>
        );
      })}
    </>
  );
}
