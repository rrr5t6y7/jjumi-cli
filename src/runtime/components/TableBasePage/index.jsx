import React from 'react'
import moment from 'moment'
import { Input, Pagination, Checkbox, Table } from 'antd'
import { SearchBar } from '@lingzhi/react-components'
import BasePage from 'toss.components/BasePage'
import TabFilter from 'toss.components/TabFilter'
import TableEmptyText from 'toss.components/TableEmptyText'
import { isEmptyValue, patterns } from 'toss.utils/validate'
import { lang } from 'toss.utils/lang'
import './styles.scss'

const totalFormatter = total => <span>共{total}条</span>

const defaultState = {
  searchParams: {
    pageNum: 1,
    pageSize: 10,
  },
  tempSearchParams: {},
  tableData: {
    list: [],
    total: 0,
  },
  tableDataLoaded: false,
  selectedItems: [],
  selectedItemKeys: [],
  operatingItems: {},
  loading: false,
}

const defaultPaginationProps = {
  showTotal: totalFormatter,
  showSizeChanger: true,
  showQuickJumper: true,
}

const defaultSearchBarProps = {
  searchButtonText: lang('筛选'),
  resetButtonText: lang('重置'),
  expandButtonText: lang('展开'),
  collapseButtonText: lang('收起'),
}

/**
 * 扩展的表格头部和尾部的Checkbox组件，行为与Ant Design Table表头中的Checkbox一致
 */
const TableSelectionCheckbox = React.memo(
  ({ dataSource, rowKey, selectedKeys, disabledKeys, withPagination, pageNum, pageSize, onChange, ...props }) => {
    const currentPageItems = (withPagination && dataSource.length > pageSize
      ? dataSource.slice((pageSize - 1) * pageNum, pageSize)
      : dataSource
    ).filter(item => !disabledKeys.includes(item[rowKey]))

    const currentPageItemKeys = currentPageItems.map(item => item[rowKey])

    let indeterminate = false
    let checked = false
    let allChecked = true

    const currentPageUnselectedKeys = React.useMemo(() => {
      return currentPageItemKeys.filter(key => {
        if (disabledKeys.includes(key)) {
          return false
        }
        if (!selectedKeys.includes(key)) {
          allChecked = false
          return true
        } else {
          checked = true
          indeterminate = true
        }
      })
    }, [currentPageItemKeys, selectedKeys, disabledKeys])

    allChecked && (indeterminate = false)

    const handleChange = React.useCallback(() => {
      onChange && onChange(allChecked ? currentPageItemKeys : currentPageUnselectedKeys, !allChecked)
    }, [allChecked, currentPageItemKeys, currentPageUnselectedKeys])

    return (
      <>
        <Checkbox indeterminate={indeterminate} checked={checked} onChange={handleChange} {...props} />
        <span onClick={handleChange} className="select-title">
          {lang('当页全选')}
        </span>
      </>
    )
  }
)

export default class TableBasePage extends BasePage {
  constructor(props) {
    super(props)

    /**
     * 合并处理页面初始状态和搜索栏初始状态
     */
    this.state = {
      ...defaultState,
      ...this.getDefaultState(),
      searchParams: {
        ...defaultState.searchParams,
        ...this.getDefaultSearchParams(),
      },
    }

    this.__disabledKeys = []

    /**
     * 绑定SearchBar组件的实例
     */
    this.__searchBarRef = React.createRef()
  }

  /**
   * 指定跨Tab页业务通信频道[string]
   * 例如：在使用某一频道的FormBasePage页面中执行`this.publishUpdate()`将会通知使用相同频道的TableBasePage刷新列表页
   */
  businessChannel = null

  /**
   * **用于设置复合参数的展开规则**
   * 例如：
   * 搜索栏中若使用了StoreCascader(门店选择器)组件，name是store，
   * 那么最终的搜索字段中会多出一个store属性，它是一个对象，包含包含region、corporation、store三个字段
   * 那么就可以在此定义一个展开函数，用于将这个store下面的三个属性展开到搜索字段中:
   * searchParamsExtractor = {
   *   store: store => {
   *     return {
   *       regionCode: store.region,
   *       corporationCode: store.corporation,
   *       storeCode: store.store,
   *     }
   *   },
   * }
   */
  searchParamsExtractor = {}

