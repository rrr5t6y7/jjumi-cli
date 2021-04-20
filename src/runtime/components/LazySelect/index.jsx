import React from 'react'
import { Icon, Input, Select, Spin, Empty, Divider } from 'antd'
import { throttle } from 'lodash'
import { requestService, requestURI } from 'toss.service'
import './styles.scss'

const defaultDataMapper = data => data
const defaultLocalFilter = (options, keyword) => options.filter(item => item.value === keyword || item.label.includes(keyword))

export default class LazySelect extends React.Component {
  static searchTypes = {
    INLINE: 'inline',
    DROPDOWN: 'dropdown',
  }

  static defaultProps = {
    onReady: () => {}, //第一次加载回调函数，可以拿到该组件实例
    allowClear: true, // 是否允许清除
    showSearch: true, // 是否允许搜索
    searchType: LazySelect.searchTypes.INLINE, // 搜索类型inline或dropdown
    searchPlaceholder: '', // 搜索框placeholder
    showAll: false, // 是否自动加上“全部”选项
    allOptionValue: '', // “全部“选项的值
    allOptionLabel: '全部', // ”全部“选项的标题
    initRequest: false, //是否初始化时加载数据
    pageSize: 10, // 异步加载的每页加载次数
    pageNumFieldName: 'pageNum', // 异步加载时的pageNum字段名
    keywordFieldName: 'keyword', // 搜索时候的关键字字段名
    requestParams: {}, // 额外的请求参数
    defaultOptions: [], // 指定默认的选项列表
    dataMapper: defaultDataMapper, // 加载数据转换函数
    useLocalFilter: false, // 是否使用本地搜索
    localFilter: defaultLocalFilter, // 本地搜索函数，默认使用value精确匹配或label模糊匹配
  }

  constructor(props) {
    super(props)
    // this.requestData = throttle(this.requestData, 600)
    this.selectRef = React.createRef()
    this.dropdownInputRef = React.createRef()
    // this.state = {
    //   defaultValue: '',
    //   dropdownOpened: false,
    //   searchKeyword: '',
    // }
    this.init()
  }

  init = () => {
    this.lastRequestId = 0
    this.state = {
      defaultValue: this.props.defaultValue,
      dropdownOpened: false,
      searchKeyword: '',
      pageNum: 1,
      options: [],
      value: undefined,
      hasNextPage: true,
      requesting: false,
    }
    this.requestData = throttle(this.requestData, 600)
  }
  onReset = () => {
    this.init()
  }
  onReady = () => {
    const { onReady, initRequest } = this.props
    onReady(this)
    if (initRequest) {
      this.requestData('', false)
    }
  }

  componentDidMount() {
    // this.setState({
    //   defaultValue: this.props.defaultValue,
    // })
    this.onReady()
  }

  requestData(keyword, isLoadMore) {
    this.lastRequestId += 1

    const lastRequestId = this.lastRequestId
    const { options, pageNum, hasNextPage } = this.state
    const {
      pageSize,
      dataMapper,
      dataLoader,
      serviceName,
      serviceURI,
      pageNumFieldName,
      keywordFieldName,
      requestParams: extRequestParams,
    } = this.props

    if (!dataMapper && !serviceName && !serviceURI) {
      return false
    }

    const requestParams = {
      pageSize,
      [keywordFieldName]: keyword,
      ...extRequestParams,
    }
    let requestFn = null

    if (isLoadMore) {
      if (!hasNextPage) {
        return false
      }
      requestParams[pageNumFieldName] = pageNum
      this.setState({ requesting: true })
    } else {
      requestParams[pageNumFieldName] = 1
      this.setState({
        options: [],
        keyword: keyword,
        pageNum: 1,
        hasNextPage: true,
        requesting: true,
      })
    }

    let requester = null

    if (dataLoader) {
      requester = dataLoader(requestParams)
    } else if (serviceName) {
      requester = requestService(serviceName, requestParams)
    } else if (serviceURI) {
      requester = requestURI(serviceURI, requestParams)
    } else {
      return Promise.reject({ code: 404, message: '未指定有效的dataLoader/serviceName/serviceURI，无法发起请求', data: null })
    }

    if (!requester.then) {
      return Promise.reject({ code: 404, message: 'dataLoader需要返回一个Promise,或者是一个async函数', data: null })
    }

    requester
      ?.then(res => {
        if (lastRequestId !== this.lastRequestId) {
          return
        }

        const { code, data } = res
        const { hasNextPage = true } = data
        const newOptions = dataMapper(data.list)

        if (isLoadMore) {
          this.setState({
            options: [...options, ...newOptions],
            pageNum: newOptions.length > 0 ? requestParams[pageNumFieldName] + 1 : requestParams[pageNumFieldName],
            hasNextPage: hasNextPage,
            requesting: false,
          })
        } else {
          this.setState({
            options: newOptions,
            pageNum: newOptions.length > 0 ? requestParams[pageNumFieldName] + 1 : requestParams[pageNumFieldName],
            hasNextPage: hasNextPage,
            requesting: false,
          })
        }
      })
      ?.catch(error => {
        console.warn(error)
        this.setState({
          requesting: false,
        })
      })
  }

