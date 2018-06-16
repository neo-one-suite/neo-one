import { Transform } from 'stream';

export class Throttle extends Transform {
  constructor(options: { readonly rate: number });
}
