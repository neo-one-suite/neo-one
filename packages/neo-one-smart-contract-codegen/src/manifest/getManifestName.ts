import { lowerCaseFirst } from '../utils';

export const getManifestName = (name: string) => `${lowerCaseFirst(name)}Manifest`;
