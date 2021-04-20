import React from 'react'
import { Tabs } from 'antd'
import './styles.scss'

const TabFilter = React.memo(({ items, value, onChange, className, authChecker, ...props }) => {
  const filterdItems = items.filter((item) => (item.authKey && authChecker ? authChecker(item.authKey) : true))
  const activeIndex = items.findIndex((item) => item.value === value)

  return (
    <Tabs className={`lz-component-tab-filter type-${props.type} ${className}`} activeKey={value} onChange={onChange} {...props}>
      {filterdItems.map((item, index) => (
        <Tabs.TabPane
          key={item.value}
          disabled={item.disabled}
          tab={
            <span
              data-disabled={item.disabled}
              className={
                index === activeIndex
                  ? 'tab-label active'
                  : index === activeIndex - 1
                  ? 'tab-label active-left'
                  : index === activeIndex + 1
                  ? 'tab-label active-right'
                  : 'tab-label'
              }>
              {item.label}
            </span>
          }
        />
      ))}
    </Tabs>
  )
})

TabFilter.defaultProps = {
  type: 'card',
  className: '',
}

export default TabFilter
