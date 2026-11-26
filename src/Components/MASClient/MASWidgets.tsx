import React, { useEffect, useState } from 'react';
import { getModule, getScalprum } from '@scalprum/core';
import { isMASDebugEnabled } from './MASDebug';
import { WidgetMeta } from './types';

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
  meta: WidgetMeta;
  onOutput?: (event: unknown) => void;
}

type WidgetLoadError = { kind: 'load' } | { kind: 'mismatch'; field: 'widget' | 'schemaVersion'; requested: string; returned: string };

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

export function parseDebugMessage(value: unknown): { answer: string; turnId: string; widgets: MASWidget[] } {
  if (
    !isRecord(value) ||
    typeof value.answer !== 'string' ||
    typeof value.turnId !== 'string' ||
    !value.turnId.trim() ||
    !Array.isArray(value.widgets) ||
    !value.widgets.every(isMASWidget)
  ) {
    throw new Error('Expected an answer, turnId and an array of widget descriptors');
  }
  return { answer: value.answer, turnId: value.turnId, widgets: value.widgets };
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

function MASWidgetLoader({
  widget,
  sessionId,
  turnId,
  source,
}: {
  widget: MASWidget;
  sessionId?: string;
  turnId?: string;
  source?: WidgetMeta['source'];
}) {
  const [loadedWidget, setLoadedWidget] = useState<{ component: React.ComponentType<WidgetProps>; interactive: boolean }>();
  const [error, setError] = useState<WidgetLoadError>();

  useEffect(() => {
    let mounted = true;
    setLoadedWidget(undefined);
    setError(undefined);
    const load = async () => {
      const target = resolveWidgetId(widget.widget);
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
        if (contract.widget !== widget.widget) {
          if (mounted) setError({ kind: 'mismatch', field: 'widget', requested: widget.widget, returned: contract.widget });
          return;
        }
        if (typeof contract.schemaVersion !== 'string') throw new Error('Invalid widget contract');
        if (contract.schemaVersion !== widget.schemaVersion) {
          if (mounted) setError({ kind: 'mismatch', field: 'schemaVersion', requested: widget.schemaVersion, returned: contract.schemaVersion });
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
  }, [widget.widget, widget.schemaVersion]);

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
  const instanceId = widget.instanceId;
  const meta: WidgetMeta = {
    widget: widget.widget,
    schemaVersion: widget.schemaVersion,
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
            widget: widget.widget,
            schemaVersion: widget.schemaVersion,
            actionId: crypto.randomUUID(),
            output,
          })
      : undefined;
  return React.createElement(loadedWidget.component, { input: widget.props, meta, ...(onOutput && { onOutput }) });
}

export function MASWidgets({
  widgets,
  sessionId,
  turnId,
  source,
}: {
  widgets: unknown;
  sessionId?: string;
  turnId?: string;
  source?: WidgetMeta['source'];
}) {
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
            <MASWidgetLoader widget={widget} sessionId={sessionId} turnId={turnId} source={source} />
          </WidgetErrorBoundary>
        );
      })}
    </>
  );
}
