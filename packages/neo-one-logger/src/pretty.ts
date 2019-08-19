// tslint:disable-next-line no-let
let pretty = false;
export const getPretty = () => pretty;
export const setPretty = (newPretty: boolean) => {
  pretty = newPretty;
};
