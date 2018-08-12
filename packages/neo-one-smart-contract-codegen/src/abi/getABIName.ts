import { lowerCaseFirst } from '../utils';

export const getABIName = (name: string) => `${lowerCaseFirst(name)}ABI`;
