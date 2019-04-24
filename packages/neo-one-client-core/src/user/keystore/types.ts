import { PublicKeyString } from '@neo-one/client-common';

export interface HDStore<Identifier> {
  readonly getPublicKey: (account: Identifier) => Promise<PublicKeyString>;
  readonly sign: (options: { readonly message: Buffer; readonly account: Identifier }) => Promise<Buffer>;
  readonly close: () => Promise<void>;
}
