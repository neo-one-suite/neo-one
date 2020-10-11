declare module 'lz4' {
  export const decodeBlock: (bytes: Buffer, target: Buffer, startId?: number, endId?: number) => number;
  export const encodeBlock: (bytes: Buffer, target: Buffer, startId?: number, endId?: number) => number;
  export const encodeBound: (size: number) => number;
}
