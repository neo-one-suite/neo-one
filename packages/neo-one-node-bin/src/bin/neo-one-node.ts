// tslint:disable-next-line:no-implicit-dependencies
import { startNode } from '@neo-one/node-bin';

startNode().catch((error) => {
  console.error(error);
});
