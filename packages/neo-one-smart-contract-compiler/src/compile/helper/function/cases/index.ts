import { bufferEquals } from './bufferEquals';
import { bufferFrom } from './bufferFrom';
import { consoleLog } from './consoleLog';
import { symbolFor } from './symbolFor';
import { SpecialCase } from './types';

export * from './types';

export const CASES: ReadonlyArray<SpecialCase> = [bufferFrom, bufferEquals, consoleLog, symbolFor];
