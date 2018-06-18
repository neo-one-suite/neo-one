export class ScalingBloem {
  constructor(
    value: number,
    options: {
      initial_capacity: number;
      scaling: number;
    },
  );

  has(value: Buffer): boolean;
  add(value: Buffer): void;
}
