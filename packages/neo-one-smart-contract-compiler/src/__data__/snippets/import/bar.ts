// tslint:disable-next-line no-let
let val = 0;

const x = 3;
export const value = () => val;
export const incrementValue = () => {
  val += 1;
};
// tslint:disable-next-line:export-name
export { x };
