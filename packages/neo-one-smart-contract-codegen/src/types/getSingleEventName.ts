import { upperCaseFirst } from '../utils';

export const getSingleEventName = (name: string, eventName: string) => `${name}${upperCaseFirst(eventName)}Event`;
