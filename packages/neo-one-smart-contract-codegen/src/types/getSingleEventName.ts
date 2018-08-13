import { sanitizeName, upperCaseFirst } from '../utils';

export const getSingleEventName = (name: string, eventName: string) =>
  `${name}${upperCaseFirst(sanitizeName(eventName))}Event`;
