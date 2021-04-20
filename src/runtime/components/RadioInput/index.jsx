import React from 'react'
import { Input, Radio } from 'antd'
import { withStore } from 'toss.store'
import './styles.scss'

const getValidator = (inputValueVaidator, message) => (rules, value, callback) => {
  if (inputValueVaidator && inputValueVaidator(value)) {
    callback()
  } else {
    callback(message)
  }
}
class RadioInput extends React.PureComponent {
  static defaultProps = {
    value: {
      radioValue: '',
      inputValue: '',
    },
    autoClear: false,
    maxLength: 9,
    inputSize: 'medium',
    inputProps: {},
    radioValues: ['0', '1'],
    labels: ['否', '是', ''],
    pattern: null,
  }

  handleRadioValueChange = (event) => {
    const { value, radioValues, autoClear, onChange } = this.props
    const radioValue = event.target.value
    const inputValue = autoClear && radioValue !== radioValues[1] ? '' : value.inputValue

    onChange && onChange({ radioValue, inputValue })
  }

  handleInputValueChange = (event) => {
    const { value: inputValue } = event.target

    if (this.props.pattern && !this.props.pattern.test(inputValue)) {
      return false
    }

    this.props.onChange &&
      this.props.onChange({
        ...this.props.value,
        inputValue,
      })
  }

  render() {
    const { autoClear, value, readOnly, radioLocked, placeholder, radioValues, labels, maxLength, inputSize, inputProps } = this.props
    let { radioValue, inputValue } = value

    if (autoClear && radioValue !== radioValues[1]) {
      inputValue = ''
    }

    return (
      <div className="lz-component-radio-input">
        <Radio.Group value={value.radioValue} className="lz-radio-group" disabled={readOnly || radioLocked} onChange={this.handleRadioValueChange}>
          <Radio value={radioValues[0]}>{labels[0]}</Radio>
          <Radio value={radioValues[1]}>{labels[1]}</Radio>
        </Radio.Group>
        <Input
          className={inputSize}
          readOnly={readOnly}
          disabled={value.radioValue !== radioValues[1]}
          value={inputValue}
          maxLength={maxLength}
          onChange={this.handleInputValueChange}
          placeholder={placeholder}
          {...inputProps}
        />
        <span>{labels[2]}</span>
      </div>
    )
  }
}

const ConnectedComponent = withStore(['common'])(RadioInput)
ConnectedComponent.getValidator = getValidator

export default React.forwardRef((props, ref) => <ConnectedComponent componentRef={ref} {...props} />)
