import * as path from 'path';
import { createContextForPath } from '../../createContext';
import { tsUtils } from '@neo-one/ts-utils';
import { transpile } from '../../transpile';
import { SourceMapConsumer } from 'source-map';

describe('NEOTranspiler', () => {
  test('sourcemaps', async () => {
    const filePath = path.resolve(__dirname, '..', '..', '__data__', 'contracts', 'SourceMapContract.ts');
    const context = await createContextForPath(filePath);
    const smartContract = tsUtils.statement.getClassOrThrow(
      tsUtils.file.getSourceFileOrThrow(context.program, filePath),
      'SourceMapContract',
    );

    const { sourceFiles } = await transpile({ context, smartContract });

    const sourceMap = sourceFiles[filePath].sourceMap;

    const {
      deployMethod,
      superDeploy,
      ctorStatement,
      get,
      set,
      newResult,
      method,
      applicationSwitch,
      verifyWitness,
      getConstructorValueResult,
      getConstructorValue,
    } = await SourceMapConsumer.with(sourceMap, undefined, async (consumer) => {
      const deployMethod = consumer.originalPositionFor({ line: 14, column: 4 });
      const superDeploy = consumer.originalPositionFor({ line: 14, column: 73 });
      const ctorStatement = consumer.originalPositionFor({ line: 14, column: 96 });
      const get = consumer.originalPositionFor({ line: 3, column: 4 });
      const set = consumer.originalPositionFor({ line: 4, column: 4 });
      const newResult = consumer.originalPositionFor({ line: 16, column: 17 });
      const method = consumer.originalPositionFor({ line: 17, column: 15 });
      const applicationSwitch = consumer.originalPositionFor({ line: 18, column: 4 });
      const verifyWitness = consumer.originalPositionFor({ line: 31, column: 14 });
      const getConstructorValueResult = consumer.originalPositionFor({ line: 19, column: 4 });
      const getConstructorValue = consumer.originalPositionFor({ line: 20, column: 8 });

      return {
        deployMethod,
        superDeploy,
        ctorStatement,
        get,
        set,
        newResult,
        method,
        applicationSwitch,
        verifyWitness,
        getConstructorValueResult,
        getConstructorValue,
      };
    });

    expect(deployMethod.line).toEqual(12);
    expect(deployMethod.column).toEqual(2);
    expect(superDeploy.line).toEqual(13);
    expect(superDeploy.column).toEqual(4);
    expect(ctorStatement.line).toEqual(14);
    expect(ctorStatement.column).toEqual(4);
    expect(get.line).toEqual(4);
    expect(get.column).toEqual(2);
    expect(set.line).toEqual(4);
    expect(set.column).toEqual(2);
    expect(newResult.line).toEqual(3);
    expect(newResult.column).toEqual(0);
    expect(method.line).toEqual(3);
    expect(method.column).toEqual(0);
    expect(applicationSwitch.line).toEqual(3);
    expect(applicationSwitch.column).toEqual(0);
    expect(verifyWitness.line).toEqual(3);
    expect(verifyWitness.column).toEqual(0);
    expect(getConstructorValueResult.line).toEqual(17);
    expect(getConstructorValueResult.column).toEqual(2);
    expect(getConstructorValue.line).toEqual(17);
    expect(getConstructorValue.column).toEqual(2);
  });
});
