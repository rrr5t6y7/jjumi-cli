import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Input, Icon, Checkbox, Tree, Spin } from 'antd'
import { requestService, requestURI } from 'toss.service'
import ModalTrigger from './ModalTrigger'
import { lang } from 'toss.utils/lang'
import './TreePicker.scss'

// TODO
// - 搜索后自动展开搜索项目（或许需要？）
// - 异步分级加载数据

const filterTreeData = (treeData, checkedKeys, keyword, treeKeys, showSelectedOnly, dataFilter, readOnly, transfer) => {
  return treeData.map(item => {
    let invisible = false
    let nodeTitle = item.title

    if (!item.children || !item.children.length) {
      invisible = !transfer && (showSelectedOnly || readOnly) && !checkedKeys.includes(item.key)

      if (keyword) {
        if (dataFilter(item, keyword.trim())) {
          nodeTitle = (
            <span
              dangerouslySetInnerHTML={{
                __html: nodeTitle.replace(new RegExp(keyword.trim(), 'g'), `<span class="text-danger">${keyword.trim()}</span>`),
              }}
            />
          )
        } else {
          invisible = true
        }
      }
    }

    if (item.children && item.children.length) {
      const childrenData = filterTreeData(item.children, checkedKeys, keyword, treeKeys, showSelectedOnly, dataFilter, readOnly, transfer)

      return Object.assign({}, item, {
        title: nodeTitle,
        invisible: !childrenData.some(item => !item.invisible),
        children: childrenData,
      })
    }

    !invisible && treeKeys.push(item.key)

    return Object.assign({}, item, {
      title: nodeTitle,
      invisible: invisible,
      children: null,
    })
  })
}

const generateTreeNodes = (treeData, readOnly, titleFormatter, disabledKeys, ignoredKeys) => {
  return Array.isArray(treeData)
    ? treeData
        .map(item => {
          return ignoredKeys.includes(item.key) ? null : (
            <Tree.TreeNode
              {...item}
              key={item.key}
              data-hidden={item.invisible}
              selectable={!readOnly}
              data-checkable={true}
              title={titleFormatter(item.title, item)}
              disabled={disabledKeys.includes(item.key) || item.invisible}
              checkable={true}>
              {item.children ? generateTreeNodes(item.children, readOnly, titleFormatter, disabledKeys, ignoredKeys) : null}
            </Tree.TreeNode>
          )
        })
        .filter(item => item)
    : null
}

const flattenTreeData = (treeNode, parentKey = null, parentKeys = []) => {
  const flatTreeData = []

  treeNode.forEach(item => {
    if (item.children && item.children.length) {
      flatTreeData.push(Object.assign({}, item, { parentKey, parentKeys: parentKeys.concat(parentKey), isLeaf: false }))
      flatTreeData.push.apply(flatTreeData, flattenTreeData(item.children, item.key, parentKeys.concat(item.key)))
    } else {
      flatTreeData.push(Object.assign({}, item, { parentKey, parentKeys: parentKeys.concat(parentKey), isLeaf: true }))
    }
  })

  return flatTreeData
}

const defaultDataMapper = data => data.data
const dafaultDataFilter = (item, keyword) => (keyword ? item.title?.includes(keyword) : true)
const defaultTitleFormatter = title => title
const defaultTotalCountFormatter = count => (
  <span>
    {lang('共')}
    <span className="text-primary"> {count} </span>
    {lang('个项目')}
  </span>
)

const defaultSelectedCountFormatter = checkedKeys => (
  <span>
    {lang('已选')}
    <span className="text-primary"> {checkedKeys?.length || 0} </span>
    {lang('个项目')}
  </span>
)

const emptyArray = []

/**
 * @param {*} nextCheckedItems 新选择的项目
 * @param {*} prevCheckedItems 之前已选的项目
 * @param {*} currentKey 新选择的key
 * @param {*} children 新选择项目的子项目
 * @param {*} keyword 筛选关键字
 * @param {*} dataFilter 关键字过滤器
 */
