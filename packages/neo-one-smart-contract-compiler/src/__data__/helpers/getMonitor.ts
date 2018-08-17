import { DefaultMonitor, Monitor } from '@neo-one/monitor';

// tslint:disable-next-line no-let
let monitor: Monitor | undefined;
export const getMonitor = (): Monitor => {
  if (monitor === undefined) {
    monitor = DefaultMonitor.create({ service: 'test' });
  }

  return monitor;
};
