/* @flow */
const SEPARATOR = '$!$';
const make = ({ names, name }: {| names: Array<string>, name: string |}) =>
  names.concat([name]).join(SEPARATOR);

const extract = (name: string): {| names: Array<string>, name: string |} => {
  const names = name.split(SEPARATOR);
  return {
    names: names.slice(0, -1),
    name: names[names.length - 1],
  };
};

export default {
  SEPARATOR,
  make,
  extract,
};
