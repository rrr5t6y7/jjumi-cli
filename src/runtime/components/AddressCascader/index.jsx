/*
 * @Author: superhu
 * @Date: 2020-06-09 11:42:39
 * @Last Modified by: superhu
 * @Last Modified time: 2020-07-22 14:48:28
 */

import React, { PureComponent } from 'react'
import { TabFilter } from 'toss.components'
import { Select, Row, Col, Spin } from 'antd'
import {
  province,
  tabFilter,
  switchTab,
  outChangeData,
  clearSelectedOptions,
  getCurrentSelect,
} from './utils'
import './index.scss'

export default class index extends PureComponent {
  // 显示id的字段名称
  valueKey = 'value'
  // 现在文案的字段名称
  labelKey = 'label'
  // 子级key
  childrenKey = 'children'

  constructor(props) {
    super(props)
    const { valueKey = 'value', labelKey = 'label', childrenKey = 'children' } = props
    this.valueKey = valueKey
    this.labelKey = labelKey
    this.childrenKey = childrenKey

    this.state = {
      // tab的值
      tabItems: [province],
      // 当前选择的tab
      activityTab: 'province',
      // 当前显示的值map
      activityObj: {
        province: [],
        city: [],
        area: [],
      },
      selectedOptions: {},
      selectId: -1,
      open: false,
    }
  }

  componentDidUpdate(prevProps) {
    const value = prevProps.value
    const newValue = this.props.value
    if (value && Array.isArray(value) && value.length > 0) {
      const prevIds = value.map((item) => `${item[this.valueKey]}`)
      const ids = newValue.map((item) => `${item[this.valueKey]}`)
      if (prevIds.length !== ids.length || prevIds.toString() != ids.toString()) {
        this.forceUpdateCurrentSelect()
      }
    }
  }

  handleTabChange = (value) => {
    // 返回新的tabItems
    const list = tabFilter(value)
    this.setState({
      tabItems: list,
      activityTab: value,
      selectId: -1,
    })
  }

  onItemClick = (item) => {
    // console.log('onItemClick', item)
    const { activityTab, activityObj = {}, selectedOptions } = this.state
    // 选中的id
    const selectKey = item[this.valueKey]
    // 切换tab key
    const tabKey = switchTab(activityTab)
    // 1.设置selectedOptions 2.清空掉多余的selectedOptions数据
    // console.log('selectedOptions', selectedOptions)
    let newSelectedOptions = { ...selectedOptions }
    newSelectedOptions[activityTab] = item
    newSelectedOptions = clearSelectedOptions(newSelectedOptions, activityTab)
    // console.log('newSelectedOptions', newSelectedOptions)

    if (tabKey && Array.isArray(item[this.childrenKey]) && item[this.childrenKey].length > 0) {
      const children = item[this.childrenKey]
      // 切换tab的值
      const tabList = tabFilter(tabKey)
      // 记录选择的数据
      let newActivityObj = { ...activityObj }
      newActivityObj[tabKey] = children

      this.setState({
        selectId: selectKey,
        activityTab: tabKey,
        tabItems: tabList,
        activityObj: newActivityObj,
        selectedOptions: newSelectedOptions,
      })
    } else {
      const data = outChangeData(newSelectedOptions, activityTab, this.valueKey, this.labelKey)
      this.setState(
        {
          selectId: selectKey,
          open: false,
          selectedOptions: newSelectedOptions,
        },
        () => {
          const { onChange } = this.props
          if (onChange) {
            onChange(data.list)
          }
        }
      )
    }
  }

  /**
   * 渲染内容
   */
  renderContent = () => {
    const { options = [] } = this.props
    const { selectId, activityObj = {}, activityTab } = this.state
    let showOptions = activityObj[activityTab]
    if (!showOptions || showOptions.length === 0) {
      showOptions = options
    }
    return (
      <Row>
        {showOptions.map((item) => {
          return (
            <Col
              span={6}
              key={item[this.valueKey]}
              className="ac-content-item"
              onClick={() => this.onItemClick(item)}>
              <span
                className={`${
                  selectId == item[this.valueKey]
                    ? 'ac-content-item-text-active'
                    : 'ac-content-item-text'
                }`}>
                {item[this.labelKey]}
              </span>
            </Col>
          )
        })}
      </Row>
    )
  }

  onDropdownVisibleChange = (open) => {
    this.initSelect(open)
    this.setState({
      open,
    })
  }

  initSelect = (open) => {
    const { selectId } = this.state
    const { value, options } = this.props
    if (
      open &&
      Array.isArray(value) &&
      value.length > 0 &&
      Array.isArray(options) &&
      options.length > 0 &&
      selectId === -1
    ) {
      this.forceUpdateCurrentSelect()
    }
  }

  forceUpdateCurrentSelect = () => {
    const { value, options } = this.props
    const result = getCurrentSelect(value, options, this.valueKey, this.childrenKey)
    this.setState({
      selectId: result.selectId,
      activityTab: result.activityTab,
      tabItems: result.tabItems,
      activityObj: {
        province: result.province,
        city: result.city,
        area: result.area,
      },
      selectedOptions: result.selectedOptions,
    })
  }

  getShowValue = (value) => {
    let showValue
    if (value && value.length > 0) {
      const len = value.length
      showValue = ''
      for (let index = 0; index < len; index++) {
        const item = value[index]
        showValue = showValue.concat(`/${item[this.labelKey]}`)
      }
      const lasterItem = value[len - 1]
      this.selectId = lasterItem[this.valueKey]
      switch (len) {
        case 1:
          this.activityTab = 'province'
          break
        case 2:
          this.activityTab = 'city'
          break
        case 3:
          this.activityTab = 'area'
          break
        default:
          break
      }
      showValue = showValue.substr(1)
    }
    return showValue
  }

  dropdownRender = () => {
    const { tabItems = [], activityTab } = this.state

    const { loading } = this.props

    if (!loading) {
      return (
        <div onMouseDown={(e) => e.preventDefault()}>
          <TabFilter onChange={this.handleTabChange} value={activityTab} items={tabItems} />
          {this.renderContent()}
        </div>
      )
    } else {
      return <Spin spinning={true} size="small" />
    }
  }

  render() {
    const { open } = this.state
    const { className, width = 300, value = [], ...otherProps } = this.props

    // console.log('value', value)
    const showValue = this.getShowValue(value)

    return (
      <div className={`address-cascader ${className}`}>
        <Select
          {...otherProps}
          style={{ width }}
          open={open}
          value={showValue}
          onDropdownVisibleChange={this.onDropdownVisibleChange}
          placeholder="省/市/区"
          dropdownRender={this.dropdownRender}></Select>
      </div>
    )
  }
}