  /**
   * 指定搜索栏中的日期类项目的格式化规则
   * 默认为'YYYY-MM-DD HH:mm:ss'
   * 指定为false，则转换成毫秒时间戳
   */
  formatMomentData = 'YYYY-MM-DD HH:mm:ss'

  /**
   * 指定表格中的数据key值
   */
  tableRowKey = 'id'

  /**
   * 指定是否在表格不可选的情况下依然预留选择框那一列的宽度
   */
  withSelectionRow = false

  /**
   * 指定表格是否使用高级的头部和尾部
   * 此项为false时，renderTableHeader和renderTableFooter将不会生效
   */
  withHeaderFooter = true

  /**
   * 指定表格是否显示分页按钮
   */
  withPagination = true

  /**
   * 指定Tab栏对应的搜索项字段(searchParams.type)
   */
  tabFilterFieldName = 'type'

  /**
   * 指定分页数量配置项
   */
  pageSizeOptions = ['10', '25', '50', '100']

  /**
   * 处理跨Tab页面通信消息
   */
  handleBroadcast = message => {
    if (message && message.channel === this.businessChannel) {
      if (message.type === 'FORM_PAGE_UPDATE') {
        this.isAlive && this.loadTableData()
      }
    }
  }

  /**
   * 实例方法，可主动调用用于重置整个页面的状态
   */
  resetPageData = () => {
    return this.setState({
      ...defaultState,
      ...this.getDefaultState(),
    })
  }

  /**
   * 实例方法，可主动调用用于重置整个搜索栏状态
   */
  resetSearchParams = callback => {
    this.setState(
      {
        searchParams: {
          ...defaultState.searchParams,
          ...this.getDefaultSearchParams(),
          pageSize: this.state.searchParams.pageSize,
        },
      },
      callback
    )
  }

  /**
   * 内部方法，用于组件内部处理临时的搜索栏状态
   */
  updateTempSearchParams = changedParams => {
    this.setState({
      tempSearchParams: {
        ...this.state.tempSearchParams,
        ...changedParams,
      },
    })
  }

  /**
   * 内部方法，用于组件内部处理搜索栏状态
   */
  updateSearchParams(changedParams, loadData = true) {
    this.setState(
      {
        searchParams: {
          ...this.state.searchParams,
          ...changedParams,
        },
      },
      () => {
        loadData && this.loadTableData()
      }
    )
  }

  /**
   * 内部方法，用于组件内部处理搜索栏组件的变更事件
   */
  handleSearchParamsChange = data => {
    let changedParams = {}
    Object.keys(data).forEach(key => (changedParams[key] = data[key].value))
    this.updateTempSearchParams(changedParams)
  }

  /**
   * 内部方法，用于组件内部处理搜索栏重置事件
   */
  handleSearchBarReset = () => {
    this.resetSearchParams(this.loadTableData)
  }

  /**
   * 内部方法，用于组件内部处理搜索栏搜索事件
   */
  handleConfirmSearch = searchParams => {
    this.setState({ selectedItemKeys: [], selectedItems: [] })
    this.updateSearchParams({ ...searchParams, ...this.state.tempSearchParams, pageNum: 1 }, true)
  }

  /**
   * 内部方法，用于组件内部处理Tab组件变更事件
   */
  handleTabFilterChange = (tabFilterField, tabFilterFieldName) => {
    this.setState({ tableData: defaultState.tableData })
    this.handleConfirmSearch({ [tabFilterFieldName]: tabFilterField })
  }

  /**
   * 内部方法，用于组件内部处理页码组件变更事件
   */
  handlePageChange = (pageNum, pageSize) => {
    this.updateSearchParams({ pageNum, pageSize }, true)
  }

  /**
   * 内部方法，用于简单分页组件事件处理
   */
  handleSimplePaginationBlur = event => {
    const { pageNum, pageSize } = this.state.searchParams
    const { total } = this.state.tableData

    if (event.target.tagName.toLowerCase() !== 'input') {
      return false
    }

    const nextPageNum = isNaN(event.target.value) ? pageNum : Math.max(1, Math.min(event.target.value, Math.ceil(total / pageSize))) * 1

    if (nextPageNum !== pageNum) {
      this.handlePageChange(nextPageNum, pageSize)
    }
  }

