import React from 'react'
import { Button, Modal, Tree, List, Icon, Input } from 'antd'
import { requestService } from 'toss.service'
import { confirm } from 'toss.utils/ui'
import { lang } from 'toss.utils/lang'
import './styles.scss'

const { TreeNode } = Tree
const { Search } = Input

const mapTreeData = tree => {
  let key = null
  let title = null
  return tree.map(node => {
    if (node.dataType == 1) {
      key = node.id
      title = node.displayName
    } else {
      key = node.shopCode
      title = node.shopName
    }
    return {
      ...node,
      key,
      title,
      children: node.children && node.children.length ? mapTreeData(node.children) : [],
    }
  })
}

// 已选门店
const filterSelectedStore = (tree, checkedKeys, selectedStoreItems) => {
  tree.map(node => {
    if (checkedKeys.includes(node.key) && (!node.children || !node.children.length)) {
      selectedStoreItems.push({
        ...node,
        key: node.key,
        title: node.title,
      })
    }
    if (node.children && node.children.length) {
      filterSelectedStore(node.children, checkedKeys, selectedStoreItems)
    }
  })
  return selectedStoreItems
}

// 所有门店key
const getAllStoreKeys = (tree, keys) => {
  tree.map(node => {
    if (!node.children || !node.children.length) {
      keys.push(node.key)
    }
    if (node.children && node.children.length) {
      getAllStoreKeys(node.children, keys)
    }
  })
  return keys
}

// 根据id取到父级
const getParentKey = (key, tree) => {
  let parentKey
  tree.map(node => {
    if (node.children && node.children.length) {
      if (node.children.some(item => item.key === key)) {
        parentKey = node.key
      } else if (getParentKey(key, node.children)) {
        parentKey = getParentKey(key, node.children)
      }
    }
  })
  return parentKey
}

// 扁平数据
const generateList = (tree, dataList) => {
  tree.map(node => {
    const { key, title } = node
    dataList.push({ ...node, key, title })
    if (node.children) {
      generateList(node.children, dataList)
    }
  })
  return dataList
}

const defaultDataMapper = data => Array.isArray(data.treeList) && mapTreeData(data.treeList)

export class InlineStorePicker extends React.PureComponent {
  static defaultProps = {
    items: [],
    value: [],
    ignoredItems: [],
    disabledItems: [],
    checkedKeys: [],
    expandedKeys: [],
    autoExpandParent: true,
    defaultExpandAll: true,
    readOnly: false,
    allStoreKeys: [],
    dataList: [],
  }

  state = {
    filterParams: {
      keyword: '',
    },
    valueChanged: false,
    filterStoreKeys: this.props.allStoreKeys,
  }

  handleSearch = searchValue => {
    const { items, onExpand, dataList, allStoreKeys, searchKey } = this.props
    const tempFilterStoreKeys = []
    const expandedKeys = dataList
      .map(item => {
        if ((item.title.indexOf(searchValue) > -1 || item[searchKey] === searchValue) && searchValue) {
          const filterStoreKey = allStoreKeys.filter(key => key === item.key).toString()
          filterStoreKey && tempFilterStoreKeys.push(filterStoreKey)
          return getParentKey(item.key, items)
        }
        return null
      })
      .filter((item, i, self) => item && self.indexOf(item) === i)
    this.setState({
      filterParams: { keyword: searchValue },
      filterStoreKeys: searchValue ? tempFilterStoreKeys : allStoreKeys,
    })
    onExpand && onExpand(expandedKeys, 'search')
  }

  handleCheck = (checkedKeys, event) => {
    if (this.props.readOnly) {
      return false
    }
    this.setState({ valueChanged: true })
    const { allStoreKeys } = this.props
    const newCheckedKeys = allStoreKeys.filter(key => checkedKeys.includes(key))
    this.props.onChange && this.props.onChange(newCheckedKeys)
  }

  handleCheckAll = () => {
    this.setState({ valueChanged: true })
    // 选择搜索之后的全部，选择全部时排除ignoredItems,disabledItems
    const { filterStoreKeys } = this.state
    const { items } = this.props
    const { ignoredItems = [], disabledItems = [], value } = this.props
    const tempIgnoredItems = typeof ignoredItems === 'function' ? ignoredItems(items) : ignoredItems
    const tempDisabledItems = typeof disabledItems === 'function' ? disabledItems(items) : disabledItems

    const tempFilterStoreKeys = filterStoreKeys.filter(key => !tempIgnoredItems.concat(tempDisabledItems).includes(key))
    this.props.onChange && this.props.onChange([...value, ...tempFilterStoreKeys].filter((item, i, self) => item && self.indexOf(item) === i))
  }

