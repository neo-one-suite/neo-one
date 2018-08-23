declare module 'app-root-dir' {
  export const get: () => string;
  export const set: (dir: string) => void;
}
