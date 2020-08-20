export enum CallFlags {
  None = 0,
  AllowStates = 0b00000001,
  AllowModifyStates = 0b00000010,
  AllowCall = 0b00000100,
  AllowNotify = 0b00001000,
  // tslint:disable-next-line: no-bitwise
  ReadOnly = AllowStates | AllowCall | AllowNotify,
  // tslint:disable-next-line: no-bitwise
  All = AllowStates | AllowModifyStates | AllowCall | AllowNotify,
}
