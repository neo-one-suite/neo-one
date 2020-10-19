import { common, NotificationJSON } from '@neo-one/client-common';
import { Notification } from '../Notification';
// import { deserializeScriptContainer, DeserializeWireContext } from '../Serializable';
import { stackItemToJSON } from '../StackItems';

export const notificationToJSON = (notification: Notification): NotificationJSON => ({
  // scriptcontainer: {
  //   type: notification.scriptContainer.type,
  //   container: deserializeScriptContainer(notification.scriptContainer, context),
  // },
  scripthash: common.uInt160ToString(notification.scriptHash),
  eventname: notification.eventName,
  state: notification.state.map((s) => stackItemToJSON(s, undefined)),
});
