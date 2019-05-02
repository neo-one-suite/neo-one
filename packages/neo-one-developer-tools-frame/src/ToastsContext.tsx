import { Box, useStream } from '@neo-one/react-common';
import { enqueuePostPromiseJob } from '@neo-one/utils';
import * as React from 'react';
import { BehaviorSubject, Observable } from 'rxjs';
import styled from 'styled-components';
import { prop } from 'styled-tools';

const { useMemo } = React;

export interface Toast {
  readonly id: string;
  readonly title: React.ReactNode;
  readonly message?: React.ReactNode;
  readonly autoHide?: number;
}

export type AddToast = (toast: Toast) => void;

export interface ToastsContextType {
  readonly toasts$: Observable<readonly Toast[]>;
  readonly addToast: AddToast;
  readonly removeToast: (id: string) => void;
}

const toasts$ = new BehaviorSubject<readonly Toast[]>([]);
const addToast = (toast: Toast) => {
  const toasts = toasts$.getValue();
  const nextToasts = toasts.some((localToast) => localToast.id === toast.id) ? toasts : [...toasts, toast];
  toasts$.next(nextToasts);
};
const removeToast = (id: string) => {
  toasts$.next(toasts$.getValue().filter((localToast) => localToast.id !== id));
};

export const useToasts = (): readonly [readonly Toast[], typeof addToast, typeof removeToast] => {
  const toasts = useStream(() => toasts$, [toasts$], toasts$.getValue());

  return [toasts, addToast, removeToast];
};

export type AddError = (error: Error) => void;

const ErrorText = styled(Box)`
  color: ${prop('theme.error')};
`;

// tslint:disable-next-line no-let
let mutableID = 0;

const StyledPre = styled.pre`
  white-space: pre;
  overflow-x: auto;
`;

const createAddError = (addToastInternal: AddToast) => {
  let queued = false;
  const errors = new Set<Error>();

  return (err: Error) => {
    errors.add(err);
    if (!queued) {
      queued = true;
      enqueuePostPromiseJob(() => {
        errors.forEach((error) => {
          // tslint:disable-next-line no-console
          console.error(error.stack === undefined ? error : error.stack);
          addToastInternal({
            id: `error:${mutableID}`,
            title: (
              <span data-test="neo-one-error-toast-title">
                <ErrorText as="span">Error.&nbsp;</ErrorText>
                <span>See console for more info.</span>
              </span>
            ),
            message: <StyledPre data-test="neo-one-error-toast-message">{error.message}</StyledPre>,
          });
          mutableID += 1;
        });
        errors.clear();
        queued = false;
      });
    }
  };
};

export const useAddError = () => {
  // tslint:disable-next-line:no-unused
  const [_toasts, addToastInternal] = useToasts();

  return useMemo(() => createAddError(addToastInternal), [addToast]);
};
