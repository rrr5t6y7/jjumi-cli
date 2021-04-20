import React, { useCallback } from 'react'
import { Input } from 'antd'
import NumberInput from 'toss.components/NumberInput'
import './styles.scss'

const FormInput = ({ showCounter, trim, prefix, suffix, value, onChange, maxLength, lengthGetter, inputRef, type, ...props }) => {
  const valueLength = lengthGetter ? lengthGetter(value) : value ? (trim ? value.trim().length : value.length) : 0

  return (
    <div className={`lz-component-form-input${type === 'textarea' ? ' lz-component-form-textarea' : ''}${showCounter ? ' with-counter' : ''}`}>
      {prefix ? <span className="input-prefix">{prefix}</span> : null}
      <div className="input-wrap">
        {type === 'textarea' ? (
          <Input.TextArea className="textarea" value={value} ref={inputRef} onChange={onChange} {...props} />
        ) : type == 'number' ? (
          <NumberInput value={value} ref={inputRef} onChange={onChange} {...props} />
        ) : (
          <Input autoComplete="off" className="input" value={value} ref={inputRef} onChange={onChange} {...props} />
        )}
        {showCounter ? (
          maxLength ? (
            <span className="input-counter" data-overflow={valueLength > maxLength}>
              {valueLength}/{maxLength}
            </span>
          ) : (
            <span className="input-counter">{valueLength}</span>
          )
        ) : null}
      </div>
      {suffix ? <span className="input-suffix">{suffix}</span> : null}
    </div>
  )
}

FormInput.defaultProps = {
  showCounter: false, // 是否显示字数统计
  lengthGetter: null,
  trim: false,
}

export default React.forwardRef((props, ref) => {
  return <FormInput {...props} inputRef={ref} />
})
