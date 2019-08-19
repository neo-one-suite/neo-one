const net = require('net');

// returns `true` if localhost:port is already listening.
const getDeferred = () => {
  var resolve,
    reject,
    promise = new Promise(function(res, rej) {
      resolve = res;
      reject = rej;
    });

  return {
    resolve: resolve,
    reject: reject,
    promise: promise,
  };
};

function checkPort(port) {
  let deferred = getDeferred();
  let client;

  const cleanup = () => {
    client.removeAllListeners('connect');
    client.removeAllListeners('error');
    client.end();
    client.destroy();
    client.unref();
  };

  const onConnect = () => {
    deferred.resolve(true);
    cleanup();
  };

  const onError = (error) => {
    if (error.code !== 'ECONNREFUSED') {
      deferred.reject(error);
    } else {
      deferred.resolve(false);
    }
    cleanup();
  };

  client = new net.Socket();
  client.once('connect', onConnect);
  client.once('error', onError);
  client.connect({ port, host: '127.0.0.1' });

  return deferred.promise;
}

module.exports = checkPort;
module.exports.default = checkPort;
