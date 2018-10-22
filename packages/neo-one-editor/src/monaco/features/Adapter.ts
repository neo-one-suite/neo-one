import { PouchDBFileSystem } from '@neo-one/local-browser';
import { Observable, Subscription, throwError } from 'rxjs';
import { catchError, filter, take, takeUntil } from 'rxjs/operators';
import { AsyncLanguageService } from '../AsyncLanguageService';
import { getModel } from './utils';

export class Adapter {
  private readonly mutableCreatedModels: Set<monaco.editor.ITextModel> = new Set();
  private readonly mutableSubscriptions: Set<Subscription> = new Set();

  public constructor(
    protected worker$: Observable<AsyncLanguageService>,
    private readonly fs: PouchDBFileSystem,
    private readonly languageID: string,
  ) {}

  public dispose(): void {
    this.mutableCreatedModels.forEach((model) => {
      model.dispose();
    });
    this.mutableSubscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }

  protected async toPromise<T>(token: monaco.CancellationToken, worker$: Observable<T>): Promise<T> {
    return worker$
      .pipe(
        takeUntil(
          new Observable((observer) => {
            const disposable = token.onCancellationRequested(() => observer.next());

            return () => disposable.dispose();
          }),
        ),
        take(1),
        catchError((error) => {
          // tslint:disable-next-line no-console
          console.error(error);

          return throwError(error);
        }),
      )
      .toPromise();
  }

  protected getOrCreateModel(resource: monaco.Uri | string): monaco.editor.ITextModel | undefined {
    let model = getModel(resource);
    if (model === undefined) {
      try {
        let path = resource;
        if (typeof path !== 'string') {
          path = path.path;
        }

        const content = this.fs.readFileSync(path);
        model = monaco.editor.createModel(
          content,
          this.languageID,
          typeof resource === 'string' ? new monaco.Uri().with({ path: resource }) : resource,
        );
        this.mutableCreatedModels.add(model);

        const constModel = model;
        const subscription = this.fs.changes$.pipe(filter((change) => change.id === path)).subscribe((change) => {
          if (change.doc === undefined) {
            constModel.dispose();
            this.mutableCreatedModels.delete(constModel);

            subscription.unsubscribe();
            this.mutableSubscriptions.delete(subscription);
          } else {
            constModel.setValue(change.doc.content);
          }
        });
        this.mutableSubscriptions.add(subscription);
      } catch (error) {
        // tslint:disable-next-line:no-console
        console.error(error);
      }
    }

    return model;
  }
}
