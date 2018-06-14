import { AddConstructorObjectHelper } from './AddConstructorObjectHelper';

// Input: [objectPrototypeVal, globalObjectVal]
// Output: [objectPrototypeVal, globalObjectVal]
export class AddBooleanObjectHelper extends AddConstructorObjectHelper {
  protected readonly name = 'Boolean';
}
