export type WidgetMeta = Readonly<{
  sessionId?: string;
  turnId?: string;
  instanceId: string;
  source?: 'debug' | 'live' | 'history';
}>;
