// tslint:disable-next-line export-name
export const normalizePath = (path: string) => {
  const result = path === '/' ? path : path.endsWith('/') ? path.slice(0, -1) : path;

  return result.startsWith('/') ? result : `/${result}`;
};