  /**
   * 内部方法，用于组件内部处理表格页码组件变更事件
   */
  handleTablePageChange = ({ current: pageNum, pageSize }) => {
    this.handlePageChange(pageNum, pageSize)
  }

  /**
   * 重写方法，用于处理表格数据加载错误
   */
  handleTableDataLoadFailure = error => {
    console.warn(error)
  }

  /**
   * 重写方法，用于处理表格数据导出错误
   */
  handleTableDataExportFailure = error => {
    console.warn(error)
  }

  /**
   * 重写方法，用于处理排序变更
   */
  handleSortChange = nextSelectedItems => {
    this.setState({
      selectedItems: nextSelectedItems,
      selectedItemKeys: nextSelectedItems.map(item => item[this.tableRowKey]),
    })
  }

  /**
   * 内部方法，用于处理排序输入框输入
   */
  handleInputSort = event => {
    if (event.target.value && !patterns.nonNegativeInteger.test(event.target.value)) {
      event.preventDefault()
    }
  }

  /**
   * 内部方法，用于更新排序
   */
  handleUpdateSort = event => {
    const { selectedItems } = this.state
    const key = event.target.dataset.key
    const nextIndex = +event.target.value
    const currentIndex = +event.target.dataset.index

    if (currentIndex === nextIndex) {
      return false
    }

    const nextSelectedItems = [...selectedItems]
    // 删除当前index的条目
    const currentItem = nextSelectedItems.splice(currentIndex, 1)[0]
    // 插入当前条目到新的index
    nextSelectedItems.splice(nextIndex, 0, currentItem)

    this.handleSortChange(nextSelectedItems)
  }

  /**
   * 内部方法，用于处理单个项目选择事件
   */
  handleItemSelect = (record, selected) => {
    let nextSelectedItems = []
    const { selectedItems } = this.state

    if (selected) {
      nextSelectedItems = [...selectedItems, record].filter((item, index, array) => {
        return array.findIndex(subItem => subItem[this.tableRowKey] === item[this.tableRowKey]) === index
      })
    } else {
      nextSelectedItems = selectedItems.filter(item => item[this.tableRowKey] !== record[this.tableRowKey])
    }

    this.setState({
      selectedItems: nextSelectedItems,
      selectedItemKeys: nextSelectedItems.map(item => item[this.tableRowKey]),
    })
  }

  /**
   * 内部方法，用于处理整页项目选择事件
   */
  handleWholePageItemsSelect = (selected, records, changeRecords) => {
    let nextSelectedItems = []
    const { selectedItems } = this.state

    if (selected) {
      nextSelectedItems = [...selectedItems, ...changeRecords].filter((item, index, array) => {
        return array.findIndex(subItem => subItem[this.tableRowKey] === item[this.tableRowKey]) === index
      })
    } else {
      nextSelectedItems = selectedItems.filter(item => {
        return !changeRecords.find(subItem => subItem[this.tableRowKey] === item[this.tableRowKey])
      })
    }

    this.setState({
      selectedItems: nextSelectedItems,
      selectedItemKeys: nextSelectedItems.map(item => item[this.tableRowKey]),
    })
  }

  /**
   * 内部方法，用于处理整页项目选择事件
   */
  handleCurrentPageSelect = (changedKeys, selected) => {
    let nextSelectedItems = []
    const { selectedItems, tableData } = this.state

    if (selected) {
      nextSelectedItems = [...selectedItems, ...tableData.list.filter(item => changedKeys.includes(item[this.tableRowKey]))]
    } else {
      nextSelectedItems = selectedItems.filter(item => !changedKeys.includes(item[this.tableRowKey]))
    }

    nextSelectedItems = nextSelectedItems.filter((item, index, array) => {
      return array.findIndex(subItem => subItem[this.tableRowKey] === item[this.tableRowKey]) === index
    })

    this.setState({
      selectedItems: nextSelectedItems,
      selectedItemKeys: nextSelectedItems.map(item => item[this.tableRowKey]),
    })
  }

