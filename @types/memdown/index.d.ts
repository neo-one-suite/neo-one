import {
  AbstractLevelDOWN
} from 'abstract-leveldown';

export interface MemDown<K=any, V=any> extends AbstractLevelDOWN<K, V> { }

declare interface MemDownConstructor {
  new <K=any, V=any>(): MemDown<K, V>;
  <K=any, V=any>(): MemDown<K, V>;
}

declare const MemDown: MemDownConstructor;
export default MemDown;