  handleConfirm = () => {
    this.props.onConfirm && this.props.onConfirm(this.state.valueChanged)
  }

  handleCancel = () => {
    this.props.onCancel && this.props.onCancel()
  }

  handleDelete = item => {
    const { value } = this.props
    this.setState({ valueChanged: true })
    const newCheckedKeys = value.filter(key => key !== item.key)
    this.props.onChange && this.props.onChange(newCheckedKeys)
  }

  handleDeleteAll = () => {
    this.setState({ valueChanged: true })
    this.props.onChange && this.props.onChange([])
  }

  showConfirm = async () => {
    const allowCancle = await confirm({
      title: lang('提示'),
      content: lang('确定要取消吗？'),
      style: { top: '20%' },
      getContainer: () => document.getElementsByClassName('lz-component-store-transfer')[0],
    })
    if (allowCancle) {
      this.handleCancel()
    }
  }

  renderTreeNodes = (items, ignoredItems = [], disabledItems = []) => {
    const { value, readOnly, titleRender, searchKey } = this.props
    const { filterParams } = this.state

    return items
      .map(item => {
        let invisible = false
        let nodeTitle = item.title
        if (!item.children || !item.children.length) {
          // if (readOnly && !value.includes(item.key)) {
          //   invisible = true
          // }
          if (filterParams.keyword) {
            if (nodeTitle.includes(filterParams.keyword.trim())) {
              nodeTitle = (
                <span
                  dangerouslySetInnerHTML={{
                    __html: nodeTitle.replace(
                      new RegExp(filterParams.keyword.trim(), 'g'),
                      `<span class="text-primary">${filterParams.keyword.trim()}</span>`
                    ),
                  }}
                />
              )
            } else if (item[searchKey] === filterParams.keyword.trim()) {
              nodeTitle = <span className="text-primary">{nodeTitle}</span>
            } else {
              invisible = true
            }
          }
        }

        let ignored = false
        if (typeof ignoredItems === 'function') {
          ignored = ignoredItems(items).includes(item.key)
        } else {
          ignored = ignoredItems.includes(item.key)
        }

        if (ignored) {
          return null
        }

        let disabled = false
        if (typeof disabledItems === 'function') {
          disabled = disabledItems(items).includes(item.key)
        } else {
          disabled = disabledItems.includes(item.key)
        }

        readOnly && (disabled = true)

        if (item.children && item.children.length) {
          const childNodes = this.renderTreeNodes(item.children, ignoredItems, disabledItems)
          const treeInvisible = !childNodes.length || !childNodes.find(node => !node.props.invisible)
          return (
            <TreeNode
              className={treeInvisible ? 'hidden' : ''}
              invisible={treeInvisible}
              disableCheckbox={disabled}
              title={item.title}
              key={item.key}
              dataRef={item}>
              {childNodes}
            </TreeNode>
          )
        }

        if (typeof titleRender === 'function') {
          nodeTitle = titleRender(nodeTitle, item)
        }

        return (
          <TreeNode
            className={invisible ? 'hidden' : ''}
            invisible={invisible}
            disableCheckbox={disabled}
            key={item.key}
            {...item}
            title={nodeTitle}
          />
        )
      })
      .filter(item => item)
  }

