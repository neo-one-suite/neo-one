import { Verify } from 'crypto';

interface ECKeyOptions {
  crv: 'P-256';
  publicKey: Buffer;
}
export default class ECKey {
  constructor(options: ECKeyOptions);
  createVerify(alg: 'SHA256'): Verify;
}
