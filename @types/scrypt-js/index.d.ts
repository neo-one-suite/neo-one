export default function(
  value: Buffer,
  salt: Buffer,
  N: number,
  r: number,
  p: number,
  dklen: number,
  callback: (error: Error | undefined, progress: number, key: Array<number> | undefined) => void,
): void;
