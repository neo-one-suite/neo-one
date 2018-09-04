import { upperCaseFirst } from '@neo-one/utils';
import { sanitizeName } from '../utils';

export const getSingleEventName = (name: string, eventName: string) =>
  `${name}${upperCaseFirst(sanitizeName(eventName))}Event`;
