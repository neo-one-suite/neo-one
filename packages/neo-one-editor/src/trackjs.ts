if (process.env.NODE_ENV === 'production') {
  // tslint:disable-next-line no-any no-object-mutation
  (self as any)._trackJs = {
    token: 'ccff2c276a494f0b94462cdbf6bf4518',
    application: 'neo-one',
  };
  // tslint:disable-next-line
  const trackJs = require('trackjs');
  trackJs.addMetadata('type', 'worker');
}