const getCheckedItemsWithFilter = (nextCheckedItems, prevCheckedItems, currentKey, children, keyword, dataFilter) => {
  let result

  // 如果是选择的末级别，则不做处理
  if (!children || !children.length) {
    result = nextCheckedItems
      .concat(
        // 之前已选的还要保留
        prevCheckedItems
      )
      .filter((item, index, array) => {
        // 整体去重复处理
        return array.findIndex(subItem => subItem.key === item.key) === index
      })
  } else {
    // 如果通过父级/全选来选择时，仅选择符合关键字过滤的项目
    result = nextCheckedItems
      .filter(item => {
        // 过滤掉当前项的子级数据
        return !item.parentKeys?.includes(currentKey)
      })
      .concat(
        // 追加符合条件的子级数据
        children.filter(item => dataFilter(item, keyword))
      )
      .concat(
        // 之前已选的还要保留
        prevCheckedItems
      )
      .filter((item, index, array) => {
        // 整体去重复处理
        return array.findIndex(subItem => subItem.key === item.key) === index
      })
  }

  return result
}

const defaultSelectedListFilter = (allItems, checkedKeys) => {
  return allItems.filter(item => checkedKeys?.includes(item.key))
}

const defaultDeselectFilter = (checkedKeys, deselectedItemKey, deselectedItem, allItems) => {
  return checkedKeys.filter(item => item !== deselectedItemKey)
}

const SelectedList = React.memo(props => {
  const handleItemClick = useCallback(
    event => {
      const { key } = event.currentTarget.dataset
      props.onDeselect(
        key,
        props.items.find(item => item.key === key)
      )
    },
    [props.onDeselect, props.items]
  )

  return (
    <div className="transfer-list">
      {props.items.map(item => (
        <div className="item" key={item.key}>
          <span className="title" data-key={item.key}>
            {item.title}
          </span>
          {!props.readOnly && (
            <span className="icon-deselect text-link" onClick={handleItemClick} data-key={item.key}>
              <Icon type="close-circle" />
            </span>
          )}
        </div>
      ))}
    </div>
  )
})

