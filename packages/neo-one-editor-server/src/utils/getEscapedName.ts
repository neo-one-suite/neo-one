import npa from 'npm-package-arg';

export const getEscapedName = (name: string) => {
  const escapedName = npa(name).escapedName;
  if (escapedName === null) {
    throw new Error(`Escaped name for ${name} was null.`);
  }

  return escapedName;
};
