import { WriteStream } from 'fs';

export class Throttle extends WriteStream {
  constructor({ rate }: { rate: number });
}
