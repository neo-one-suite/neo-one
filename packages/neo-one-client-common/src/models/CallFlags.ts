export enum CallFlags {
  None = 0,
  ReadStates = 0b00000001,
  WriteStates = 0b00000010,
  AllowCall = 0b00000100,
  AllowNotify = 0b00001000,
  // tslint:disable-next-line: no-bitwise
  States = ReadStates | WriteStates,
  // tslint:disable-next-line: no-bitwise
  ReadOnly = ReadStates | AllowCall,
  // tslint:disable-next-line: no-bitwise
  All = States | AllowCall | AllowNotify,
}
