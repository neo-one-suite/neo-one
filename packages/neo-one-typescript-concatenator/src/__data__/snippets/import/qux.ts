// tslint:disable-next-line no-let
let val = 0;
export function value() {
  return val;
}
// tslint:disable-next-line no-default-export
export default function() {
  val += 1;
}
