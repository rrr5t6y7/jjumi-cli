import React from 'react'
import { Spin, Tabs, Checkbox, Table } from 'antd'
import { tryExecute, preventableFn } from 'toss.utils/base'
import { requestService, requestURI } from 'toss.service'
import { TableBasePage } from 'toss.components'
import ModalTrigger from './ModalTrigger'
import Importer from './Importer'
import { lang } from 'toss.utils/lang'
import './TablePicker.scss'

const defaultDataMapper = data => data.data
const defaultCompletionChecker = item => false
const emptyTableData = { list: [], total: 0 }

export class EmbedTablePicker extends TableBasePage {
  static defaultProps = {
    className: '', // 组件附加样式名
    readOnly: false, // 只读模式
    allowShowSelectedOnly: true, // 是否支持“仅显示已选”
    defaultState: {}, // 组件默认state定义
    defaultSearchParams: {}, // 默认搜索参数定义
    searchFields: [], // 搜索项定义
    searchBarProps: {}, // 搜索栏组件属性
    tableProps: {}, // 表格属性
    rowKey: 'id', // 表格唯一键定义
    rowSelection: {
      // 表格选择列定义
      columnWidth: 40,
    },
    selectable: true, // 是否可选
    maxLength: null, // 最大可选数量
    disabledKeys: [], // 禁用的keys
    columns: [], // 表格列定义
    paginationProps: { showSizeChanger: false }, // 表格分页组件属性
    sortable: false, // 是否支持排序
    importable: true, // 是否可导入
    importerProps: {}, // 导入组件属性，参考Importer.jsx
    importedDataFieldName: 'successItems', // 导入成功响应数据中的数据列字段名
    autoLoadData: true, // 是否在组件加载完成或active属性首次变为true之后加载数据
    dataLoader: null, // 列表数据加载函数
    serviceName: null, // 列表函数加载服务名
    serviceURI: null, // 列表数据加载服务URI
    selectedDataLoader: null, // 仅已选数据加载函数
    selectedServiceName: null, // 仅已选数据加载服务名
    selectedServiceURI: null, // 仅已选数据加载服务URI
    selectedKeysName: 'includes', // 加载仅已选数据时，已选key的字段名
    dataMapper: defaultDataMapper, // 列表数据map函数
    selectedDataMapper: defaultDataMapper, // 已选数据map函数
    itemCompletionChecker: defaultCompletionChecker, // 用于校验列表项目数据是否完成(用于数据补全，但是这个功能仅适用于没有搜索条件的场景)
    loadingTip: lang('加载中'), // 表格数据加载中提示
    selectTabTitle: lang('选择数据'), // 列表tab标题
    importTabTitle: lang('导入数据'), // 导入tab标题
    disableAllRow: false, // 禁止选择数据
    headerTipContent: null, // 选择数据tab页头部自定义内容
    importerHeaderTipContent: null, // 导入数据tab页头部自定义内容
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.value !== prevState.selectedItems) {
      return {
        selectedItems: nextProps.value || [],
        selectedItemKeys: nextProps.value?.map(item => item[nextProps.rowKey]) || [],
      }
    }

