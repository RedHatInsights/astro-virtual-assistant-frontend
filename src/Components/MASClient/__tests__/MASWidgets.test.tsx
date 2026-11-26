import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { getModule, getScalprum } from '@scalprum/core';
import * as debug from '../MASDebug';
import { MASWidgets } from '../MASWidgets';

jest.mock('@scalprum/core', () => ({ getModule: jest.fn(), getScalprum: jest.fn() }));

const packet = {
  key: 'hello-1',
  executionId: 'turn',
  invocationId: 'inv',
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
};
const contract = { widget: packet.envelope.widget, schemaVersion: packet.envelope.schemaVersion, outputSchema: { type: 'object' } };
const identity = { widget: packet.envelope.widget, schemaVersion: packet.envelope.schemaVersion };
const mockGetModule = getModule as jest.Mock;
const mockGetNamespace = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (getScalprum as jest.Mock).mockReturnValue({ pluginStore: { getExposedModule: mockGetNamespace } });
  mockGetNamespace.mockReset();
  mockGetNamespace.mockImplementation(async (scope, module) => ({ getContract: await mockGetModule(scope, module, 'getContract') }));
  jest.spyOn(debug, 'isMASDebugEnabled').mockReturnValue(false);
});
afterEach(() => jest.restoreAllMocks());

it('loads the module and validates the contract before rendering unchanged input', async () => {
  const Widget = jest.fn(({ input }: { input: typeof packet.envelope.input }) => (
    <span>
      {input.text} {input.runId}
    </span>
  ));
  mockGetModule.mockImplementation(async (_scope, _module, name) => (name === 'getContract' ? () => contract : Widget));
  render(<MASWidgets widgets={[{ ...packet, scope: 'evil', module: './evil', manifest: 'https://evil' }]} />);
  expect(await screen.findByText('Hello from MAS FooBar')).toBeInTheDocument();
  expect(mockGetModule.mock.calls).toEqual([
    ['frontendStarterApp', './HelloWorld', 'default'],
    ['frontendStarterApp', './HelloWorld', 'getContract'],
  ]);
  expect(Widget.mock.calls[0][0]).toEqual({ input: packet.envelope.input, meta: { ...identity, turnId: 'turn', instanceId: 'hello-1' } });
});

it.each([
  ['undefined contract export', undefined],
  ['null contract export', null],
  ['non-function contract', {}],
  ['null contract', () => null],
  [
    'throwing contract',
    () => {
      throw new Error('bad');
    },
  ],
  ['rejecting contract', () => Promise.reject(new Error('bad'))],
])('shows an inline error for %s without rendering the component', async (_description, result) => {
  const Widget = jest.fn(() => <span>Widget</span>);
  mockGetModule.mockResolvedValue(Widget);
  mockGetNamespace.mockResolvedValue({ getContract: result });
  render(
    <>
      <span>Answer remains</span>
      <MASWidgets widgets={[packet]} />
    </>
  );
  expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load widget');
  expect(screen.getByText('Answer remains')).toBeInTheDocument();
  expect(Widget).not.toHaveBeenCalled();
});

it.each([false, true])('reports a nested widget ID mismatch with debug=%s and isolates the failure', async (enabled) => {
  jest.spyOn(debug, 'isMASDebugEnabled').mockReturnValue(enabled);
  const nested = { ...packet, envelope: { ...packet.envelope, widget: 'frontendStarterApp.widgets/HelloWorld' } };
  const Widget = jest.fn(() => <span>Matching widget</span>);
  mockGetModule.mockResolvedValue(Widget);
  mockGetNamespace.mockResolvedValue({ getContract: () => ({ ...contract, schemaVersion: '2.0' }) });
  render(
    <>
      <span>Answer remains</span>
      <MASWidgets widgets={[nested]} />
    </>
  );
  const alert = await screen.findByRole('alert');
  if (enabled) {
    expect(alert).toHaveTextContent('Widget ID mismatch.');
    expect(alert).toHaveTextContent('Requested by message: frontendStarterApp.widgets/HelloWorld');
    expect(alert).toHaveTextContent('Returned by getContract(): frontendStarterApp.HelloWorld');
    expect(alert).not.toHaveTextContent('schema version mismatch');
  } else {
    expect(alert).toHaveTextContent('This widget doesn’t match the reply’s contract.');
    expect(alert).not.toHaveTextContent('frontendStarterApp');
  }
  expect(screen.getByText('Answer remains')).toBeInTheDocument();
  expect(Widget).not.toHaveBeenCalled();
});

