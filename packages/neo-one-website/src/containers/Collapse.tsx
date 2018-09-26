// tslint:disable no-any no-object-mutation readonly-keyword no-null-keyword no-submodule-imports no-unnecessary-type-annotation strict-boolean-expressions
import React from 'react';
import Transition from 'react-transition-group/Transition';
import { styled } from 'reakit';
import { ifProp } from 'styled-tools';

interface Props {
  readonly visible: boolean;
}

const getAutoHeightDuration = (height: number | undefined) => {
  if (!height) {
    return 0;
  }

  const constant = height / 36;

  // tslint:disable-next-line:binary-expression-operand-order
  return Math.round((4 + 15 * constant ** 0.25 + constant / 5) * 10);
};

const Wrapper = styled.div<{ entered: boolean }>`
  height: ${ifProp('entered', 'auto', '0')};
  overflow: ${ifProp('entered', 'unset', 'hidden')};
  transition: height 300ms cubic-bezier(0.4, 0, 0.2, 1);
`;

const WrapperOuter = styled.div`
  display: 'flex';
`;

const WrapperInner = styled.div`
  width: 100%;
`;

export class Collapse extends React.Component<Props> {
  private wrapperRef: any;
  private autoTransitionDuration: any;
  private timer: any;

  public componentWillUnmount() {
    clearTimeout(this.timer);
  }

  public render() {
    return (
      <Transition
        onEnter={this.handleEnter}
        onEntered={this.handleEntered}
        onEntering={this.handleEntering}
        onExit={this.handleExit}
        onExiting={this.handleExiting}
        addEndListener={this.addEndListener}
        in={this.props.visible}
        timeout={{}}
      >
        {(state: any, childProps: any) => (
          <Wrapper entered={state === 'entered'} {...childProps}>
            <WrapperOuter
              innerRef={(ref: any) => {
                this.wrapperRef = ref;
              }}
            >
              <WrapperInner>{this.props.children}</WrapperInner>
            </WrapperOuter>
          </Wrapper>
        )}
      </Transition>
    );
  }

  private readonly handleEnter = (node: any) => {
    node.style.height = 0;
  };

  private readonly handleEntering = (node: any) => {
    const wrapperHeight = this.wrapperRef ? this.wrapperRef.clientHeight : 0;

    const duration = getAutoHeightDuration(wrapperHeight);
    node.style.transitionDuration = `${duration}ms`;
    this.autoTransitionDuration = duration;

    node.style.height = `${wrapperHeight}px`;
  };

  private readonly handleEntered = (node: any) => {
    node.style.height = 'auto';
  };

  private readonly handleExit = (node: any) => {
    const wrapperHeight = this.wrapperRef ? this.wrapperRef.clientHeight : 0;
    node.style.height = `${wrapperHeight}px`;
  };

  private readonly handleExiting = (node: any) => {
    const wrapperHeight = this.wrapperRef ? this.wrapperRef.clientHeight : 0;

    const duration = getAutoHeightDuration(wrapperHeight);
    node.style.transitionDuration = `${duration}ms`;
    this.autoTransitionDuration = duration;
    node.style.height = 0;
  };

  private readonly addEndListener = (_: any, next: any) => {
    this.timer = setTimeout(next, this.autoTransitionDuration || 0);
  };
}
