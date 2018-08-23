declare module 'memdown' {
  import { AbstractLevelDOWN } from 'abstract-leveldown';

  export interface MemDown<K = any, V = any> extends AbstractLevelDOWN<K, V> {}

  interface MemDownConstructor {
    new <K = any, V = any>(): MemDown<K, V>;
    <K = any, V = any>(): MemDown<K, V>;
  }

  const MemDown: MemDownConstructor;
  export default MemDown;
}