it.each([false, true])('reports a schema version mismatch with debug=%s', async (enabled) => {
  jest.spyOn(debug, 'isMASDebugEnabled').mockReturnValue(enabled);
  mockGetModule.mockResolvedValue(() => <span>Widget</span>);
  mockGetNamespace.mockResolvedValue({ getContract: () => ({ ...contract, schemaVersion: '2.0' }) });
  render(<MASWidgets widgets={[packet]} />);
  const alert = await screen.findByRole('alert');
  if (enabled) {
    expect(alert).toHaveTextContent('Widget schema version mismatch.');
    expect(alert).toHaveTextContent('Requested by message: 1.0');
    expect(alert).toHaveTextContent('Returned by getContract(): 2.0');
  } else {
    expect(alert).toHaveTextContent('This widget doesn’t match the reply’s contract.');
    expect(alert).not.toHaveTextContent('2.0');
  }
  expect(screen.queryByText('Widget')).not.toBeInTheDocument();
});

it.each([false, true])('renders an absent contract read-only with debug=%s', async (enabled) => {
  jest.spyOn(debug, 'isMASDebugEnabled').mockReturnValue(enabled);
  const Widget = jest.fn<React.ReactElement, [{ input: typeof packet.envelope.input; onOutput?: (event: unknown) => void }]>(() => (
    <span>Read-only widget</span>
  ));
  const log = jest.spyOn(console, 'info').mockImplementation(() => undefined);
  mockGetModule.mockResolvedValue(Widget);
  mockGetNamespace.mockResolvedValue({ default: Widget });
  render(
    <>
      <span>Answer remains</span>
      <MASWidgets widgets={[packet]} sessionId="session" />
    </>
  );
  expect(await screen.findByText('Read-only widget')).toBeInTheDocument();
  expect(screen.getByText('Answer remains')).toBeInTheDocument();
  expect(Widget.mock.calls[0][0]).toEqual({
    input: packet.envelope.input,
    meta: { ...identity, sessionId: 'session', turnId: 'turn', instanceId: 'hello-1' },
  });
  expect(Object.prototype.hasOwnProperty.call(Widget.mock.calls[0][0], 'onOutput')).toBe(false);
  expect(log).not.toHaveBeenCalled();
});

