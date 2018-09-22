import { ABIEvent } from '@neo-one/client-common';
import { toTypeScriptType } from '../utils';
import { getSingleEventName } from './getSingleEventName';

export const genEvent = (name: string, event: ABIEvent): string => {
  const eventName = getSingleEventName(name, event.name);
  const eventNameParameters = `${eventName}Parameters`;

  return `export interface ${eventNameParameters} {
  ${event.parameters
    .map((param) => `readonly ${param.name}: ${toTypeScriptType(param, { isParameter: true })};`)
    .join('\n  ')}
}
export interface ${eventName} extends Event<'${event.name}', ${eventNameParameters}> {}`;
};
