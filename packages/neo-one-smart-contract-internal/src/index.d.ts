import * as externalNEO from '@neo-one/smart-contract';

declare namespace neo {
  type BufferLike = number | string | Buffer;

  interface Transaction {
    __transactionBrand: number;
  }

  interface Contract {
    __contractBrand: number;
  }

  function getStorage<T extends BufferLike>(key: Buffer): T;
  function putStorage(key: Buffer, value: BufferLike): void;
  function deleteStorage(key: Buffer): void;
  function cast<T>(value: Buffer): T;
  function castBuffer(value: BufferLike): Buffer;
  function castBufferArray(values: BufferLike[]): Buffer[];
  function checkWitness(value: Buffer): boolean;
  function isVerification(): boolean;
  function isApplication(): boolean;
  function notify(value: Buffer[]): void;
  function getCurrentTime(): number;
  function getCurrentTransaction(): Transaction;
  function getCurrentContract(): Contract;
}

export = neo;