it.each([
  'https://evil/Widget',
  'evil',
  'app./Widget',
  'app.Widget.extra',
  '../Widget',
  'app.Widget/',
  'app.Widget//Other',
  'app.Widget/../Other',
  'app.Widget/./Other',
  'app.Widget/https://evil',
  'app.Widget/2invalid',
])('rejects unsafe widget ID %s', async (widget) => {
  render(<MASWidgets widgets={[{ ...packet, envelope: { ...packet.envelope, widget } }]} />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load widget');
  expect(mockGetModule).not.toHaveBeenCalled();
});

it('loads nested exposure paths and checks the full widget ID', async () => {
  const widget = { ...packet, envelope: { ...packet.envelope, widget: 'frontendStarterApp.widgets/HelloWorld' } };
  mockGetModule.mockImplementation(async (_scope, _module, name) =>
    name === 'getContract' ? () => ({ ...contract, widget: widget.envelope.widget }) : () => <span>Nested widget</span>
  );
  const { rerender } = render(<MASWidgets widgets={[widget]} />);
  expect(await screen.findByText('Nested widget')).toBeInTheDocument();
  expect(mockGetModule.mock.calls).toEqual([
    ['frontendStarterApp', './widgets/HelloWorld', 'default'],
    ['frontendStarterApp', './widgets/HelloWorld', 'getContract'],
  ]);
  mockGetModule.mockImplementation(async (_scope, _module, name) => (name === 'getContract' ? () => contract : () => <span>Nested widget</span>));
  rerender(<MASWidgets widgets={[{ ...widget, key: 'other' }]} />);
  expect(await screen.findByRole('alert')).toHaveTextContent('This widget doesn’t match the reply’s contract.');
});

it('reports missing exports and registry failures', async () => {
  mockGetModule.mockImplementation(async (_scope, _module, name) => (name === 'getContract' ? () => contract : undefined));
  const { rerender } = render(<MASWidgets widgets={[packet]} />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load widget');
  mockGetModule.mockRejectedValue(new Error('scope absent'));
  rerender(<MASWidgets widgets={[{ ...packet, key: 'two' }]} />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load widget');
});

it('does not mistake namespace load failures for an absent contract', async () => {
  mockGetModule.mockResolvedValue(() => <span>Widget</span>);
  mockGetNamespace.mockRejectedValue(new Error('module load failed'));
  render(
    <>
      <span>Answer remains</span>
      <MASWidgets widgets={[packet]} />
    </>
  );
  expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load widget');
  expect(screen.getByText('Answer remains')).toBeInTheDocument();
  expect(screen.queryByText('Widget')).not.toBeInTheDocument();
});

it('rejects a throwing contract export getter', async () => {
  mockGetModule.mockResolvedValue(() => <span>Widget</span>);
  mockGetNamespace.mockResolvedValue({
    get getContract() {
      throw new Error('broken export');
    },
  });
  render(<MASWidgets widgets={[packet]} />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load widget');
});

it('accepts an asynchronous matching contract', async () => {
  const Widget = jest.fn<React.ReactElement, [{ input: typeof packet.envelope.input; onOutput?: (event: unknown) => void }]>(() => (
    <span>Interactive widget</span>
  ));
  mockGetModule.mockResolvedValue(Widget);
  mockGetNamespace.mockResolvedValue({ getContract: async () => contract });
  jest.spyOn(debug, 'isMASDebugEnabled').mockReturnValue(true);
  render(<MASWidgets widgets={[packet]} source="debug" />);
  expect(await screen.findByText('Interactive widget')).toBeInTheDocument();
  expect(Widget.mock.calls[0][0]).toEqual({
    input: packet.envelope.input,
    meta: { ...identity, turnId: 'turn', instanceId: 'hello-1', source: 'debug' },
    onOutput: expect.any(Function),
  });
});

it.each([undefined, null])('omits debug output when outputSchema is %s', async (outputSchema) => {
  jest.spyOn(debug, 'isMASDebugEnabled').mockReturnValue(true);
  const Widget = jest.fn<React.ReactElement, [{ input: unknown; meta: unknown }]>(() => <span>No output</span>);
  mockGetModule.mockResolvedValue(Widget);
  mockGetNamespace.mockResolvedValue({ getContract: () => ({ ...identity, outputSchema }) });
  render(<MASWidgets widgets={[packet]} source="debug" />);
  expect(await screen.findByText('No output')).toBeInTheDocument();
  expect(Widget.mock.calls[0][0]).toEqual({
    input: packet.envelope.input,
    meta: { ...identity, turnId: 'turn', instanceId: 'hello-1', source: 'debug' },
  });
});

it('does not give live widgets a debug output callback on a stage host', async () => {
  jest.spyOn(debug, 'isMASDebugEnabled').mockReturnValue(true);
  const Widget = jest.fn<React.ReactElement, [{ input: unknown; meta: unknown }]>(() => <span>Live widget</span>);
  mockGetModule.mockResolvedValue(Widget);
  mockGetNamespace.mockResolvedValue({ getContract: () => contract });
  render(<MASWidgets widgets={[packet]} />);
  expect(await screen.findByText('Live widget')).toBeInTheDocument();
  expect(Widget.mock.calls[0][0]).toEqual({ input: packet.envelope.input, meta: { ...identity, turnId: 'turn', instanceId: 'hello-1' } });
});

it('isolates widget render failures', async () => {
  const log = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  mockGetModule.mockImplementation(async (_scope, _module, name) =>
    name === 'getContract'
      ? () => contract
      : () => {
          throw new Error('render');
        }
  );
  render(
    <>
      <span>Answer remains</span>
      <MASWidgets widgets={[packet]} />
    </>
  );
  expect(await screen.findByRole('alert')).toHaveTextContent('Unable to render widget');
  expect(screen.getByText('Answer remains')).toBeInTheDocument();
  log.mockRestore();
});

it('passes one callback for both actions only in debug mode and captures each render origin', async () => {
  let originalCallback: ((event: unknown) => void) | undefined;
  const metas: unknown[] = [];
  const Widget = ({ onOutput, meta }: { onOutput?: (event: unknown) => void; meta: unknown }) => {
    metas.push(meta);
    if (onOutput && !originalCallback) originalCallback = onOutput;
    return (
      <>
        <button onClick={() => onOutput?.({ type: 'approve' })}>{onOutput ? 'Approve' : 'Output absent'}</button>
        <button onClick={() => onOutput?.({ type: 'reject' })}>Reject</button>
      </>
    );
  };
  const log = jest.spyOn(console, 'info').mockImplementation(() => undefined);
  mockGetModule.mockImplementation(async (_scope, _module, name) => (name === 'getContract' ? () => contract : Widget));
  const { unmount } = render(<MASWidgets widgets={[packet]} />);
  fireEvent.click(await screen.findByText('Output absent'));
  expect(log).not.toHaveBeenCalled();
  unmount();
  jest.spyOn(debug, 'isMASDebugEnabled').mockReturnValue(true);
  const spoofed = {
    ...packet,
    executionId: 'turn-one',
    envelope: {
      ...packet.envelope,
      input: { sessionId: 'spoof', turnId: 'spoof', instanceId: 'spoof', source: 'live', meta: 'spoof', onOutput: 'spoof' },
    },
  };
  const { rerender } = render(<MASWidgets widgets={[spoofed]} sessionId="session-one" source="debug" />);
  fireEvent.click(await screen.findByText('Approve'));
  fireEvent.click(screen.getByText('Reject'));
  rerender(<MASWidgets widgets={[{ ...spoofed, executionId: 'turn-two' }]} sessionId="session-two" source="debug" />);
  originalCallback?.({ type: 'approve' });
  fireEvent.click(screen.getByText('Reject'));
  const calls = log.mock.calls.map(([, payload]) => payload);
  expect(log.mock.calls.map(([message]) => message)).toEqual(Array(4).fill('[Astro → MAS client] Would send widget action'));
  expect(calls).toEqual([
    {
      ...identity,
      sessionId: 'session-one',
      turnId: 'turn-one',
      instanceId: packet.key,
      actionId: expect.any(String),
      output: { type: 'approve' },
    },
    {
      ...identity,
      sessionId: 'session-one',
      turnId: 'turn-one',
      instanceId: packet.key,
      actionId: expect.any(String),
      output: { type: 'reject' },
    },
    {
      ...identity,
      sessionId: 'session-one',
      turnId: 'turn-one',
      instanceId: packet.key,
      actionId: expect.any(String),
      output: { type: 'approve' },
    },
    {
      ...identity,
      sessionId: 'session-two',
      turnId: 'turn-two',
      instanceId: packet.key,
      actionId: expect.any(String),
      output: { type: 'reject' },
    },
  ]);
  expect(new Set(calls.map(({ actionId }) => actionId)).size).toBe(4);
  expect(metas).toContainEqual({ ...identity, sessionId: 'session-one', turnId: 'turn-one', instanceId: 'hello-1', source: 'debug' });
  expect(metas).toContainEqual({ ...identity, sessionId: 'session-two', turnId: 'turn-two', instanceId: 'hello-1', source: 'debug' });
  expect(metas.every((meta) => !Object.prototype.hasOwnProperty.call(meta, 'actionId'))).toBe(true);
});

it('deduplicates replays within each turn but permits the same instance in a different turn', async () => {
  mockGetModule.mockImplementation(async (_scope, _module, name) => (name === 'getContract' ? () => contract : () => <span>Rendered widget</span>));
  const { rerender } = render(
    <>
      <MASWidgets widgets={[packet]} />
      <MASWidgets widgets={[packet]} />
    </>
  );
  expect(await screen.findAllByText('Rendered widget')).toHaveLength(2);
  rerender(
    <>
      <MASWidgets widgets={[packet, { ...packet }]} />
      <MASWidgets widgets={[packet]} />
    </>
  );
  await waitFor(() => expect(screen.getAllByText('Rendered widget')).toHaveLength(2));
  expect(mockGetModule).toHaveBeenCalledTimes(4);
});

it('passes structurally valid input without validating provider fields', async () => {
  const Widget = ({ input }: { input: Record<string, unknown> }) => <span>{String(input.runId)}</span>;
  mockGetModule.mockImplementation(async (_scope, _module, name) => (name === 'getContract' ? () => contract : Widget));
  render(
    <MASWidgets
      widgets={[
        { ...packet, envelope: { ...packet.envelope, input: { runId: 42 } } },
        null,
        { ...packet, envelope: { ...packet.envelope, input: null } },
      ]}
    />
  );
  expect(await screen.findByText('42')).toBeInTheDocument();
  expect(screen.getAllByRole('alert')).toHaveLength(2);
});

it('loads another configured widget without a catalog and does not promote input callbacks to host props', async () => {
  const other = { ...packet, key: 'other', envelope: { ...packet.envelope, widget: 'otherApp.OtherWidget', input: { onOutput: 'untrusted' } } };
  const Widget = jest.fn<React.ReactElement, [{ input: Record<string, unknown> }]>(() => <span>Other widget</span>);
  mockGetModule.mockImplementation(async (_scope, _module, name) =>
    name === 'getContract' ? () => ({ widget: other.envelope.widget, schemaVersion: other.envelope.schemaVersion }) : Widget
  );
  render(<MASWidgets widgets={[other]} />);
  expect(await screen.findByText('Other widget')).toBeInTheDocument();
  expect(mockGetModule).toHaveBeenCalledWith('otherApp', './OtherWidget', 'getContract');
  expect(mockGetModule).toHaveBeenCalledWith('otherApp', './OtherWidget', 'default');
  expect(Widget.mock.calls[0][0]).toEqual({
    input: { onOutput: 'untrusted' },
    meta: { widget: other.envelope.widget, schemaVersion: other.envelope.schemaVersion, turnId: 'turn', instanceId: 'other' },
  });
});
