import React, { useMemo } from 'react';
import { ComponentPreview, ComponentPreviewTarget } from './ComponentPreview';

export const MAS_DEBUG_MESSAGE_EVENT = 'mas-debug-message';

export interface MASWidget {
  type: 'widget';
  widget: string;
  schemaVersion: string;
  instanceId: string;
  props: Record<string, unknown>;
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

// Coordinates come exclusively from this trusted catalog, never from the response.
function resolveWidget(widget: MASWidget): ComponentPreviewTarget | undefined {
  if (widget.widget === 'starter.hello-world' && widget.schemaVersion === '1.0') {
    const { text, runId } = widget.props;
    if (typeof runId !== 'string' || (text !== undefined && typeof text !== 'string')) return undefined;
    return { scope: 'frontendStarterApp', module: './HelloWorld', props: { runId, ...(text !== undefined && { text }) } };
  }
  return undefined;
}

function MASWidgetEntry({ widget }: { widget: MASWidget }) {
  const target = useMemo(() => resolveWidget(widget), [widget]);
  return target ? <ComponentPreview target={target} /> : null;
}

export function MASWidgets({ widgets }: { widgets: unknown }) {
  if (!Array.isArray(widgets)) return null;
  return (
    <>
      {widgets.map((widget, index) => {
        if (!isMASWidget(widget)) return null;
        return <MASWidgetEntry key={`${widget.instanceId}-${index}`} widget={widget} />;
      })}
    </>
  );
}
