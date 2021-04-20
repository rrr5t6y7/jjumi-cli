import React, { useCallback } from 'react'
import { Button, Input } from 'antd'
import './styles.scss'

// const inputPattern = /^\d*$/

const NumberInput = React.memo(props => {
  let { value, onChange, readOnly, max, min, className, inputClassName, allowInput, decimal, showAddMinusBut, inputRef, ...restProps } = props
  const handleIncrease = useCallback(() => {
    if (!value || isNaN(value)) {
      onChange('1', props)
    } else {
      if (new Number(value) >= max) {
        value = max
      }
      if (new Number(value) <= min) {
        value = min
      }

      onChange(new Number(value) + 1, props)
      // onChange(Math.min(max, +value + 1), props)
    }
  }, [value, onChange])

  const handleDecrease = useCallback(() => {
    if (!value || isNaN(value)) {
      onChange('1', props)
    } else {
      if (new Number(value) >= max) {
        value = max
      }
      if (new Number(value) <= min) {
        value = min
      }

      onChange(new Number(value) - 1, props)

      // onChange(Math.max(min, +value - 1), props)
    }
  }, [value, onChange])

  const handleInput = useCallback(
    event => {
      let inputValue = event.target.value
      let reg = decimal == 0 ? '^\\d*$' :  `(^(?!0+(?:\\.+)?$)(?:[0-9]\\d*|0)(?:\\.\\d{1,${decimal}})?$)|(^\\d+\\.$)|(^\\d+$)` 
      reg = new RegExp(reg, 'ig')
      if (!allowInput) {
        return false
      }
      if (inputValue === '') {
        onChange('', props)
      } else if (reg.test(inputValue)) {
        // if (new Number(inputValue) >= max) {
        //   inputValue = max
        // }
        // if (new Number(inputValue) <= min) {
        //   inputValue = min
        // }
        // onChange(inputValue, props)
        parseFloat(inputValue) > max || parseFloat(inputValue) < min || onChange(inputValue, props)
      }
    },
    [value, onChange, allowInput]
  )

  return (
    <div className={`lz-component-number-input ${className}`}>
      <Input readOnly={allowInput ? props.readOnly : true} value={value} onChange={handleInput} className={inputClassName} {...restProps} />
      {showAddMinusBut ? (
        <div className="buttons">
          <Button onClick={handleIncrease} disabled={value >= max || readOnly} icon="caret-up" />
          <Button onClick={handleDecrease} disabled={value <= min || readOnly} icon="caret-down" />
        </div>
      ) : null}
    </div>
  )
})

NumberInput.defaultProps = {
  decimal: 0,
  showAddMinusBut: true,
  max: Infinity,
  min: 0,
  className: '',
  allowInput: true,
  inputClassName: '',
}

export default React.forwardRef((props, ref) => <NumberInput {...props} ref={ref} />)
