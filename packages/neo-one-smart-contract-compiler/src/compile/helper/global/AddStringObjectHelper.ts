import { AddConstructorObjectHelper } from './AddConstructorObjectHelper';

// Input: [objectPrototypeVal, globalObjectVal]
// Output: [objectPrototypeVal, globalObjectVal]
export class AddStringObjectHelper extends AddConstructorObjectHelper {
  protected readonly name = 'String';
}
