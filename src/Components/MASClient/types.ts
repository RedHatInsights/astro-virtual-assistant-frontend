export type WidgetMeta = Readonly<{
  widget: string;
  schemaVersion: string;
  sessionId?: string;
  turnId?: string;
  instanceId: string;
  source?: 'debug' | 'live' | 'history';
}>;