  /**
   * 实例方法，在操作表格某一项时可以调用此方法来来设置操作状态，
   * 并在render中读取该状态进行loading等组件的展示
   */
  toggleOperating = (record, operating) => {
    const { operatingItems } = this.state
    this.setState({
      operatingItems: {
        ...operatingItems,
        [record[this.tableRowKey]]: operating,
      },
    })
  }

  /**
   * 重写方法，用于指定表格数据的加载功能，
   * 需在此函数中返回一个包含list和total的对象
   */
  tableDataLoader = async () => {
    return {
      list: [],
      total: 0,
    }
  }

  /**
   * 重写方法，用于指定表格数据的导出功能
   */
  tableDataExporter = async () => {
    return true
  }

  /**
   * 内部方法，用于组件内部合并处理搜索栏状态
   */
  resloveSearchParams = searchParams => {
    const resolvedSearchParams = {}

    Object.keys(searchParams).forEach(key => {
      if (!isEmptyValue(searchParams[key])) {
        if (this.searchParamsExtractor[key]) {
          const extractedParams = this.searchParamsExtractor[key](searchParams[key])
          Object.keys(extractedParams).forEach(subKey => {
            !isEmptyValue(extractedParams[subKey]) && (resolvedSearchParams[subKey] = extractedParams[subKey])
          })
        } else if (moment.isMoment(searchParams[key])) {
          resolvedSearchParams[key] = this.formatMomentData ? searchParams[key].format(this.formatMomentData) : searchParams[key].valueOf()
        } else if (typeof searchParams[key] === 'string') {
          resolvedSearchParams[key] = searchParams[key].trim()
        } else {
          resolvedSearchParams[key] = searchParams[key]
        }
      }
    })

    return resolvedSearchParams
  }

  /**
   * 实例方法，在搜索栏确定搜索时，会调用此方法，
   * 也可在componentDidMount等合适时机手动调用此方法
   */
  loadTableData = async params => {
    try {
      const { searchParams, tableData } = this.state
      const mergedSearchParams = { ...searchParams, ...params }
      const resolvedSearchParams = this.resloveSearchParams(mergedSearchParams)

      this.setState({ loading: true })
      const nextTableData = await this.tableDataLoader(resolvedSearchParams, mergedSearchParams, tableData)

      if (nextTableData === false) {
        return false
      }

      if (nextTableData && nextTableData.list) {
        const nextTotal = nextTableData.total || nextTableData.list.length
        const maxPageNum = Math.ceil(nextTotal / resolvedSearchParams.pageSize)

        if (maxPageNum > 0 && resolvedSearchParams.pageNum > maxPageNum) {
          this.updateSearchParams({ pageNum: maxPageNum })
          return
        }
        this.setState({ loading: false, tableDataLoaded: true, tableData: nextTableData })
      } else {
        throw {
          code: 500,
          message: '数据错误',
        }
      }

      return nextTableData
    } catch (error) {
      console.warn(error)
      this.setState({ loading: false })
      this.handleTableDataLoadFailure(error)
    }
  }

  /**
   * 实例方法，在“导出”按钮的点击时间中调用
   */
  exportTableData = async () => {
    try {
      const { searchParams, tempSearchParams, tableData } = this.state
      const mergedSearchParams = { ...searchParams, ...tempSearchParams }
      const resolvedSearchParams = this.resloveSearchParams(mergedSearchParams)

      resolvedSearchParams.pageNum = 1
      resolvedSearchParams.pageSize = tableData.total

      this.setState({ exporting: true })
      await this.tableDataExporter(resolvedSearchParams)
      this.setState({ exporting: false })
    } catch (error) {
      this.setState({ exporting: false })
      this.handleTableDataExportFailure(error)
    }
  }

  /**
   * 重写方法
   * 用于设置页面初始状态
   */
  getDefaultState() {
    return {}
  }

  /**
   * 重写方法
   * 用于设置搜索栏初始状态
   */
  getDefaultSearchParams() {
    return {}
  }

  /**
   * 重写方法，用于设置SearchBar组件的属性
   * 注意：也可在`this.renderSearchBar(props)`时设置组件属性
   */
  getSearchBarProps(props) {
    return props
  }

  /**
   * 重写方法
   * 用于指定是否可排序
   */
  getSortable(props) {
    return false
  }

