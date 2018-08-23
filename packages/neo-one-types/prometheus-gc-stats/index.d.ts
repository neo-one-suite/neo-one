declare module 'prometheus-gc-stats' {
  import { register } from 'prom-client';
  const gcStats: (reg: typeof register) => () => void;
  export default gcStats;
}
