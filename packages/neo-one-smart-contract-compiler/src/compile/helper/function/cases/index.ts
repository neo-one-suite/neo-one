import { bufferEquals } from './bufferEquals';
import { bufferFrom } from './bufferFrom';
import { symbolFor } from './symbolFor';
import { SpecialCase } from './types';

export * from './types';

export const CASES: ReadonlyArray<SpecialCase> = [bufferFrom, bufferEquals, symbolFor];
