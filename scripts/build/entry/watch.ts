import { watchJavascript } from '../common';

watchJavascript().catch((error) => {
  // tslint:disable-next-line no-console
  console.error(error);
  process.exit(1);
});
