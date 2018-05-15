import { DefaultMonitor, Monitor } from '@neo-one/monitor';

let monitor: Monitor | undefined;
export const getMonitor = (): Monitor => {
  if (monitor == null) {
    monitor = DefaultMonitor.create({ service: 'test' });
  }

  return monitor;
};
