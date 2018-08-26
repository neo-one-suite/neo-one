import * as React from 'react';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

export interface Toast {
  readonly id: string;
  readonly title: React.ReactNode;
  readonly message: React.ReactNode;
  readonly autoHide?: number;
}

export type AddToast = (toast: Toast) => void;

interface ToastsContextType {
  readonly toasts$: Observable<ReadonlyArray<Toast>>;
  readonly addToast: AddToast;
  readonly removeToast: (id: string) => void;
}

const toasts$ = new BehaviorSubject<ReadonlyArray<Toast>>([]);
export const ToastsContext = React.createContext<ToastsContextType>({
  toasts$: toasts$.pipe(distinctUntilChanged()),
  addToast: (toast) => {
    const toasts = toasts$.getValue();
    toasts$.next(toasts.some((localToast) => localToast.id === toast.id) ? toasts : [...toasts, toast]);
  },
  removeToast: (id) => {
    toasts$.next(toasts$.getValue().filter((localToast) => localToast.id !== id));
  },
});

interface WithAddToastProps {
  readonly children: (addToast: AddToast) => React.ReactNode;
}

export function WithAddToast({ children }: WithAddToastProps) {
  return <ToastsContext.Consumer>{({ addToast }) => children(addToast)}</ToastsContext.Consumer>;
}
