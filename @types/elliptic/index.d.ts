declare class EC {
  constructor(curve: 'p256');
}

export type KeyPair = any;

export const ec: typeof EC;
