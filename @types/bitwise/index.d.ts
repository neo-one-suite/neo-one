declare const bitwise: {
  byte: {
    read: (value: number) => number[];
  };
  buffer: {
    create: (value: number[]) => Buffer;
    and: (a: Buffer, b: Buffer) => Buffer;
    or: (a: Buffer, b: Buffer) => Buffer;
    xor: (a: Buffer, b: Buffer) => Buffer;
    not: (value: Buffer) => Buffer;
  };
};

export default bitwise;