  /**
   * 重写方法，用于指定搜索栏组件的字段
   */
  getSearchFields = () => {
    return []
  }

  /**
   * 重写方法，用于设置表格属性
   */
  getTableProps = props => {
    return props
  }

  /**
   * 重写方法，用于指定表格是否可选择
   */
  getTableSelectable = () => {
    return false
  }

  /**
   * 重写方法，用于指定禁用的列key
   */
  getDisabledItemKeys = () => {
    return []
  }

  /**
   * 重写方法，用于指定表格选择框组件的属性
   */
  getTableCheckboxProps = record => {
    return {
      disabled: this.__disabledKeys.includes(record[this.tableRowKey]),
    }
  }

  /**
   * 重写方法，用于指定表格的列
   */
  getTableColumns = () => {
    return []
  }

  /**
   * 重写方法，用于指定Tab组件的选项
   */
  getTabFilterItems = () => {
    return []
  }

  /**
   * 重写方法，用于指定表格选择框那一列的属性
   */
  getTableRowSelection = () => {
    return {
      columnWidth: 60,
    }
  }

  /**
   * 重写方法，用于表格指定分页组件属性
   */
  getPaginationProps = () => {
    return {}
  }

  /**
   * 内部方法，设置排序列
   */
  getSortColumn = () => {
    const { pageSize, pageNum } = this.state.searchParams

    return {
      title: lang('排序'),
      key: '__inner_sort_column__',
      width: 90,
      render: (_, record) => {
        const itemIndex = this.state.tableData.list.findIndex(item => item[this.tableRowKey] === record[this.tableRowKey])
        return (
          <Input
            data-index={itemIndex}
            defaultValue={itemIndex}
            key={`${itemIndex}_${record[this.tableRowKey]}`}
            data-key={record[this.tableRowKey]}
            className="sort-index-input"
            onBlur={this.handleUpdateSort}
            onChange={this.handleInputSort}
            onPressEnter={this.handleUpdateSort}
          />
        )
      },
    }
  }

  /**
   * (props) => null | JSX
   * 重写方法，用于在指定搜索栏上面部分渲染的内容
   */
  renderSearchBarHeader = props => {
    return null
  }

  /**
   * 实例方法，用于在render中的合适位置渲染搜索栏组件
   */
  renderSearchBar = props => {
    const searchBarItems = this.getSearchFields()
    const searchBarProps = this.getSearchBarProps({ ...defaultSearchBarProps, ...props })
    const customHeader = this.renderSearchBarHeader(props)

    if (searchBarItems && searchBarItems.length === 1 && searchBarItems[0].type?.toLowerCase() === 'input') {
      return (
        <div className="table-page-header tiny-header">
          <div className="custom-header">{customHeader}</div>
          <Input.Search
            className="only-input-search"
            onSearch={value => this.handleConfirmSearch({ [searchBarItems[0].name]: value })}
            {...searchBarItems[0].props}
          />
        </div>
      )
    }

    return (
      <div className="table-page-header">
        {customHeader && <div className="custom-header">{customHeader}</div>}
        <SearchBar
          className="table-page-search-bar"
          items={searchBarItems}
          onChange={this.handleSearchParamsChange}
          onReset={this.handleSearchBarReset}
          onConfirmSearch={this.handleConfirmSearch}
          ref={this.__searchBarRef}
          {...searchBarProps}
        />
      </div>
    )
  }

  /**
   * 实例方法，用于在render中的合适位置渲染Tab栏组件
   */
  renderTabFilter = props => {
    const { tabFilterFieldName = this.tabFilterFieldName } = props || {}
    return (
      <TabFilter
        items={this.getTabFilterItems()}
        value={this.state.searchParams[tabFilterFieldName]}
        onChange={filed => this.handleTabFilterChange(filed, tabFilterFieldName)}
        {...props}
      />
    )
  }

  /**
   * (props) => null | JSX
   * 重写方法，用于指定表格头部的自定义内容
   */
  renderTableHeader = props => {
    return null
  }

  /**
   * (props) => null | JSX
   * 重写方法，用于指定表格尾部的自定义内容
   */
  renderTableFooter = props => {
    return null
  }

