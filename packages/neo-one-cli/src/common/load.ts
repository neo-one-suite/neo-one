import { register } from 'ts-node';

const load = async (path: string) => {
  const value = await import(path);

  return value.default === undefined ? value : value.default;
};

export const loadJS = async (path: string) => {
  // @ts-ignore
  await import('@babel/register');

  return load(path);
};

export const loadTS = async (path: string) => {
  register();

  return load(path);
};
