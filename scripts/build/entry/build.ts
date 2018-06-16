import { buildJavascript } from '../common';

buildJavascript()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    // tslint:disable-next-line no-console
    console.error(error);
    process.exit(1);
  });