  render() {
    const {
      items,
      ignoredItems,
      disabledItems,
      autoExpandParent,
      defaultExpandAll,
      onCancel,
      onConfirm,
      onChange,
      onExpand,
      value,
      expandedKeys,
      readOnly,
      confirmLoading,
      totalText,
      selectedInsideText,
      placeholderText,
      titleRender,
    } = this.props

    const { filterParams, valueChanged, filterStoreKeys } = this.state
    const treeNodes = this.renderTreeNodes(items, ignoredItems, disabledItems)
    const rootInvisible = !treeNodes.length || !treeNodes.find(node => !node.props.invisible)

    const selectedStoreItems = filterSelectedStore(items, value, [])

    // 去掉ignoredItems
    const tempIgnoredItems = typeof ignoredItems === 'function' ? ignoredItems(items) : ignoredItems
    const tempFilterStoreKeys = filterStoreKeys.filter(key => !tempIgnoredItems.includes(key))

    return (
      <div className="lz-component-store-transfer" data-read-only={readOnly}>
        <div className="tree-transfer">
          <div className="transfer-list">
            <header className="header">
              <div className="amount">
                {lang('共')} <span className="text-primary">{tempFilterStoreKeys.length}</span> {totalText}
                {!readOnly ? (
                  <a className="all" key="selectAll" onClick={this.handleCheckAll}>
                    {lang('选择全部')}
                  </a>
                ) : null}
              </div>
            </header>
            <div className="content store-tree">
              <Search style={{ marginBottom: 8 }} placeholder={placeholderText} name="keyword" onSearch={this.handleSearch} />
              {items.length ? (
                <Tree
                  checkable
                  selectable={false}
                  autoExpandParent={autoExpandParent}
                  defaultExpandAll={defaultExpandAll}
                  expandedKeys={expandedKeys}
                  checkedKeys={value}
                  selectedKeys={value}
                  onExpand={onExpand}
                  onCheck={this.handleCheck}>
                  {treeNodes}
                </Tree>
              ) : null}
              {rootInvisible ? (
                <div className="empty-placeholder">
                  <span>{lang('暂无数据哦！')}</span>
                </div>
              ) : null}
            </div>
          </div>
          <div className="transfer-list">
            <header className="header">
              <div className="amount">
                {lang('已选')} <span className="text-primary">{selectedStoreItems.length}</span> {selectedInsideText}
                {!readOnly ? (
                  <a className="all" key="deleteAll" onClick={this.handleDeleteAll}>
                    <Icon type="delete" /> {lang('删除全部')}
                  </a>
                ) : null}
              </div>
            </header>
            <div className="content">
              <List
                size="small"
                bordered={false}
                split={false}
                dataSource={selectedStoreItems}
                renderItem={item => {
                  let nodeTitle = item.title
                  if (typeof titleRender === 'function') {
                    nodeTitle = titleRender(nodeTitle, item)
                  }
                  return (
                    <List.Item actions={!readOnly ? [<Icon key={item.key} type="close-circle" onClick={() => this.handleDelete(item)} />] : []}>
                      {nodeTitle}
                    </List.Item>
                  )
                }}
              />
            </div>
          </div>
        </div>
        {readOnly ? (
          <footer className="footer">
            <Button onClick={this.handleCancel}>{lang('关闭')}</Button>
          </footer>
        ) : (
          <footer className="footer">
            <Button type="primary" onClick={this.handleConfirm} loading={confirmLoading}>
              {lang('确定')}
            </Button>
            <Button onClick={valueChanged ? this.showConfirm : this.handleCancel}>{lang('取消')}</Button>
          </footer>
        )}
      </div>
    )
  }
}

class StoreTransfer extends React.PureComponent {
  static defaultProps = {
    value: [],
    modalProps: {},
    modalTitle: lang('选择门店'),
    readOnlyModalTitle: lang('查看门店'),
    pickerProps: {},
    buttonText: lang('选择门店'),
    readOnlyButtonText: lang('查看门店'),
    buttonType: 'primary',
    selectedText: lang('已选门店'),
    totalText: lang('家门店'),
    selectedInsideText: lang('家门店'),
    placeholderText: lang('搜索门店名称/编码'),
    readOnly: false,
    hideEntry: false,
    className: '',
    modalClassName: '',
    modalVisible: null,
    confirmFilter: null,
    confirmLoading: false,
    dataMapper: defaultDataMapper,
    searchKey: 'key',
  }

  allStoreKeys = []
  dataList = []

  static getDerivedStateFromProps(nextProps, prevState) {
    if (typeof nextProps.modalVisible === 'boolean' && nextProps.modalVisible !== prevState.modalVisible) {
      return {
        modalVisible: nextProps.modalVisible,
      }
    }

    return {}
  }

  state = {
    treeData: [],
    originTreeData: {},
    checkedKeys: [],
    expandedKeys: [],
    modalVisible: false,
    autoExpandParent: true,
  }

  // 弹框显示，需要展开对应已选树
  updateExpandedKeys = treeData => {
    const { value } = this.props
    const expandedKeys = this.dataList
      .map(item => {
        if (value.includes(item.key)) {
          return getParentKey(item.key, treeData)
        }
        return null
      })
      .filter((item, i, self) => item && self.indexOf(item) === i)
    this.setState({ expandedKeys })
  }

  confirmFilter = keys => {
    const { originTreeData } = this.state
    if (this.props.confirmFilter) {
      return this.props.confirmFilter(keys, originTreeData)
    }

    return keys.filter(key => this.allStoreKeys.find(item => item === key))
  }

  showStorePickerModal = () => {
    const { onBeforeOpen, onOpenModal } = this.props

    if (onBeforeOpen && onBeforeOpen() === false) {
      return false
    }
    this.setState({ modalVisible: true })
    onOpenModal && onOpenModal()
  }

