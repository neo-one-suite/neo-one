import { MESSAGE } from 'triple-beam';
import { transports } from 'winston';

const noop = () => {
  // do nothing
};

// tslint:disable-next-line no-object-mutation no-any
transports.File.prototype.log = function(info: any, callbackIn: any) {
  if (this.nexts == undefined) {
    // tslint:disable-next-line no-object-mutation
    this.nexts = [];
  }
  const callback = callbackIn === undefined ? noop : callbackIn;

  //
  // Remark: (jcrugzz) What is necessary about this callback(null, true) now
  // when thinking about 3.x? Should silent be handled in the base
  // TransportStream _write method?
  //
  if (this.silent) {
    callback();

    return true;
  }

  //
  // Grab the raw string and append the expected EOL
  //
  // tslint:disable-next-line no-this-assignment
  const self = this;
  const output = info[MESSAGE] + this.eol;

  //
  // This gets called too early and does not depict when data has been flushed
  // to disk like I want it to
  //
  function logged() {
    // tslint:disable-next-line no-object-mutation
    self.size += Buffer.byteLength(output);
    self.emit('logged', info);

    //
    // Check to see if we need to end the stream and create a new one
    //
    if (!self.needsNewFile()) {
      return;
    }

    //
    // End the current stream, ensure it flushes and create a new one.
    // This could probably be optimized to not run a stat call but its
    // the safest way since we are supporting `maxFiles`.
    // Remark: We could call `open` here but that would incur an extra unnecessary stat call
    //
    self.endStream(() => {
      self.nextFile();
    });
  }

  const written = this.stream.write(output, logged);
  if (written === false) {
    this.nexts.push(callback);
  } else {
    callback();
  }

  return written;
};
// tslint:disable-next-line no-object-mutation
transports.File.prototype.onDrain = function() {
  // tslint:disable-next-line no-loop-statement
  while (this.nexts.length > 0) {
    this.nexts.shift()();
  }
};