export const EmbedTreePicker = React.memo(
  React.forwardRef((props, ref) => {
    const tempData = useRef({})
    const [loading, setLoading] = useState(false)
    const [treeData, setTreeData] = useState([])
    const [flatTreeData, setFlatTreeData] = useState([])
    const [keyword, setKeyword] = useState('')
    const [showSelectedOnly, setShowSelectedOnly] = useState(props.readOnly)
    const [expandAll, setExpandAll] = useState(false)
    const [expandedKeys, setExpandedKeys] = useState([props.rootKey])

    const checkedKeys = useMemo(() => {
      return props.keysOnly ? props.value || [] : (props.value || []).map(item => item[props.nodeKey])
    }, [props.value, props.keysOnly])

    const triggerChange = useCallback(
      (items, ...argus) => {
        if (props.readOnly || !props.onChange) return false

        const resultItems = props.leafOnly ? items.filter(item => item.isLeaf) : items
        const itemKeys = resultItems.map(item => item.key)

        props.keysOnly ? props.onChange(itemKeys, resultItems, items, ...argus) : props.onChange(resultItems, itemKeys, items, ...argus)
      },
      [props.readOnly, props.keysOnly, props.leafOnly, props.onChange]
    )

    const toggleShowSelectedOnly = useCallback(() => {
      setShowSelectedOnly(!showSelectedOnly)
    }, [showSelectedOnly])

    const handleFilter = useCallback((keyword, event) => {
      setKeyword(keyword)
      setExpandAll(!!keyword)
      event.preventDefault()
    }, [])

    const handleCheck = useCallback(
      (nextCheckedKeys, event) => {
        if (props.readOnly) return false

        let confirmedCheckedItems = null
        const { eventKey: checkedKey, children: currentChildren } = event.node.props
        const nextCheckedItems = flatTreeData.filter(item => nextCheckedKeys.includes(item.key))
        const prevCheckedItems = flatTreeData.filter(item => checkedKeys.includes(item.key))

        if (!event.checked) {
          // 取消选择
          if (!keyword) {
            // 未输入关键字，正常走流程
            confirmedCheckedItems = nextCheckedItems
          } else {
            // 如果输入了关键字，则还要保留之前已选项目中不匹配关键字的项目
            confirmedCheckedItems = nextCheckedItems
              .concat(prevCheckedItems.filter(item => !props.dataFilter(item, keyword)))
              .filter((item, index, array) => {
                // 整体去重复处理
                return array.findIndex(subItem => subItem.key === item.key) === index
              })
          }
        } else {
          // 选择
          if (!keyword) {
            // 未输入关键字，走正常流程
            confirmedCheckedItems = nextCheckedItems
          } else {
            // 已经输入关键字，
            const nextLeafItems = nextCheckedItems.filter(item => item.isLeaf)
            const nextChildren = checkedKey === props.rootKey ? nextLeafItems : nextLeafItems.filter(item => item.parentKeys.includes(checkedKey))
            confirmedCheckedItems = getCheckedItemsWithFilter(
              checkedKey === props.rootKey ? [] : nextCheckedItems,
              prevCheckedItems,
              checkedKey,
              nextChildren,
              keyword,
              props.dataFilter
            )
          }
        }
        triggerChange(confirmedCheckedItems.filter(item => !props.disabledKeys.includes(item.key)))
      },
      [triggerChange, props.readOnly, props.rootKey, props.nodeKey, props.disabledKeys, checkedKeys, props.dataFilter, keyword, flatTreeData]
    )

    const handleExpand = useCallback(expandedKeys => {
      setExpandAll(false)
      setExpandedKeys(expandedKeys)
    }, [])

    const handleSelectAll = useCallback(() => {
      if (keyword) {
        triggerChange(
          flatTreeData.filter(item => (!props.disabledKeys.includes(item.key) && props.dataFilter(item, keyword)) || checkedKeys.includes(item.key))
        )
      } else {
        triggerChange(flatTreeData.filter(item => !props.disabledKeys.includes(item.key)))
      }
    }, [triggerChange, flatTreeData, props.dataFilter, keyword, checkedKeys, props.disabledKeys])

    const handleDeselectAll = useCallback(() => {
      triggerChange([])
    }, [triggerChange])

    const handleDeselect = useCallback(
      (deselectedItemKey, deselectedItem) => {
        const nextKeys = props.deselectFilter(checkedKeys, deselectedItemKey, deselectedItem, flatTreeData)
        triggerChange(flatTreeData.filter(item => nextKeys.includes(item.key)))
      },
      [triggerChange, checkedKeys, props.deselectFilter, flatTreeData]
    )

    const [renderedTreeNodes, renderedTreeKeys] = useMemo(() => {
      const treeKeys = []
      const treeNodes = generateTreeNodes(
        props.transfer
          ? filterTreeData(treeData, checkedKeys, keyword, treeKeys, showSelectedOnly, props.dataFilter, props.readOnly, props.transfer)
          : [
              {
                key: props.rootKey,
                title: props.rootTitle,
                children: filterTreeData(
                  treeData,
                  checkedKeys,
                  keyword,
                  treeKeys,
                  showSelectedOnly,
                  props.dataFilter,
                  props.readOnly,
                  props.transfer
                ),
              },
            ],
        props.readOnly,
        props.titleFormatter,
        props.disabledKeys,
        props.ignoredKeys
      )
      return [treeNodes, treeKeys]
    }, [
      treeData,
      checkedKeys,
      showSelectedOnly,
      keyword,
      props.dataFilter,
      props.titleFormatter,
      props.disabledKeys,
      props.ignoredKeys,
      props.transfer,
      props.readOnly,
    ])

    const classNames = ['lz-embed-tree-picker', props.className, props.transfer ? 'with-transfer' : 'without-transfer']
    const leafTreeData = useMemo(() => {
      return flatTreeData.filter(item => item.isLeaf)
    }, [flatTreeData])

    useEffect(() => {
      if (props.active === false || (props.active === true && tempData.current.requested)) return
      if (tempData.current.requested) return

      tempData.current.requested = true
      setLoading(true)

      // 使用传入的dataLoader\serviceName\serviceURI来加载数据
      let requester = null

      if (props.dataLoader) {
        requester = props.dataLoader(props.requestParams)
      } else if (props.serviceName) {
        requester = requestService(props.serviceName, props.requestParams)
      } else if (props.serviceURI) {
        requester = requestURI(props.serviceURI, props.requestParams)
      } else {
        setLoading(false)
        console.warn('未指定请求服务名(serviceName)或服务地址(serviceURI)或数据加载器(dataLoader)')
        return
      }

      if (!requester.then) {
        setLoading(false)
        console.warn('dataLoader必须返回一个Promise或者是一个async函数')
        return
      }

      requester
        .then(res => {
          setLoading(false)
          const mappedData = props.dataMapper(res)
          setFlatTreeData(flattenTreeData(mappedData))
          setTreeData(mappedData)
        })
        .catch(error => {
          console.warn(error)
          setLoading(false)
        })
    }, [props.active])

    /**
     * 自动计算并展开到已选末级
     */
    useEffect(() => {
      if (props.readOnly) {
        setShowSelectedOnly(true)
        if (!props.transfer) {
          const expandedKeys =
            leafTreeData
              .filter(item => {
                return checkedKeys.includes(item.key)
              })
              .reduce((keys, item) => {
                return keys.concat(item.parentKeys)
              }, [])
              .filter((item, index, array) => item && array.indexOf(item) === index) || []
          setExpandedKeys([props.rootKey].concat(expandedKeys))
        }
      }
    }, [props.readOnly, props.transfer, props.rootKey, checkedKeys, leafTreeData])

    props.readOnly && classNames.push('read-only')
    showSelectedOnly && classNames.push('show-selected-only')

    const selectedItems = useMemo(() => {
      return props.transfer ? props.selectedListFilter(flatTreeData, checkedKeys) : []
    }, [props.transfer, flatTreeData, checkedKeys, props.selectedListFilter])

    return (
      <div className={classNames.join(' ')}>
        <Spin spinning={loading} tip={props.loadingTip} className="tree-loading"></Spin>
        <div className="tree-wrapper">
          {props.transfer ? (
            <div className="header">
              <div className="left">{props.totalCountFormatter(leafTreeData.length)}</div>
              <div className="center">{props.headerCenterContent}</div>
              <div className="right">
                {!props.readOnly && (
                  <span onClick={handleSelectAll} className="text-link text-primary">
                    {lang('选择全部')}
                  </span>
                )}
              </div>
              <div className="bottom">
                <Input.Search placeholder={props.filterInputPlaceholder} onSearch={handleFilter} />
              </div>
            </div>
          ) : (
            <div className="header">
              <div className="left">
                <Checkbox checked={props.readOnly || showSelectedOnly} disabled={props.readOnly} onChange={toggleShowSelectedOnly}>
                  {lang('仅显示已选项')}
                </Checkbox>
              </div>
              <div className="center">{props.headerCenterContent}</div>
              <div className="right">
                <Input.Search placeholder={props.filterInputPlaceholder} onSearch={handleFilter} />
              </div>
            </div>
          )}
          {treeData.length ? (
            <Tree
              {...props.treeProps}
              disabled={false}
              checkable={true}
              selectable={false}
              expandedKeys={expandAll ? renderedTreeKeys : expandedKeys}
              autoExpandParent={expandAll}
              checkedKeys={checkedKeys}
              onExpand={handleExpand}
              onCheck={handleCheck}
              ref={ref}>
              {renderedTreeNodes}
            </Tree>
          ) : null}
        </div>
        {props.transfer && (
          <div className="transfer-wrapper">
            <div className="header">
              <div className="left">{props.selectedCountFormatter(selectedItems)}</div>
              {!props.readOnly && (
                <div className="right">
                  <Icon type="delete" />
                  <span onClick={handleDeselectAll} className="text-link text-primary">
                    {lang('删除全部')}
                  </span>
                </div>
              )}
            </div>
            <SelectedList items={selectedItems} readOnly={props.readOnly} onDeselect={handleDeselect} />
          </div>
        )}
      </div>
    )
  })
)

