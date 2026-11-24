import React, { useEffect, useState } from 'react';
import { getModule } from '@scalprum/core';

export const MAS_PREVIEW_EVENT = 'mas-component-preview';
export const MAS_PREVIEW_QUERY = 'masComponentPreview';

export interface ComponentPreviewTarget {
  scope: string;
  module: string;
  importName?: string;
  props: Record<string, unknown>;
}

export function isComponentPreviewEnabled(): boolean {
  return (
    process.env.NODE_ENV === 'development' &&
    ['localhost', '127.0.0.1', 'stage.foo.redhat.com'].includes(window.location.hostname) &&
    new URLSearchParams(window.location.search).get(MAS_PREVIEW_QUERY) === '1'
  );
}

export function parsePreviewTarget(value: unknown): ComponentPreviewTarget {
  if (!value || typeof value !== 'object') throw new Error('Expected a preview target object');
  const { scope, module, importName, props = '{}' } = value as Record<string, unknown>;
  if (typeof scope !== 'string' || !scope.trim() || typeof module !== 'string' || !module.trim()) {
    throw new Error('Scope and module are required');
  }
  if (importName !== undefined && typeof importName !== 'string') throw new Error('importName must be a string');
  if (typeof props !== 'string') throw new Error('Props must be a JSON object string');
  const parsed: unknown = JSON.parse(props);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Props must be a JSON object');
  return { scope: scope.trim(), module: module.trim(), importName: importName?.trim() || undefined, props: parsed as Record<string, unknown> };
}

class PreviewErrorBoundary extends React.Component<React.PropsWithChildren, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? <span role="alert">Unable to render preview component.</span> : this.props.children;
  }
}

function PreviewLoader({ target }: { target: ComponentPreviewTarget }) {
  const [component, setComponent] = useState<React.ComponentType<Record<string, unknown>>>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let mounted = true;
    getModule<React.ComponentType<Record<string, unknown>>>(target.scope, target.module, target.importName || 'default')
      .then((loaded) => {
        if (!loaded) throw new Error('Export not found');
        if (mounted) setComponent(() => loaded);
      })
      .catch(() => {
        if (mounted) setFailed(true);
      });
    return () => {
      mounted = false;
    };
  }, [target]);

  if (failed) return <span role="alert">Unable to load preview component.</span>;
  if (!component) return <span>Loading preview component...</span>;
  return React.createElement(component, target.props);
}

export function ComponentPreview({ target }: { target: ComponentPreviewTarget }) {
  return (
    <PreviewErrorBoundary>
      <PreviewLoader target={target} />
    </PreviewErrorBoundary>
  );
}
