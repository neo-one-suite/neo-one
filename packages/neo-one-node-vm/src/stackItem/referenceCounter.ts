// tslint:disable-next-line no-let
let id = 0;
// tslint:disable-next-line export-name
export const getNextID = () => {
  id += 1;
  /* istanbul ignore next */
  if (id === Number.MAX_SAFE_INTEGER) {
    id = 0;
  }

  return id;
};
