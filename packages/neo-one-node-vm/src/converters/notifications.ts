import { common } from '@neo-one/client-common';
import { Notification } from '@neo-one/node-core';
import { parseStackItems, StackItemReturn } from './stackItems';

export interface NotificationReturn {
  readonly scriptContainer: Buffer;
  readonly scriptHash: Buffer;
  readonly eventName: string;
  readonly state: readonly StackItemReturn[];
}

const parseNotification = (notification: NotificationReturn): Notification => ({
  scriptContainer: notification.scriptContainer,
  scriptHash: common.asUInt160(notification.scriptHash),
  eventName: notification.eventName,
  state: parseStackItems(notification.state),
});

export const parseNotifications = (notifications: readonly NotificationReturn[]): readonly Notification[] =>
  notifications.map(parseNotification);
