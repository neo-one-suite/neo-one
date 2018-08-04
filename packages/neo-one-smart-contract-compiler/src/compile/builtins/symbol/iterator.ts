import { WellKnownSymbol } from '../../constants';
import { WellKnownSymbolBase } from './WellKnownSymbolBase';

// tslint:disable-next-line export-name
export class SymbolIterator extends WellKnownSymbolBase {
  protected readonly symbol = WellKnownSymbol.iterator;
}
