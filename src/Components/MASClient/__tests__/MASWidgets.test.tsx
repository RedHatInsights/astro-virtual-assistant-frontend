import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { getModule } from '@scalprum/core';
import * as preview from '../ComponentPreview';
import { MASWidgets } from '../MASWidgets';

jest.mock('@scalprum/core', () => ({ getModule: jest.fn() }));

const packet = {
  type: 'widget',
  widget: 'frontendStarterApp.HelloWorld',
  schemaVersion: '1.0',
  instanceId: 'hello-1',
  props: { runId: 'FooBar', text: 'Hello from MAS' },
};
const contract = { widget: packet.widget, schemaVersion: packet.schemaVersion };
const mockGetModule = getModule as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(preview, 'isComponentPreviewEnabled').mockReturnValue(false);
});
afterEach(() => jest.restoreAllMocks());

it('loads the contract then renders the default export with unchanged input', async () => {
  const Widget = jest.fn(({ input }: { input: typeof packet.props }) => (
    <span>
      {input.text} {input.runId}
    </span>
  ));
  mockGetModule.mockImplementation(async (_scope, _module, name) => (name === 'getContract' ? () => contract : Widget));
  render(<MASWidgets widgets={[{ ...packet, scope: 'evil', module: './evil', manifest: 'https://evil' }]} />);
  expect(await screen.findByText('Hello from MAS FooBar')).toBeInTheDocument();
  expect(mockGetModule.mock.calls).toEqual([
    ['frontendStarterApp', './HelloWorld', 'getContract'],
    ['frontendStarterApp', './HelloWorld', 'default'],
  ]);
  expect(Widget.mock.calls[0][0]).toEqual({ input: packet.props });
});

it.each([
  ['missing contract', undefined],
  ['non-function contract', {}],
  ['wrong widget', () => ({ ...contract, widget: 'other.Widget' })],
  ['wrong version', () => ({ ...contract, schemaVersion: '2.0' })],
  ['null contract', () => null],
  [
    'throwing contract',
    () => {
      throw new Error('bad');
    },
  ],
])('shows an inline error for %s without loading the component', async (_description, result) => {
  mockGetModule.mockResolvedValue(result);
  render(
    <>
      <span>Answer remains</span>
      <MASWidgets widgets={[packet]} />
    </>
  );
  expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load widget');
  expect(screen.getByText('Answer remains')).toBeInTheDocument();
  expect(mockGetModule).toHaveBeenCalledTimes(1);
});

it.each(['https://evil/Widget', 'evil', 'app./Widget', 'app.Widget.extra', '../Widget', 'app.Widget/other'])(
  'rejects unsafe widget ID %s',
  async (widget) => {
    render(<MASWidgets widgets={[{ ...packet, widget }]} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load widget');
    expect(mockGetModule).not.toHaveBeenCalled();
  }
);

it('reports missing exports and registry failures', async () => {
  mockGetModule.mockImplementation(async (_scope, _module, name) => (name === 'getContract' ? () => contract : undefined));
  const { rerender } = render(<MASWidgets widgets={[packet]} />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load widget');
  mockGetModule.mockRejectedValue(new Error('scope absent'));
  rerender(<MASWidgets widgets={[{ ...packet, instanceId: 'two' }]} />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load widget');
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

it('passes output only in local debug mode and logs the provider event without processing it', async () => {
  const Widget = ({ onOutput }: { onOutput?: (event: unknown) => void }) => (
    <button onClick={() => onOutput?.({ action: 'done' })}>{onOutput ? 'Output enabled' : 'Output absent'}</button>
  );
  const log = jest.spyOn(console, 'info').mockImplementation(() => undefined);
  mockGetModule.mockImplementation(async (_scope, _module, name) => (name === 'getContract' ? () => contract : Widget));
  const { unmount } = render(<MASWidgets widgets={[packet]} />);
  fireEvent.click(await screen.findByText('Output absent'));
  expect(log).not.toHaveBeenCalled();
  unmount();
  jest.spyOn(preview, 'isComponentPreviewEnabled').mockReturnValue(true);
  render(<MASWidgets widgets={[packet]} />);
  fireEvent.click(await screen.findByText('Output enabled'));
  expect(log).toHaveBeenCalledWith('MAS widget output', { widget: packet.widget, instanceId: packet.instanceId, event: { action: 'done' } });
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
  render(<MASWidgets widgets={[{ ...packet, props: { runId: 42 } }, null, { ...packet, props: null }]} />);
  expect(await screen.findByText('42')).toBeInTheDocument();
  expect(screen.getAllByRole('alert')).toHaveLength(2);
});

it('loads another configured widget without a catalog and does not promote input callbacks to host props', async () => {
  const other = { ...packet, widget: 'otherApp.OtherWidget', instanceId: 'other', props: { onOutput: 'untrusted' } };
  const Widget = jest.fn<React.ReactElement, [{ input: Record<string, unknown> }]>(() => <span>Other widget</span>);
  mockGetModule.mockImplementation(async (_scope, _module, name) =>
    name === 'getContract' ? () => ({ widget: other.widget, schemaVersion: other.schemaVersion }) : Widget
  );
  render(<MASWidgets widgets={[other]} />);
  expect(await screen.findByText('Other widget')).toBeInTheDocument();
  expect(mockGetModule).toHaveBeenCalledWith('otherApp', './OtherWidget', 'getContract');
  expect(mockGetModule).toHaveBeenCalledWith('otherApp', './OtherWidget', 'default');
  expect(Widget.mock.calls[0][0]).toEqual({ input: { onOutput: 'untrusted' } });
});
