import React from 'react'
import { Input } from 'antd'
import PopoverWrapper from 'toss.components/PopoverWrapper'
import './styles.scss'

export default React.memo(
  ({
    name,
    value,
    onChange,
    width,
    prefixText,
    suffixText,
    errorText,
    inputProps,
    ...restProps
  }) => {
    const inputStyle = { width }

    return (
      <PopoverWrapper
        content={
          <div className="lz-component-popover-input">
            {prefixText ? <span className="text-prefix">{prefixText}</span> : null}
            <Input
              style={inputStyle}
              name={name}
              value={value}
              onChange={onChange}
              data-error={!!errorText}
              {...inputProps}
            />
            {suffixText ? <span className="text-suffix">{suffixText}</span> : null}
            {errorText ? <span className="error-tip text-danger">{errorText}</span> : null}
          </div>
        }
        {...restProps}
      />
    )
  }
)