EmbedTreePicker.defaultProps = {
  value: [],
  expandedKeys: [],
  disabledKeys: [],
  ignoredKeys: [],
  requestParams: {},
  treeProps: {},
  className: '',
  nodeKey: 'key',
  loadingTip: lang('加载中'),
  filterInputPlaceholder: lang('请搜索'),
  rootKey: '0', // 指定根节点key
  rootTitle: lang('全部'), // 指定根节点title
  leafOnly: true, // onChange参数是否仅携带最末级的数据
  keysOnly: true, // onChange/value的数据结构是否仅包含key
  transfer: false, // 是否使用左右分列的展示形式
  dataLoader: null, // 自定义数据加载函数
  serviceName: null, // 数据加载服务名
  serviceURI: null, // 数据加载服务URI
  dataMapper: defaultDataMapper, // 用于将接口返回的数据转换为组件需要的形式
  dataFilter: dafaultDataFilter, // 指定本地搜索的过滤函数
  titleFormatter: defaultTitleFormatter, // 指定TreeNode的title渲染函数
  totalCountFormatter: defaultTotalCountFormatter, // 总数量显示格式化函数
  selectedCountFormatter: defaultSelectedCountFormatter, // 已选数量显示格式化函数
  selectedListFilter: defaultSelectedListFilter, // 已选列表过滤函数
  deselectFilter: defaultDeselectFilter, // 反选操作的过滤函数
}

export default React.memo(
  React.forwardRef((props, ref) => {
    return (
      <ModalTrigger modalClassName="lz-tree-picker-modal" entryChildren={props.children} {...props} withContentPadding>
        <EmbedTreePicker ref={ref} />
      </ModalTrigger>
    )
  })
)