  /**
   * 实例方法，用于在render中的合适位置渲染数据表格
   */
  renderDataTable = props => {
    const tableSelectable = this.getTableSelectable()
    const { searchParams, tableDataLoaded, tableData, selectedItemKeys } = this.state
    this.__disabledKeys = this.getDisabledItemKeys()

    const rowSelection =
      this.withSelectionRow || tableSelectable
        ? {
            hideDefaultSelections: true,
            selectedRowKeys: selectedItemKeys,
            getCheckboxProps: this.getTableCheckboxProps,
            onSelect: this.handleItemSelect,
            onSelectAll: this.handleWholePageItemsSelect,
            ...this.getTableRowSelection(),
          }
        : null

    const paginationProps = {
      ...defaultPaginationProps,
      total: tableData.total,
      current: searchParams.pageNum,
      pageSize: searchParams.pageSize,
      pageSizeOptions: [searchParams.pageSize, ...this.pageSizeOptions]
        .filter(item => item >= 0)
        .map(item => item.toString())
        .filter((item, index, array) => array.indexOf(item) === index),
      ...this.getPaginationProps(),
    }

    const showTotal = paginationProps.showTotal

    const tableSelectionCheckbox =
      tableSelectable && this.withHeaderFooter ? (
        <TableSelectionCheckbox
          className="checkbox"
          rowKey={this.tableRowKey}
          dataSource={tableData.list}
          disabledKeys={this.__disabledKeys}
          selectedKeys={selectedItemKeys}
          pageNum={searchParams.pageNum}
          pageSize={searchParams.pageSize}
          withPagination={this.withPagination}
          onChange={this.handleCurrentPageSelect}
        />
      ) : null

    const columns = this.getSortable() ? [this.getSortColumn()].concat(this.getTableColumns()) : this.getTableColumns()

    return (
      <div className="table-page-table-wrapper">
        {this.withHeaderFooter && (
          <div className="table-page-table-header">
            {tableSelectable && (
              <div className="left">
                {tableSelectionCheckbox}
                <span className="selected-count">
                  {lang('已选数量')}
                  {selectedItemKeys.length}
                </span>
              </div>
            )}
            <div className="center">{this.renderTableHeader()}</div>
            {this.withPagination && (
              <div className="right" onBlur={this.handleSimplePaginationBlur}>
                {showTotal && <b className="total-count">{(typeof showTotal === 'function' ? showTotal : totalFormatter)(tableData.total)}</b>}
                <Pagination simple {...paginationProps} onChange={this.handlePageChange} />
              </div>
            )}
          </div>
        )}
        <Table
          className={`table-page-table ${tableSelectable ? 'selectable' : 'non-selectable'}`}
          tableLayout="fixed"
          rowKey={this.tableRowKey}
          dataSource={tableData.list}
          columns={columns}
          pagination={this.withHeaderFooter || !this.withPagination ? false : paginationProps}
          onChange={this.withHeaderFooter ? undefined : this.handleTablePageChange}
          rowSelection={rowSelection}
          locale={{ emptyText: <TableEmptyText dataLoaded={tableDataLoaded} /> }}
          {...this.getTableProps(props)}
        />
        {this.withHeaderFooter && (
          <div className="table-page-table-footer">
            {tableSelectable && (
              <div className="left">
                {tableSelectionCheckbox}
                <span className="selected-count">
                  {lang('已选数量')}
                  {selectedItemKeys.length}
                </span>
              </div>
            )}
            <div className="center">{this.renderTableFooter()}</div>
            {this.withPagination && (
              <div className="right">
                <Pagination {...paginationProps} onShowSizeChange={this.handlePageChange} onChange={this.handlePageChange} />
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  /**
   * 在组件加载时，注册跨Tab页通信处理事件
   */
  componentDidMount() {
    super.componentDidMount()

    if (this.businessChannel) {
      this.subscribeBroadcast(this.handleBroadcast)
    }
  }

  /**
   * 在组件卸载时，注销跨Tab页通信处理事件
   */
  componentWillUnmount() {
    super.componentWillUnmount()

    if (this.businessChannel) {
      this.unsubscribeBroadcast(this.handleBroadcast)
    }
  }
}
