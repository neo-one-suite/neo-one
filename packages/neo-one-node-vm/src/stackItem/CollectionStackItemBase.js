import StackItemBase from './StackItemBase';

export type StackCollectionType = ArrayLikeStackItem|MapStackItem;
export type StackCollectionParentChainType = {[StackCollectionType]: boolean};

export default class CollectionStackItemBase extends StackItemBase {
  _parentChain:StackCollectionParentChainType;

  _scrub(parentChain: StackCollectionParentChainType = {}):void{
    this._parentChain = parentChain;
    const curParentChain = {...parentChain, this:true};
    this.valuesArray().forEach(value => {
     if(value instanceof StackCollectionType){
       if(parentChain[value]){
        const circularVal = value.toString();
        throw new Error("Collection contains circular reference\n"
                        + circularVal);
       }else{
        this._values[value]._scrub(curParentChain);
      }
     }
   });
  }
}