    return null
  }

  keepBreadcrumb = true
  withHeaderFooter = false

  getDefaultState = () => {
    return {
      resetKey: Date.now(),
      showSelectedOnly: false,
      ...this.props.defaultState,
    }
  }

  getDefaultSearchParams = () => {
    return this.props.defaultSearchParams
  }

  getSearchParams = searchParams => {
    return this.props?.getSearchParams ? this.props?.getSearchParams(searchParams, this.props, this.state) : searchParams
  }

  getSearchFields = () => {
    return tryExecute(this.props.searchFields, this.props, this.state)
  }

  getSearchBarProps = () => {
    return tryExecute(this.props.searchBarProps, this.props, this.state)
  }

  getTableProps = () => {
    return tryExecute(this.props.tableProps, this.props, this.state)
  }

  getTableRowKey = () => {
    return (this.tableRowKey = tryExecute(this.props.rowKey, this.props, this.state))
  }

  getTableSelectable = () => {
    return tryExecute(this.props.selectable, this.props, this.state) && !this.props.readOnly
  }

  getDisabledItemKeys = () => {
    return tryExecute(this.props.disabledKeys, this.props, this.state)
  }

  getTableColumns = () => {
    return tryExecute(this.props.columns, this.props, this.state)
  }

  getSortable = () => {
    return this.state.showSelectedOnly && this.props.sortable && !this.props.readOnly
  }

  getImportable = () => {
    return this.props.importable && !this.props.readOnly
  }

  getItemNeedCompletion = (item, index, array) => {
    return !this.props.itemCompletionChecker(item, index, array)
  }

  getTableCheckboxProps = record => {
    const { maxLength, disableAllRow, value = [] } = this.props

    return {
      disabled:
        this.__disabledKeys.includes(record[this.tableRowKey]) ||
        disableAllRow ||
        (maxLength !== null &&
          maxLength >= 0 &&
          value.length >= maxLength &&
          !value.find(item => item[this.tableRowKey] === record[this.tableRowKey])),
    }
  }

  getTableRowSelection = () => {
    return tryExecute(this.props.rowSelection, this.props, this.state)
  }

  getPaginationProps = () => {
    return tryExecute(this.props.paginationProps, this.props, this.state)
  }

  handleSearchBarReset = () => {
    this.resetSearchParams(this.loadTableData)
    this.setState({ resetKey: Date.now() })
  }

  handleConfirmSearch = searchParams => {
    this.updateSearchParams({ ...searchParams, ...this.state.tempSearchParams, pageNum: 1 }, true)
  }

  handleSortChange = nextSelectedItems => {
    preventableFn(this.props.onChange, nextSelectedItems, 'sort-items').then(this.loadTableData)
  }

  handleToggleShowSelectedOnly = () => {
    const currentTableData = this.state.tableData

    this.setState({ showSelectedOnly: !this.state.showSelectedOnly, tableData: emptyTableData }, () => {
      if (this.state.showSelectedOnly) {
        const { selectedItems, searchParams } = this.state
        const { pageNum, pageSize } = searchParams
        // this.__cachedPageNum = pageNum
        // this.__cachedTableData = currentTableData
        if (selectedItems.some(this.getItemNeedCompletion)) {
          this.updateSearchParams({ ...this.state.tempSearchParams, pageNum: 1 }, true)
        } else {
          this.setState({
            tableData: {
              list: selectedItems.slice(0, pageSize),
              total: selectedItems.length,
            },
          })
        }
      } else {
        this.updateSearchParams({ ...this.state.tempSearchParams, pageNum: 1 }, true)
        // if (this.__cachedTableData && this.__cachedPageNum) {
        //   this.setState({ tableData: this.__cachedTableData })
        //   this.updateSearchParams({ pageNum: this.__cachedPageNum }, false)
        //   this.__cachedPageNum = null
        //   this.__cachedTableData = null
        // }
      }
    })
  }

  handleItemSelect = (record, selected) => {
    let nextSelectedItems = []
    const { selectedItems } = this.state
    const tableRowKey = this.getTableRowKey()

    // 设置了maxLength且已选项目达到熟练限制时，禁止再选择
    if (selected && this.props.maxLength && selectedItems.length >= this.props.maxLength) {
      return false
    }

    if (selected) {
      if (this.props.rowSelection?.type === 'radio') {
        nextSelectedItems = [record]
      } else {
        nextSelectedItems = [...selectedItems, record].filter((item, index, array) => {
          return array.findIndex(subItem => subItem[tableRowKey] === item[tableRowKey]) === index
        })
      }
    } else {
      nextSelectedItems = selectedItems.filter(item => item[tableRowKey] !== record[tableRowKey])
    }

    const nextSelectedItemKeys = nextSelectedItems.map(item => item[tableRowKey])

    if (tryExecute(this.props.onChange, nextSelectedItems, 'single-item') !== false) {
      this.setState({
        valueChanged: true,
        selectedItems: nextSelectedItems,
        selectedItemKeys: nextSelectedItemKeys,
      })
    }
  }

  handleWholePageItemsSelect = (selected, records, changeRecords) => {
    // 设置了maxLength时禁止当页全选
    if (this.props.maxLength > 0) {
      return false
    }

    let nextSelectedItems = []
    const { selectedItems } = this.state
    const tableRowKey = this.getTableRowKey()

    if (selected) {
      nextSelectedItems = [...selectedItems, ...changeRecords].filter((item, index, array) => {
        return array.findIndex(subItem => subItem[tableRowKey] === item[tableRowKey]) === index
      })
    } else {
      nextSelectedItems = selectedItems.filter(item => {
        return !changeRecords.find(subItem => subItem[tableRowKey] === item[tableRowKey])
      })
    }

    const nextSelectedItemKeys = nextSelectedItems.map(item => item[tableRowKey])

    if (tryExecute(this.props.onChange, nextSelectedItems, 'page-items') !== false) {
      this.setState({
        valueChanged: true,
        selectedItems: nextSelectedItems,
        selectedItemKeys: nextSelectedItemKeys,
      })
    }
  }

  handleImport = data => {
    preventableFn(this.props.importerProps?.onImport, data).then(result => {
      // onImport中可以返回一个对象来拦截导入数据
      const tableRowKey = this.getTableRowKey()
      const importedResult = typeof result === 'object' ? result : data
      const importedTableData = (importedResult[this.props.importedDataFieldName] || []).map(item =>
        typeof item === 'object' ? item : { [tableRowKey]: item }
      )
      const { selectedItems } = this.state
      const nextSelectedItems = [...selectedItems, ...importedTableData].filter((item, index, array) => {
        return array.findIndex(subItem => subItem[tableRowKey] === item[tableRowKey]) === index
      })
      const nextSelectedItemKeys = nextSelectedItems.map(item => item[tableRowKey])

      if (tryExecute(this.props.onChange, nextSelectedItems, 'import-items') !== false) {
        this.setState({
          valueChanged: true,
          selectedItems: nextSelectedItems,
          selectedItemKeys: nextSelectedItemKeys,
        })
      }
    })
  }

  tableDataLoader = async searchParams => {
    const { tableData, showSelectedOnly, selectedItems, selectedItemKeys } = this.state
    const {
      readOnly,
      serviceName,
      serviceURI,
      dataLoader,
      dataMapper,
      selectedKeysName,
      selectedServiceName,
      selectedServiceURI,
      selectedDataLoader,
      selectedDataMapper,
    } = this.props

    const ifShowSelectedOnly = readOnly || showSelectedOnly
    const nextSearchParams = this.getSearchParams(
      ifShowSelectedOnly
        ? {
            ...searchParams,
            [selectedKeysName]: selectedItemKeys,
          }
        : searchParams
    )

    let result = {
      list: [],
      total: 0,
    }

    if (ifShowSelectedOnly) {
      if (!selectedItemKeys || !selectedItemKeys.length) {
        result = {
          list: [],
          total: 0,
        }
      } else if (selectedDataLoader) {
        result = selectedDataMapper(await selectedDataLoader(nextSearchParams, tableData))
      } else if (selectedServiceName) {
        result = selectedDataMapper(await requestService(selectedServiceName, nextSearchParams))
      } else if (selectedServiceURI) {
        result = selectedDataMapper(await requestURI(selectedServiceURI, nextSearchParams))
      } else {
        // 如果未指定已选项加载功能，则使用本地已选项目作为数据源
        result = {
          list: selectedItems.slice((nextSearchParams.pageNum - 1) * nextSearchParams.pageSize, nextSearchParams.pageNum * nextSearchParams.pageSize),
          total: selectedItems.length,
        }
      }
    } else if (dataLoader) {
      result = dataMapper(await dataLoader(nextSearchParams))
    } else if (serviceName) {
      result = dataMapper(await requestService(serviceName, nextSearchParams))
    } else if (serviceURI) {
      result = dataMapper(await requestURI(serviceName, nextSearchParams))
    } else {
      console.warn('未指定请求服务名(serviceName)或服务地址(serviceURI)或数据加载器(dataLoader)')
    }

    // 如果ifShowSelectedOnly情况发生了变化，阻止使用加载到的数据渲染（tossjs >= 0.1.33）
    if (ifShowSelectedOnly !== (this.props.readOnly || this.state.showSelectedOnly)) {
      return false
    }

    return result
  }

  componentDidMount() {
    super.componentDidMount()

    // 按需自动加载数据
    if (this.props.active !== false) {
      this.__actived = true
      if (this.props.autoLoadData) {
        this.loadTableData()
      }
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.readOnly !== prevProps.readOnly) {
      this.updateSearchParams({ ...this.state.tempSearchParams, pageNum: 1 })
    }

    if (this.props.active && !prevProps.active && this.props.autoLoadData && !this.__actived) {
      // first time active.
      this.__actived = true
      this.loadTableData()
    }
  }

  render() {
    const {
      readOnly,
      maxLength,
      allowShowSelectedOnly,
      className,
      selectTabTitle,
      importTabTitle,
      loadingTip,
      importerProps,
      subHeaderExtraContent,
      headerTipContent,
      importerHeaderTipContent,
    } = this.props
    const { loading, showSelectedOnly } = this.state
    const withMaxLengthClassName = maxLength > 0 ? 'with-maxlength' : ''

    if (this.getImportable()) {
      return (
        <div className={`lz-embed-table-picker with-import ${withMaxLengthClassName} ${className}`}>
          <Spin className="lz-centered-spinning" spinning={loading} tip={loadingTip} />
          <Tabs className="table-tab" defaultActiveKey="select">
            <Tabs.TabPane tab={selectTabTitle} key="select">
              <div className="select-tab-content">
                <div>{headerTipContent}</div>
                {this.renderSearchBar({ className: 'inside-modal' })}
                {(allowShowSelectedOnly || subHeaderExtraContent) && (
                  <div className="sub-header">
                    <div className="left">
                      {allowShowSelectedOnly && (
                        <Checkbox checked={showSelectedOnly} onChange={this.handleToggleShowSelectedOnly}>
                          <span>{lang('仅显示已选项')}</span>
                        </Checkbox>
                      )}
                    </div>
                    <div className="right">{subHeaderExtraContent}</div>
                  </div>
                )}
                {this.renderDataTable({ rowKey: this.getTableRowKey() })}
              </div>
            </Tabs.TabPane>
            <Tabs.TabPane tab={importTabTitle} key="import">
              <div>{importerHeaderTipContent}</div>
              <div className="import-tab-content">
                <Importer {...importerProps} onImport={this.handleImport} />
              </div>
            </Tabs.TabPane>
          </Tabs>
        </div>
      )
    }

    return (
      <div className={`lz-embed-table-picker ${withMaxLengthClassName} ${className}`}>
        <Spin className="lz-centered-spinning" spinning={loading} tip={loadingTip} />
        {this.renderSearchBar({ className: 'inside-modal' })}
        {((!readOnly && allowShowSelectedOnly) || subHeaderExtraContent) && (
          <div className="sub-header">
            <div className="left">
              {!readOnly && allowShowSelectedOnly && (
                <Checkbox disabled={readOnly} checked={showSelectedOnly || readOnly} onChange={this.handleToggleShowSelectedOnly}>
                  <span>{lang('仅显示已选项')}</span>
                </Checkbox>
              )}
            </div>
            <div className="right">{subHeaderExtraContent}</div>
          </div>
        )}
        {this.renderDataTable({ rowKey: this.getTableRowKey() })}
      </div>
    )
  }
}

export default React.memo(
  React.forwardRef((props, ref) => {
    return (
      <ModalTrigger modalClassName="lz-table-picker-modal" entryChildren={props.children} {...props} withContentPadding>
        <EmbedTablePicker className="table-picker-only" ref={ref} />
      </ModalTrigger>
    )
  })
)
