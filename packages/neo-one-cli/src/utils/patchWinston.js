/* @flow */
import { MESSAGE } from 'triple-beam';
import { transports } from 'winston';

const noop = () => {};

// TODO: Seems like a bug in winston #59
transports.File.prototype.log = function log(info, callbackIn) {
  if (this._nexts == null) {
    this._nexts = [];
  }
  const callback = callbackIn || noop;

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
  const self = this;
  const output = info[MESSAGE] + this.eol;

  //
  // This gets called too early and does not depict when data has been flushed
  // to disk like I want it to
  //
  function logged() {
    self._size += Buffer.byteLength(output);
    self.emit('logged', info);

    //
    // Check to see if we need to end the stream and create a new one
    //
    if (!self._needsNewFile()) {
      return;
    }

    //
    // End the current stream, ensure it flushes and create a new one.
    // TODO: This could probably be optimized to not run a stat call but its
    // the safest way since we are supporting `maxFiles`.
    // Remark: We could call `open` here but that would incur an extra unnecessary stat call
    //
    self._endStream(() => {
      self._nextFile();
    });
  }

  const written = this._stream.write(output, logged);
  if (written === false) this._nexts.push(callback);
  else callback();

  return written;
};
transports.File.prototype._onDrain = function onDrain() {
  while (this._nexts.length > 0) {
    this._nexts.shift()();
  }
};
