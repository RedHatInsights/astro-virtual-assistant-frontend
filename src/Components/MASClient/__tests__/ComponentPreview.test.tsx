import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { getModule } from '@scalprum/core';
import { ComponentPreview, isComponentPreviewEnabled, parsePreviewTarget } from '../ComponentPreview';

jest.mock('@scalprum/core', () => ({ getModule: jest.fn() }));

describe('local component preview', () => {
  const target = { scope: 'test', module: './Widget', props: { label: 'first' } };

  it('validates JSON props and target fields', () => {
    expect(parsePreviewTarget({ scope: ' test ', module: './Widget', importName: ' Other ', props: '{"label":"hello"}' })).toEqual({
      scope: 'test',
      module: './Widget',
      importName: 'Other',
      props: { label: 'hello' },
    });
    for (const value of [
      { scope: '', module: './Widget' },
      { scope: 'a', module: 'b', props: '[]' },
      { scope: 'a', module: 'b', props: '{' },
    ]) {
      expect(() => parsePreviewTarget(value)).toThrow();
    }
  });

  it('is disabled outside a development build even on localhost with the opt-in', () => {
    window.history.replaceState({}, '', '/?masComponentPreview=1');
    jest.replaceProperty(process, 'env', { ...process.env, NODE_ENV: 'production' });
    expect(isComponentPreviewEnabled()).toBe(false);
    jest.restoreAllMocks();
    window.history.replaceState({}, '', '/');
  });

  it('requires explicit opt-in on a development host', () => {
    jest.replaceProperty(process, 'env', { ...process.env, NODE_ENV: 'development' });
    window.history.replaceState({}, '', '/');
    expect(isComponentPreviewEnabled()).toBe(false);
    window.history.replaceState({}, '', '/?masComponentPreview=1');
    expect(isComponentPreviewEnabled()).toBe(true);
    jest.restoreAllMocks();
    window.history.replaceState({}, '', '/');
  });

  it('loads named and default exports independently and isolates a bad target', async () => {
    const mockGetModule = getModule as jest.Mock;
    mockGetModule.mockImplementation(async (_scope, module, name) => {
      if (module === './bad') throw new Error('missing');
      return name === 'Other'
        ? ({ label }: { label: string }) => <div>Other: {label}</div>
        : ({ label }: { label: string }) => <div>Default: {label}</div>;
    });
    render(
      <>
        <ComponentPreview target={target} />
        <ComponentPreview target={{ ...target, module: './bad' }} />
        <ComponentPreview target={{ ...target, importName: 'Other', props: { label: 'last' } }} />
      </>
    );
    expect(await screen.findByText('Default: first')).toBeInTheDocument();
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load');
    expect(await screen.findByText('Other: last')).toBeInTheDocument();
    await waitFor(() => expect(mockGetModule).toHaveBeenCalledWith('test', './Widget', 'Other'));
  });

  it('handles a missing export without affecting other replies', async () => {
    (getModule as jest.Mock).mockResolvedValue(undefined);
    render(<ComponentPreview target={target} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load');
  });

  it('isolates an exception thrown by a loaded component', async () => {
    const errorLog = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    (getModule as jest.Mock).mockResolvedValue(() => {
      throw new Error('broken component');
    });
    render(<ComponentPreview target={target} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to render');
    errorLog.mockRestore();
  });
});
