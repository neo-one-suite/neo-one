import { upperCaseFirst } from '@neo-one/utils';

export const getSetterName = (name: string) => `set${upperCaseFirst(name)}`;