  hideStorePickerModal = () => {
    this.setState({ modalVisible: false })
    this.props.onCloseModal && this.props.onCloseModal()
  }

  handleConfirm = valueChanged => {
    const confirmedKeys = this.confirmFilter(this.state.checkedKeys)

    if (this.props.onConfirm) {
      const confirmRes = this.props.onConfirm(valueChanged, confirmedKeys)

      if (confirmRes === false) {
        return false
      } else if (confirmRes && confirmRes.then) {
        confirmRes
          .then(result => {
            this.hideStorePickerModal()
            this.props.onChange(confirmedKeys, result)
          })
          .catch(() => {
            // canceled
          })
        return false
      }
    }

    this.hideStorePickerModal()
    this.props.onChange(confirmedKeys)
  }

  handleCancel = () => {
    if (this.props.onCancel && this.props.onCancel() === false) {
      const cancelRes = this.props.onCancel()

      if (cancelRes === false) {
        return false
      } else if (cancelRes && cancelRes.then) {
        cancelRes.then(() => {
          this.hideStorePickerModal()
          this.handleCheck(this.props.value)
        })
        return false
      }
    }

    this.hideStorePickerModal()
    this.handleCheck(this.props.value)
  }

  handleCheck = checkedKeys => {
    this.setState({ checkedKeys })
    this.props.onCheck && this.props.onCheck(checkedKeys)
  }

  handleExpand = (expandedKeys, type) => {
    this.setState({ expandedKeys, autoExpandParent: type === 'search' })
  }

  componentDidMount() {
    const { modalVisible, value, serviceName, requestParams, dataMapper } = this.props

    if (!serviceName) {
      throw TypeError('未指定有效的serviceName，无法发起请求')
    }

    requestService(serviceName, requestParams).then(res => {
      const { code, data } = res
      const treeData = data && dataMapper(data)
      this.setState({ treeData, originTreeData: data })
      this.allStoreKeys = getAllStoreKeys(treeData, [])
      this.dataList = generateList(treeData, [])

      if (modalVisible) {
        this.updateExpandedKeys(treeData)
        this.handleCheck(value)
      }
    })
  }

  componentDidUpdate(prevProps, prevState) {
    if (!prevState.modalVisible && this.state.modalVisible) {
      const { treeData } = this.state
      const { value } = this.props
      this.updateExpandedKeys(treeData)
      this.handleCheck(value)
    }
  }

  render() {
    const {
      value,
      buttonText,
      readOnlyButtonText,
      buttonType,
      selectedText,
      totalText,
      selectedInsideText,
      modalProps,
      modalTitle,
      readOnlyModalTitle,
      placeholderText,
      pickerProps,
      className,
      titleRender,
      modalClassName,
      readOnly,
      hideEntry,
      children,
      buttonProps,
    } = this.props
    const { treeData, modalVisible, checkedKeys, expandedKeys, autoExpandParent } = this.state

    return (
      <div className={`lz-component-store-transfer-entry ${className}`}>
        {children ? (
          <div onClick={this.showStorePickerModal}>{children}</div>
        ) : hideEntry ? null : (
          <Button onClick={this.showStorePickerModal} type={buttonType} {...buttonProps}>
            {readOnly ? readOnlyButtonText : buttonText}
          </Button>
        )}
        {hideEntry ? null : (
          <span className="selected-amount">
            {selectedText}（<span className="text-danger">{value.length}</span>）
          </span>
        )}
        <Modal
          title={readOnly ? readOnlyModalTitle : modalTitle}
          width={1100}
          closable={false}
          visible={modalVisible}
          className={`lz-component-store-transfer-modal ${modalClassName}`}
          footer={null}
          destroyOnClose={true}
          {...modalProps}>
          <InlineStorePicker
            {...pickerProps}
            {...this.props}
            items={treeData.length ? treeData : []}
            className={modalClassName}
            value={checkedKeys}
            readOnly={readOnly}
            expandedKeys={expandedKeys}
            autoExpandParent={autoExpandParent}
            allStoreKeys={this.allStoreKeys}
            totalText={totalText}
            selectedInsideText={selectedInsideText}
            placeholderText={placeholderText}
            dataList={this.dataList}
            onExpand={this.handleExpand}
            onChange={this.handleCheck}
            onConfirm={this.handleConfirm}
            onCancel={this.handleCancel}
          />
        </Modal>
      </div>
    )
  }
}

export default React.forwardRef((props, ref) => <StoreTransfer {...props} componentRef={ref} />)
