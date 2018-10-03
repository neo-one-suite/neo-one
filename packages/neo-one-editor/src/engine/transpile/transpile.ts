import { transform, Transform } from 'sucrase';

// tslint:disable-next-line readonly-array
const TRANSFORMS: Transform[] = ['typescript', 'imports', 'jsx'];

export const transpile = (path: string, value: string) => {
  const result = transform(value, {
    transforms: TRANSFORMS,
    filePath: path,
  });

  return result.code;
};
