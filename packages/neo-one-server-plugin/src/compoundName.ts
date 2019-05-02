const SEPARATOR = '$!$';
const make = ({ names, name }: { readonly names: readonly string[]; readonly name: string }) =>
  names.concat([name]).join(SEPARATOR);

const extract = (name: string): { readonly names: readonly string[]; readonly name: string } => {
  const names = name.split(SEPARATOR);

  return {
    names: names.slice(0, -1),
    name: names[names.length - 1],
  };
};

export const compoundName = {
  SEPARATOR,
  make,
  extract,
};
