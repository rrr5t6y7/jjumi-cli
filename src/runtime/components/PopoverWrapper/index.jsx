import React, { useState, useCallback } from 'react'
import { Popover, Button } from 'antd'
import './styles.scss'

const InnerComponentWrapper = React.memo(props => {
  return (
    <div className="lz-component-popover-content-wrapper">
      <div className="popover-content">{props.content}</div>
      <div className="popover-button-wrapper">
        {props.showConfirm ? (
          <Button type="primary" size="small" className="button-confirm" onClick={props.onConfirm}>
            {props.confirmText}
          </Button>
        ) : null}
        {props.showCancel ? (
          <Button className="button-cancel" size="small" onClick={props.onCancel}>
            {props.cancelText}
          </Button>
        ) : null}
      </div>
    </div>
  )
})

const PopoverWrapper = ({ component, children, content, onConfirm, onCancel, showConfirm, showCancel, confirmText, cancelText, ...props }) => {
  const [visible, setVisible] = useState(false)

  const hidePopover = useCallback(() => {
    setVisible(false)
  }, [visible])

  const handleVisibleChange = useCallback(
    nextVisible => {
      setVisible(nextVisible)
    },
    [visible]
  )

  const handleConfirm = useCallback(
    params => {
      if (onConfirm) {
        onConfirm(params) !== false && hidePopover()
      } else {
        hidePopover()
      }
    },
    [onConfirm]
  )

  const handleCancel = useCallback(
    params => {
      if (onCancel) {
        onCancel(params) !== false && hidePopover()
      } else {
        hidePopover()
      }
    },
    [onCancel]
  )

  return (
    <Popover
      content={
        <InnerComponentWrapper
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          showConfirm={showConfirm}
          showCancel={showCancel}
          confirmText={confirmText}
          cancelText={cancelText}
          content={content}
        />
      }
      trigger="click"
      className="lz-compoment-popover-input"
      visible={visible}
      onVisibleChange={handleVisibleChange}
      {...props}>
      {children}
    </Popover>
  )
}

PopoverWrapper.defaultProps = {
  showConfirm: true,
  showCancel: true,
  confirmText: '确定',
  cancelText: '取消',
}

export default PopoverWrapper