  handleDropdownExpand = currentOpened => {
    if (this.inputFocusing) {
      return false
    }

    this.setState({
      dropdownOpened: currentOpened,
    })

    if (!this.state.options || this.state.options.length === 0) {
      this.requestData('', false)
    }
  }

  requestDataForNewKeyword = keyword => {
    this.handleSearch(keyword)
  }

  handleSearch = keyword => {
    if (this.props.useLocalFilter && this.props.localFilter) {
      this.setState({ keyword })
    } else {
      this.requestData(keyword, false)
    }
  }

  requestDataForMorePage = event => {
    const offsetHeight = parseInt(event.target.scrollTop + event.target.offsetHeight)
    if (offsetHeight === event.target.scrollHeight) {
      this.requestData(this.state.keyword, true)
    }
  }

  handleBlur = () => {
    const { showSearch, searchType } = this.props

    if (this.inputFocusing) {
      return false
    }

    this.setState({
      dropdownOpened: false,
    })
  }

  handleChange = value => {
    !value && this.state.keyword && this.handleSearch('')
    this.props.onChange && this.props.onChange(value)
    this.handleBlur()
  }

  handleDropdownInputBlur = event => {
    this.inputFocusing = false
    this.handleBlur()
  }

  handleDropdownInputMouseDown = event => {
    this.inputFocusing = true
    this.dropdownInputRef?.current?.focus()
    this.selectRef?.current?.focus()
  }

  handleDropdownInputInput = event => {
    this.handleSearch(event.target.value)
  }

  getDropdownOpen = () => {
    return this.state.dropdownOpened
  }

  getDropdownRender = () => {
    const { showSearch, searchType, searchPlaceholder } = this.props

    if (showSearch && !window.isIE && searchType === LazySelect.searchTypes.DROPDOWN) {
      return (menu, props) => {
        return (
          <div className="lz-component-lazy-selector-dropdown">
            <div className="lz-dropdown-searcher">
              <Icon type="search" />
              <Input
                ref={this.dropdownInputRef}
                placeholder={searchPlaceholder}
                onBlur={this.handleDropdownInputBlur}
                onMouseDown={this.handleDropdownInputMouseDown}
                onChange={this.handleDropdownInputInput}
              />
            </div>
            {menu}
          </div>
        )
      }
    }
  }

  render() {
    const {
      className,
      disabled,
      showSearch,
      searchType,
      value,
      showAll,
      allOptionValue,
      allOptionLabel,
      allowClear,
      placeholder,
      selectorProps,
      defaultOptions,
      useLocalFilter,
      localFilter,
    } = this.props
    const { requesting, keyword, options = [] } = this.state

    let renderedOptions = options
      .concat(defaultOptions)
      .filter((item, index, array) => array.findIndex(subItem => subItem.value === item.value) === index)

    if (useLocalFilter && localFilter && keyword) {
      renderedOptions = localFilter(renderedOptions, keyword)
    }

    return (
      <Select
        value={value}
        disabled={disabled}
        filterOption={false}
        allowClear={allowClear}
        showSearch={showSearch && (searchType === LazySelect.searchTypes.INLINE || window.isIE)}
        placeholder={placeholder}
        onChange={this.handleChange}
        onBlur={this.handleBlur}
        onSearch={this.handleSearch}
        onPopupScroll={this.requestDataForMorePage}
        onDropdownVisibleChange={this.handleDropdownExpand}
        dropdownRender={this.getDropdownRender()}
        open={this.getDropdownOpen()}
        className={`lz-component-lazy-selector ${className}`}
        notFoundContent={requesting ? <Spin size="small" /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={lang('暂无数据')} />}
        {...selectorProps}>
        {showAll ? <Select.Option value={allOptionValue}>{allOptionLabel}</Select.Option> : null}
        {renderedOptions.map(item => (
          <Select.Option title={item.label} value={item.value} key={item.value}>
            {item.label}
          </Select.Option>
        ))}
      </Select>
    )
  }
}
