import PropTypes from 'prop-types'
import React, {MouseEvent, useEffect, useRef, useState} from 'react'
import {ModalWrapper} from './ModalWrapper'
import {Modal as defaultModalInstance} from './index'
import styled from '@emotion/styled';

const ModalDiv = styled.div`
    position: relative;
    z-index: 10001;
`

const ModalScroll = styled.div`
    overflow-y: auto;

    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 101;
`;

const ModalView = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 8px;
    width: 100%;
    min-height: 100%;
    height: auto;
`;

const ModalFrame = styled.div`
    position: relative;
    max-width: 100%;
    width: 500px;
    border-radius: 6px;
    box-shadow: 0 9px 30px 0 rgba(0, 0, 0, 0.4);
    background: white;

    @media screen and (max-width: 768px) {
      width: 400px;
    }

    @media screen and (max-width: 576px) {
      width: 100%;
    }

    &.large {
      width: 700px;

      @media screen and (max-width: 768px) {
        width: 500px;
      }
    }

    &.small {
      width: 300px;

      @media screen and (max-width: 768px) {
        width: 300px;
      }
    }

    &.full {
      width: 100%;
    }
`;

const ModalHeader = styled.div`
    display: flex;
    justify-content: center;
    padding: 8px;
    border-radius: 6px 6px 0 0;
`

const ModalTitle = styled.div`
    flex: 1;
    text-align: center;
    text-transform: uppercase;
    cursor: default;
    user-select: none;
`

const ModalCloseIcon = styled.div`
    flex: 0;
    text-decoration: none;
    font-size: 21px;
    line-height: 16px;
    margin: auto;
    transition: opacity ease-out 0.4s;
    opacity: 0.6;
    &:before {
      content: '×';
    }
    &:hover {
      opacity: 0.9;
    }
`

const ModalBody = styled.div`
    padding: 8px;
`

const ModalBg = styled.div`
    background: rgba(0, 0, 0, 0.4);
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    min-height: 100vh;
    backdrop-filter: blur(20px);
    z-index: 100;
`

interface Props {
  name: string
  title?: string
  canClose?: boolean
  canCloseOutside?: boolean
  modalInstance?: ModalWrapper
  onOpen?: (payload?: any) => void
  onClose?: () => void
  children?: React.ReactElement | React.ReactElement[] | string
  innerClass?: string
}

function ModalComponent(props: Props) {
  const ref = useRef<React.DetailedHTMLProps<any, any>>(null)
  const [isOpen, setOpen] = useState<boolean>(false)
  const [bodyOverflowY, setBodyOverflowY] = useState<string>()
  const [Modal, setModal] = useState<ModalWrapper>(
    props.modalInstance ?? defaultModalInstance
  )

  function open(payload?: any) {
    setOpen(true)
    document.body.style.overflowY = 'hidden'
    props.onOpen?.(payload)
  }

  function close(force = false) {
    if ((props.canClose ?? true) || force) {
      setOpen(false)
      document.body.style.overflowY = bodyOverflowY ?? 'unset'
      props.onClose?.()
    }
  }

  function closeFromView(e: MouseEvent<HTMLDivElement>) {
    if ((props.canCloseOutside ?? true) && e.target === ref.current) {
      close()
    }
  }

  useEffect(() => {
    setBodyOverflowY(document.body.style.overflowY)
  }, [])

  useEffect(() => {
    setModal(props.modalInstance ?? defaultModalInstance)

    const openEvent = (name: string, payload?: any) => {
      if (name === props.name) {
        open(payload)
      }
    }

    const closeEvent = (name: string) => {
      if (name === props.name) {
        close(true)
      }
    }

    const closeAllEvent = () => {
      setOpen(false)
      props.onClose?.()
    }

    Modal.event.on('open', openEvent)
    Modal.event.on('close', closeEvent)
    Modal.event.on('closeAll', closeAllEvent)

    return () => {
      // Remove current listener when this component unmount
      Modal.event.off('open', openEvent)
      Modal.event.off('close', closeEvent)
      Modal.event.off('closeAll', closeAllEvent)
    }
  }, [props])

  return (
    <ModalDiv className={'modal'}>
      {isOpen && (
        <>
          <ModalScroll>
            <ModalView ref={ref} className={'modal__view'} onClick={closeFromView}>
              <ModalFrame className={`modal__frame ${props.innerClass}`}>
                <ModalHeader className={'modal__header'}>
                  <ModalTitle className={'modal__title'}>{props.title}</ModalTitle>

                  {(props.canClose ?? true) && (
                    <ModalCloseIcon className={'modal__close-icon'} onClick={() => close()} />
                  )}
                </ModalHeader>

                <ModalBody className={'modal__body'}>
                  {(props.children as React.ReactElement) ?? <div />}
                </ModalBody>
              </ModalFrame>
            </ModalView>
          </ModalScroll>

          <ModalBg className={'modal__bg'} />
        </>
      )}
    </ModalDiv>
  )
}

ModalComponent.propTypes = {
  name: PropTypes.string.isRequired,
  title: PropTypes.string,
  canClose: PropTypes.bool,
  canCloseOutside: PropTypes.bool,
  modalInstance: PropTypes.instanceOf(ModalWrapper),
  onOpen: PropTypes.func,
  onClose: PropTypes.func,
  children: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.arrayOf(PropTypes.element.isRequired),
  ]),
  innerClass: PropTypes.string,
}

export default ModalComponent
