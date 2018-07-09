import { helpers } from '../../../__data__';

describe('SuperExpressionCompiler', () => {
  test('basic', async () => {
    await helpers.executeString(`
    class Animal{
      animal : string;
      constructor(animal: string){
        this.animal = animal;
      }
    }
    class Dog extends Animal{
      constructor(){
        super('dog');
      }
    }

    const d =  new Dog();

    if(d.animal!=="dog"){
      throw 'Failure';
    }

    `);
  });
});
