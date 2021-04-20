import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Icon, Modal, Button } from 'antd'
import { tryExecute, preventableFn } from 'toss.utils/base'
import { lang } from 'toss.utils/lang'
import './ModalTrigger.scss'

const defaultSelectedTextFormatter = props => {
  return (
    <div className="selected-text">
      {lang('已选数量：')}(<span className="text-danger">{props.value?.length || 0}</span>)
    </div>
  )
}

const defaultFooterCountFormatter = value => {
  return (
    <span>
      {lang('已选')} (<span className="text-danger">{value?.length || 0}</span>)
    </span>
  )
}

const ModalTrigger = React.memo(
  React.forwardRef((props, ref) => {
    const {
      modalWidth,
      modalTitle,
      modalVisible,
      withContentPadding,
      hideEntryButton,
      buttonText,
      buttonType,
      buttonGhost,
      buttonProps,
      modalProps,
      showCloseButton,
      showFooter,
      onOpen,
      onCancel,
      children,
      entryChildren,
      onChange,
      customFooterLeft,
      confirmText,
      cancelText,
      defaultValue,
      tailContent,
      bottomContent,
      ...restProps
    } = props

    const [value, setValue] = useState(restProps.defaultValue)
    const [restChangeArgus, setRestChangeArgus] = useState([])
    const [valueChanged, setValueChanged] = useState(false)
    const [innerModalVisible, setModalVisible] = useState(false)

    const showPickerModal = useCallback(() => {
      return preventableFn(onOpen).then(() => {
        setModalVisible(true)
      })
    })

    const handleChange = useCallback(
      (nextValue, ...argus) => {
        return preventableFn(props.onSelect, nextValue, ...argus).then(() => {
          setValueChanged(true)
          setValue(nextValue)
          setRestChangeArgus(argus)
        })
      },
      [props.onSelect]
    )

    const handleConfirm = useCallback(() => {
      preventableFn(props.onBeforeChange, props.value, value, valueChanged).then(modifiedValue => {
        preventableFn(props.onChange, modifiedValue || value, ...restChangeArgus).then(() => {
          props.closeOnConfirm && setModalVisible(false)
        })
      })
    }, [value, valueChanged, restChangeArgus, props.onChange, props.closeOnConfirm])

    const handleCancel = useCallback(() => {
      preventableFn(props.onCancel, valueChanged, 'cancel-button').then(() => {
        setModalVisible(false)
        setValue(props.value)
      })
    }, [props.onCancel, props.value, valueChanged])

    const handleClose = useCallback(() => {
      preventableFn(props.onCancel, valueChanged, 'close-button').then(() => {
        setModalVisible(false)
        setValue(props.value)
      })
    }, [props.onCancel, props.value, valueChanged])

    /**
     * 支持在外部通过modalVisible属性控制
     */
    useEffect(() => {
      setModalVisible(modalVisible)
    }, [modalVisible])

    useEffect(() => {
      setValue(props.value)
    }, [props.value])

    const closeButton = showCloseButton ? (
      <button onClick={handleClose} className="button-close-modal">
        <Icon type={props.closeIcon || 'plus'} />
      </button>
    ) : null

    return (
      <div className="lz-component-modal-trigger">
        {entryChildren ? (
          <div onClick={showPickerModal}>{entryChildren}</div>
        ) : (
          !hideEntryButton && (
            <div className="picker-entry">
              <div className="button-wrapper">
                <Button type={buttonType} ghost={buttonGhost} onClick={showPickerModal} {...buttonProps}>
                  {buttonText}
                </Button>
                {tailContent}
              </div>
              {props.selectedTextFormatter(props)}
            </div>
          )
        )}
        <Modal
          title={null}
          visible={innerModalVisible}
          maskClosable={false}
          className={`lz-component-modal ${props.modalClassName}`}
          footer={null}
          header={null}
          width={modalWidth}
          {...modalProps}>
          <div className={`modal-content${withContentPadding ? ' with-padding' : ''}`}>
            {modalTitle ? (
              <div className="modal-header">
                <h5 className="modal-title">{modalTitle}</h5>
                {closeButton}
              </div>
            ) : (
              closeButton
            )}
            <div className="modal-body">
              {React.cloneElement(children, {
                ...restProps,
                value: value,
                onCancel: handleCancel,
                onConfirm: handleConfirm,
                onChange: handleChange,
                ref: ref,
              })}
            </div>
            {props.footerExtraContent}
            {showFooter ? (
              props.readOnly ? (
                <div className="modal-footer">
                  <div className="footer-left">{props.customFooterLeft}</div>
                  <div className="selected-count">{props.footerCountFormatter(value)}</div>
                  <div className="footer-buttons">
                    <Button className="button-cancel" onClick={handleCancel}>
                      {props.closeText}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="modal-footer">
                  <div className="footer-left">{props.customFooterLeft}</div>
                  <div className="selected-count">{props.footerCountFormatter(value)}</div>
                  <div className="footer-buttons">
                    <Button className="button-confirm" type="primary" onClick={handleConfirm}>
                      {props.confirmText}
                    </Button>
                    <Button className="button-cancel" onClick={handleCancel}>
                      {props.cancelText}
                    </Button>
                  </div>
                </div>
              )
            ) : null}
          </div>
        </Modal>
      </div>
    )
  })
)

ModalTrigger.defaultProps = {
  readOnly: false, // 只读模式
  hideEntryButton: false, // 是否隐藏入口按钮，隐藏之后可通过modalVisible属性来控制弹窗的显示
  buttonText: lang('请选择'), // 入口按钮文字
  buttonType: 'primary',
  buttonGhost: false,
  buttonProps: {}, // 入口按钮其他属性
  confirmText: lang('确定'), // 弹窗确认按钮文字
  cancelText: lang('取消'), // 弹窗取消按钮文字
  closeText: lang('关闭'), // readOnly状态显示关闭文字
  modalWidth: 876, // 弹窗宽度
  modalVisible: false, // 弹窗是否可见，用于外部控制弹窗显示
  modalTitle: null, // 弹窗标题
  modalClassName: '', // 弹窗样式名
  modalProps: {}, // 弹窗组件的更多属性
  closeOnConfirm: true, // 点击确认后是否隐藏弹窗
  showCloseButton: true, // 是否展示帮助按钮
  showFooter: true, // 是否展示地步
  children: null,
  tailContent: null, // 现在是按钮右侧的提示内容
  selectedTextFormatter: defaultSelectedTextFormatter, // 用于格式化入口按钮下方的已选文案
  footerCountFormatter: defaultFooterCountFormatter, // 用于格式化弹窗底部按钮左侧的已选文案
}

export default ModalTrigger
