import { comlink } from '@neo-one/worker';
import * as React from 'react';
import { styled } from 'reakit';
import { Engine } from '../engine';

const StyledIFrame = styled.iframe`
  margin: unset;
  padding: unset;
  border: unset;
  background: unset;
  font: unset;
  font-family: inherit;
  font-size: 100%;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
`;

interface Props {
  readonly engine: Engine;
}

export class PreviewContent extends React.Component<Props> {
  private readonly ref = React.createRef<HTMLIFrameElement>();

  public componentDidMount(): void {
    const instance = this.ref.current;
    if (instance !== null && instance.contentWindow !== null) {
      const contentWindow = instance.contentWindow;
      const { port1, port2 } = new MessageChannel();
      comlink.expose(this.props.engine, port1);

      const handler = (event: MessageEvent) => {
        if (event.data != undefined && typeof event.data === 'object' && event.data.type === 'initialize') {
          contentWindow.postMessage({ port: port2 }, '*', [port2]);
          window.removeEventListener('message', handler);
        }
      };
      window.addEventListener('message', handler);
    }
  }

  public render() {
    return <StyledIFrame innerRef={this.ref} src={this.props.engine.createPreviewURL()} />;
  }
}
