import React, { forwardRef, useState, useMemo, useCallback, useEffect, useRef, useImperativeHandle } from 'react'
import { Icon, Tree, Input } from 'antd'
// import { findTreeData, filterTreeData, statusThrottle, CheckDataType, stabilization, throttle } from 'utils'
import { requestService } from 'toss.service'
import { v4 as uuidv4 } from 'uuid'
import { getStyle, findTreeData, filterTreeData, statusThrottle, CheckDataType, stabilization, throttle } from 'toss.utils'

import './styles.scss'

const { Search } = Input

const { TreeNode } = Tree

const Select = forwardRef((props, ref) => {
  let {
    open = false,
    // checkedKeys: propsCheckedKeys = [],
    nextLevelKey,
    onChange = () => {},
    data = [],
    labelKey,
    valueKey,
    value = [],
    placeholder = '请选择',
    levelOneCheckedKeys,
    levelTwoCheckedKeys,
    levelThreeCheckedKeys,
    levelKey,
    onChangeOpen = () => {},
    searchProps = {},
    selectProps = {},
    treeProps = {},
  } = props
  const {
    isShow = true,
    placeholder: searchPlaceholder = '请输入关搜索键词',
    onChange: searchOnChange = () => {},
    onSearch: searchOnSearch = () => {},
  } = searchProps
  const { placeholder: selectPlaceholder = '全部', onChange: selectOnChangeOpen = () => {} } = selectProps
  const { displaySelectedText = '显示已选', hideAllText = '显示全部', isShowSelectedBut = true, onCheck = () => {} } = treeProps

  const [titles, setTitles] = useState('')
  const [keywords, setKeywords] = useState('')
  const [showSelected, setShowSelected] = useState(false)
  const [disabled, setDisabled] = useState(false)
  const [treeBoxId, setTreeBoxId] = useState('')
  const [selectTreeId, setSelectTreeId] = useState('')

  //获取父亲回调函数
  // 第一个参数 ref，第二个参数是一个函数，需要返回一个对象，第三个参数数组，需要监听的变量
  useImperativeHandle(ref, () => {
    // 返回函数或者事件或者值，对象类型
    return {
      // getParentEl: (parentEl) => {
      // },
    }
  })

  const $onChangeOpen = useCallback((event) => {
    if (disabled) {
      return false
    }
    onChangeOpen(!open)
    selectOnChangeOpen(!open)
    // 阻止事件冒泡到DOM树上
    event.stopPropagation() // 只执行button的click，如果注释掉该行，将执行button、p和div的click （同类型的事件）
    event.preventDefault()
    return false
  })

  useEffect(() => {
    setTreeBoxId(uuidv4())
    setSelectTreeId(uuidv4())
  }, [])
  useEffect(() => {
    if (treeBoxId && selectTreeId && open) {
      const treeBoxel = document.getElementById(treeBoxId)
      const selectTreeel = document.getElementById(selectTreeId)
      const width = getStyle(treeBoxel, 'width')
      // selectTreeel.setAttribute('style', `width:${width}`);
      selectTreeel.style.width = width
    }
  }, [treeBoxId, selectTreeId, open])

  // const disabled = useMemo(() => {
  //   let flag = false
  //   if (levelKey == 'levelTwo' && levelOneCheckedKeys.length == 0) {
  //     flag = true
  //   }
  //   if ((levelKey == 'levelThree' && levelOneCheckedKeys.length == 0) || (levelKey == 'levelThree' && levelTwoCheckedKeys.length == 0)) {
  //     flag = true
  //   }
  //   return flag
  // }, [levelOneCheckedKeys, levelTwoCheckedKeys, levelThreeCheckedKeys, levelKey])

  useEffect(() => {
    let flag = false
    if (levelKey == 'levelTwo' && levelOneCheckedKeys.length == 0) {
      flag = true
    }
    if ((levelKey == 'levelThree' && levelOneCheckedKeys.length == 0) || (levelKey == 'levelThree' && levelTwoCheckedKeys.length == 0)) {
      flag = true
    }
    setDisabled(flag)
  }, [levelOneCheckedKeys, levelTwoCheckedKeys, levelThreeCheckedKeys, levelKey])

  const checkoutParent = useCallback((el, className) => {
    // eslint-disable-next-line no-cond-assign
    while (el.nodeName.toUpperCase() != 'BODY') {
      el = el.parentNode
      if (el && [...el.classList].includes('select-tree-box')) {
        return el
      }
    }
    return false
  }, [])
  const close = useCallback((event) => {
    const { target } = event
    if (checkoutParent(target)) {
      return
    }
    onChangeOpen(false)
    selectOnChangeOpen(false)
  }, [])
  useEffect(() => {
    document.body.addEventListener('click', close)
  }, [])

  const transformData = useCallback((data = []) => {
    return data.map((item) => {
      return {
        ...item,
        title: item[labelKey],
        key: item[valueKey],
        children: item[nextLevelKey] ? transformData(item[nextLevelKey]) : [],
      }
    })
  }, [])

  const filterData = useCallback(
    (data = []) => {
      data[0].children = data[0][nextLevelKey] = showSelected
        ? data[0].children.filter((item) => {
            for (const _item of value) {
              if (item[valueKey] == _item) {
                return true
              }
            }
            return false
          })
        : data[0].children

      return filterTreeData(data, (item) => {
        return keywords.trim() ? item[labelKey].search(keywords) != -1 : true
      })
    },
    [keywords, showSelected, showSelected]
  )

  useEffect(() => {
    const titles =
      value.length >= data.length || value.length == 0
        ? selectPlaceholder
        : data
            .filter((item) => {
              for (let _item of value) {
                if (_item == item[valueKey]) {
                  return true
                }
              }
              return false
            })
            .map((item) => {
              return item[labelKey]
            })
            .join('/')
    setTitles(titles)
  }, [value])

  const renderTreeNodes = useCallback(
    (data) =>
      data.map((item) => {
        if (item.children) {
          return (
            <TreeNode disabled={disabled} title={item.title} key={item.key} dataRef={item}>
              {renderTreeNodes(item.children)}
            </TreeNode>
          )
        }
        return <TreeNode disabled={disabled} key={item.key} {...item} />
      }),
    [showSelected]
  )

  const newData = useMemo(() => {
    return filterData(
      transformData([
        {
          [labelKey]: '选择全部',
          [valueKey]: '0',
          [nextLevelKey]: data,
        },
      ])
    )
  })

  return (
    <div id={treeBoxId} className="select-tree-box  ant-select-show-arrow lz-region-selector ant-select ant-select-enabled">
      <div
        onClick={$onChangeOpen}
        className="ant-select-selection
    ant-select-selection--single"
        role="combobox"
        aria-autocomplete="list"
        aria-haspopup="true"
        aria-controls="bc07f98c-9356-4d60-8017-98b26ba73de2"
        aria-expanded="false"
        tabIndex="0">
        <div className="ant-select-selection__rendered">
          {disabled ? (
            <div unselectable="on" className="ant-select-selection__placeholder" style={{ display: 'block', 'user-select': 'none' }}>
              {titles}
            </div>
          ) : (
            <div className="ant-select-selection-selected-value" title={selectPlaceholder} style={{ display: 'block', opacity: '1' }}>
              {titles}
            </div>
          )}
        </div>
        <span className="ant-select-arrow" unselectable="on" style={{ userSelect: 'none' }}>
          <i aria-label="图标: down" className="anticon anticon-down ant-select-arrow-icon">
            {open ? <Icon type="up" /> : <Icon type="down" />}
          </i>
        </span>
      </div>
      {open ? (
        <div className="select-tree" id={selectTreeId}>
          {isShow ? (
            <Search
              {...searchProps}
              value={keywords}
              placeholder={searchPlaceholder}
              onChange={(event) => {
                const { target: { value = '' } = {} } = event
                let { onChange = () => {}, value: selsctValue = [] } = props
                setKeywords(value)
                if (!value.trim()) {
                  const index = selsctValue.findIndex((item) => {
                    return item == '0'
                  })
                  index != -1 && selsctValue.splice(index, 1)
                  onChange(selsctValue)
                  searchOnChange(value)
                }
              }}
              onSearch={(value) => {
                setKeywords(value)
                searchOnSearch(value)
              }}
              // style={{ width: 200 }}
            />
          ) : null}
          <div className="tree-box">
            {isShowSelectedBut ? (
              <div
                className="selected"
                onClick={() => {
                  setShowSelected(!showSelected)
                }}>
                {showSelected ? hideAllText : displaySelectedText}
              </div>
            ) : null}
            {console.log(' newData.length=', newData.length)}

            {newData.length == 0 ? (
              <div  className="no-data" style={{overflow: 'auto', transform: 'translateZ(0px)'}}>
                <ul
                  role="listbox"
                  className="ant-select-dropdown-menu  ant-select-dropdown-menu-root ant-select-dropdown-menu-vertical"
                  tabindex="0">
                  <li
                    role="option"
                    unselectable="on"
                    className="ant-select-dropdown-menu-item ant-select-dropdown-menu-item-disabled"
                    aria-disabled="true"
                    aria-selected="false"
                    style={{userSelect: 'none'}}>
                    <div className="ant-empty ant-empty-normal ant-empty-small">
                      <div className="ant-empty-image">
                        <svg width="64" height="41" viewBox="0 0 64 41" xmlns="http://www.w3.org/2000/svg">
                          <g transform="translate(0 1)" fill="none" fill-rule="evenodd">
                            <ellipse fill="#F5F5F5" cx="32" cy="33" rx="32" ry="7"></ellipse>
                            <g fill-rule="nonzero" stroke="#D9D9D9">
                              <path d="M55 12.76L44.854 1.258C44.367.474 43.656 0 42.907 0H21.093c-.749 0-1.46.474-1.947 1.257L9 12.761V22h46v-9.24z"></path>
                              <path
                                d="M41.613 15.931c0-1.605.994-2.93 2.227-2.931H55v18.137C55 33.26 53.68 35 52.05 35h-40.1C10.32 35 9 33.259 9 31.137V13h11.16c1.233 0 2.227 1.323 2.227 2.928v.022c0 1.605 1.005 2.901 2.237 2.901h14.752c1.232 0 2.237-1.308 2.237-2.913v-.007z"
                                fill="#FAFAFA"></path>
                            </g>
                          </g>
                        </svg>
                      </div>
                      <p className="ant-empty-description">暂无数据</p>
                    </div>
                  </li>
                </ul>
              </div>
            ) : (
              <Tree
                // {...treeProps}
                checkable
                // onExpand={()=>{}} //展开收齐
                // expandedKeys={[]} // 指定展开的key
                autoExpandParent={true} //是否自动展开父节点
                onCheck={(value = [], e) => {
                  const { checked } = e // 选中或者反选
                  let {
                    open = false,
                    // checkedKeys: propsCheckedKeys = [],
                    nextLevelKey,
                    onChange = () => {},
                    data = [],
                    labelKey,
                    valueKey,
                    value: oldValue = [],
                    placeholder = '请选择',
                  } = props
                  if (checked) {
                    // 正选
                    oldValue = oldValue.filter((item) => {
                      // 保留已选的数据
                      for (let _item of data) {
                        if (item == _item[valueKey]) {
                          return true
                        }
                      }
                    })
                    // 合并数据
                    value = [...value, ...oldValue]
                  } else {
                    let index = -1
                    // 反选
                    if (value && [...value].length == 0) {
                      // 全部被清空了
                      for (const item of newData[0].children) {
                        index = oldValue.lastIndexOf(item[valueKey])
                        index != -1 && oldValue.splice(index, 1)
                      }
                      index = oldValue.lastIndexOf('0')
                      index != -1 && oldValue.splice(index, 1)
                      value = oldValue
                    }
                  }
                  // 去重
                  value = value.reduce((acc, next) => {
                    if (!acc.includes(next)) {
                      acc.push(next)
                    }
                    return acc
                  }, [])
                  onChange(value)
                  onCheck(value)
                }} //点击复选框触发
                checkedKeys={value} //checkedKeys // 选中的key
                // onSelect={(value) => {}} // 点击数触发函数
                // selectedKeys={['0-0-0-1']} // 设置选中的树
              >
                {renderTreeNodes(newData)}
              </Tree>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
})
export default class StoreCascader extends React.PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      levelOne: [], // 一级
      levelTwo: [], // 二级
      levelThree: [], // 三级
      levelOneOpen: false, // 一级
      levelTwoOpen: false, // 二级
      levelThreeOpen: false, // 三级
      allList: [], // 点平三级全部数据
      listManKey: ['', '', ''], // 主key
    }
  }

  static defaultProps = {
    showLevelOne: true, //  是否显示一级Select 下拉框，默认 true
    showLevelTwo: true, //是否显示二级Select 下拉框，默认 true
    showLevelThree: true, // 是否显示三级Select 下拉框 默认 true

    dataMapper: (data) => data, // 过滤treeData
    filterLevelOne: (data) => data, // 过滤 一级 数据
    filterLevelTwo: (data) => data, // 过滤 二级数据
    filterLevelThree: (data) => data, // 过滤  三级数据
    onReady: () => {}, // 初始化回调
  }
  // 初始化数据
  init = async () => {
    const {
      serviceName,
      requestParams = {},
      treeData,
      value = {},
      onReady = () => {},
      dataMapper = (data) => data,
      filterLevelOne = (data) => data,
    } = this.props
    let data = []
    if (CheckDataType.isPromise(treeData)) {
      data = await treeData
      data = dataMapper(treeData)
    } else if (treeData) {
      data = dataMapper(treeData)
    } else if (serviceName) {
      data = await requestService(serviceName, requestParams)
      data = dataMapper(data.data)
    }
    data = filterLevelOne(data)

    this.setState(
      {
        levelOne: data,
        allList: this.getList(data),
        treeData: data,
      },
      () => {
        const { allList } = this.state
        onReady({
          ...value,
          treeData: data,
          allList,
          selectdData: [],
        })
      }
    )
  }
  componentDidMount() {
    this.getListManKey()
    stabilization(0, () => {
      this.init()
    }).then(() => {
      // this.init()
    })

    /*eslint-disable*/
    // this.refs.levelOneRef.getParentEl()
    // this.refs.levelThreeRef.getParentEl()
    // this.refs.levelTwoRef.getParentEl()
    /*eslint-disable*/
  }

  //获取列表
  getList = (treeData = [], list = []) => {
    const { mapKye = [], nextLevelKey, valueKey, labelKey } = this.props
    treeData.map((item) => {
      ;(item[nextLevelKey] || []).map((_item) => {
        ;(_item[nextLevelKey] || []).map((__item) => {
          let code = 'list.push({'
          // {
          //   categoryCode: 'supermarketCode', // 超市
          //   category: 'supermarket',
          //   categoryName: 'supermarketName',
          //   parentCategory: 'supermarketParent',
          // },
          // {
          //   categoryCode: 'middleCode', // 中类
          //   category: 'middle',
          //   categoryName: 'middleName',
          //   parentCategory: 'middleParent',
          // },
          // {
          //   categoryCode: 'smallCode', // 小类
          //   category: 'small',
          //   categoryName: 'smalleName',
          //   parentCategory: 'smalleParent',
          // },
          mapKye.forEach((element, index) => {
            code += ''
            if (index == 0) {
              for (let key in element) {
                code += `${element[key]}:item.${key},`
              }
            }
            if (index == 1) {
              for (let key in element) {
                code += `${element[key]}:_item.${key},`
              }
            }
            if (index == 2) {
              for (let key in element) {
                code += `${element[key]}:__item.${key},`
              }
            }
          })
          code += '})'
          eval(code)
        })
      })
    })
    return list
  }
  onChange(value = {}) {
    let { value: oldValue = {}, onChange = () => {}, labelKey, nextLevelKey, valueKey } = this.props
    const { allList, treeData = [], listManKey } = this.state
    value = {
      ...oldValue,
      ...value,
    }
    const { levelOneCheckedKeys = [], levelTwoCheckedKeys = [], levelThreeCheckedKeys = [] } = value
    let levelOneCheckedData = []

    levelOneCheckedKeys.map((item) => {
      let findData = findTreeData(
        treeData, // 树形数组或者数组数据
        item, // 需要查找的value
        valueKey, //需要查找数组对象的key
        nextLevelKey // 下一级的key，这个不用传
      )
      findData && levelOneCheckedData.push(findData)
    })

    let levelTwoCheckedData = []

    levelTwoCheckedKeys.map((item) => {
      let findData = findTreeData(
        treeData, // 树形数组或者数组数据
        item, // 需要查找的value
        valueKey, //需要查找数组对象的key
        nextLevelKey // 下一级的key，这个不用传
      )
      findData && levelTwoCheckedData.push(findData)
    })

    let levelThreeCheckedData = []

    levelThreeCheckedKeys.map((item) => {
      let findData = findTreeData(
        treeData, // 树形数组或者数组数据
        item, // 需要查找的value
        valueKey, //需要查找数组对象的key
        nextLevelKey // 下一级的key，这个不用传
      )
      findData && levelThreeCheckedData.push(findData)
    })

    onChange({
      ...value,
      allList,
      treeData,
      levelOneCheckedData,
      levelTwoCheckedData,
      levelThreeCheckedData,
      selectdData: this.getSelectList(allList, value),
    })
  }
  getSelectList = (list, value) => {
    const { listManKey } = this.state
    const { levelOneCheckedKeys = [], levelTwoCheckedKeys = [], levelThreeCheckedKeys = [] } = value
    return list.filter((item) => {
      if (
        (levelOneCheckedKeys &&
          levelOneCheckedKeys.length >= 1 &&
          levelOneCheckedKeys.find((_item) => {
            return _item == item[listManKey[0]]
          }) &&
          levelTwoCheckedKeys.length == 0 &&
          levelThreeCheckedKeys.length == 0) ||
        (levelOneCheckedKeys &&
          levelOneCheckedKeys.length >= 1 &&
          levelTwoCheckedKeys &&
          levelTwoCheckedKeys.length >= 1 &&
          levelTwoCheckedKeys.find((_item) => {
            return _item == item[listManKey[1]]
          }) &&
          levelThreeCheckedKeys.length == 0) ||
        (levelOneCheckedKeys &&
          levelOneCheckedKeys.length >= 1 &&
          levelTwoCheckedKeys &&
          levelTwoCheckedKeys.length >= 1 &&
          levelTwoCheckedKeys.find((_item) => {
            return _item == item[listManKey[1]]
          }) &&
          levelThreeCheckedKeys &&
          levelThreeCheckedKeys.length >= 1 &&
          levelThreeCheckedKeys.find((_item) => {
            return _item == item[listManKey[2]]
          }))
      ) {
        return true
      }
    })
  }
  getListManKey() {
    const { onChange = () => {}, value = {}, filterLevelTwo, filterLevelThree, mapKye = [], nextLevelKey, valueKey, labelKey } = this.props
    let listManKey = []
    mapKye.forEach((item, index) => {
      for (let key in item) {
        if (item.hasOwnProperty(key)) {
          if (key == valueKey) {
            listManKey.push(item[key])
          }
        }
      }
    })
    this.setState({
      listManKey,
    })
  }
  levelOneChange = (v) => {
    const { levelOne, allList, listManKey, treeData = [] } = this.state
    const { onChange = () => {}, value = {}, filterLevelTwo, filterLevelThree, mapKye = [], nextLevelKey, valueKey, labelKey } = this.props
    let levelTwo = []
    let nowData = null

    for (let item of v) {
      nowData = findTreeData(levelOne, item, valueKey, nextLevelKey)
      levelTwo = [...levelTwo, ...(nowData ? nowData[nextLevelKey] : [])]
    }

    this.setState(
      {
        // levelOneCheckedKeys: v,
        // levelTwoCheckedKeys: [],
        // levelThreeCheckedKeys: [],
        levelTwo: levelTwo,
      },
      () => {
        this.onChange({
          levelOneCheckedKeys: v,
          levelTwoCheckedKeys: [],
          levelThreeCheckedKeys: [],
        })
      }
    )
  }
  levelTwoChange = (v) => {
    const { levelOne, allList, listManKey, levelTwo, treeData } = this.state
    const { onChange = () => {}, value = {}, filterLevelTwo, filterLevelThree, mapKye = [], nextLevelKey, valueKey, labelKey } = this.props
    let levelThree = []
    let nowData = null

    for (let item of v) {
      nowData = findTreeData(levelTwo, item, valueKey, nextLevelKey)
      levelThree = [...levelThree, ...(nowData && nowData[nextLevelKey] ? nowData[nextLevelKey] : [])]
    }

    this.setState(
      {
        // levelTwoCheckedKeys: v,
        // levelThreeCheckedKeys: [],
        levelThree,
      },
      () => {
        this.onChange({
          levelTwoCheckedKeys: v,
          levelThreeCheckedKeys: [],
        })
      }
    )

    // this.setState({
    //   levelThree: v ? filterLevelTwo(findTreeData(levelTwo, v, valueKey))[nextLevelKey] : [],
    // })
    // let data = findTreeData(allList, v, listManKey[1])
    // let code = ' data = {...data,'
    // mapKye.forEach((item, index) => {
    //   if (index == 2 || (!data && index != 0)) {
    //     for (let key in item) {
    //       if (item.hasOwnProperty(key)) {
    //         code += `${item[key]}:'',`
    //       }
    //     }
    //   }
    // })
    // code += '}'
    // eval(code)
    // new Function(
    //   '_this',
    //   'data',
    //   `
    // _this.onChange(data)
    // `
    // )(this, data)
  }
  levelThreeChange = (v) => {
    this.onChange({
      levelThreeCheckedKeys: v,
    })
  }
  transformData = (data) => {
    const { nextLevelKey } = this.props
    return data.map((item) => {
      return {
        ...item,
        [nextLevelKey]: [],
      }
    })
  }
  render() {
    const {
      className = '',
      showLevelTwo,
      value = {},
      showLevelThree,
      valueKey,
      labelKey,
      nextLevelKey,
      searchProps = [{}, {}, {}],
      selectProps = [{}, {}, {}],
      treeProps = [{}, {}, {}],
    } = this.props
    const {
      listManKey,
      levelOneOpen, // 一级
      levelTwoOpen, // 二级
      levelThreeOpen, // 三级
      //  levelOneCheckedKeys, levelTwoCheckedKeys, levelThreeCheckedKeys
    } = this.state
    const { value: { levelOneCheckedKeys = [], levelTwoCheckedKeys = [], levelThreeCheckedKeys = [] } = {} } = this.props

    const { levelOne = [], levelTwo = [], levelThree = [] } = this.state
    // const fancySelectRef = useRef();
    return (
      <div className={`form-three-level-tree ${className}`}>
        <Select
          searchProps={(searchProps && searchProps[0]) || {}}
          selectProps={(selectProps && selectProps[0]) || {}}
          treeProps={(treeProps && treeProps[0]) || {}}
          // eslint-disable-next-line react/no-string-refs
          // ref="levelOneRef"
          value={levelOneCheckedKeys}
          onChangeOpen={(flag) => {
            this.setState({
              levelOneOpen: flag,
              levelTwoOpen: false,
              levelThreeOpen: false,
            })
          }}
          {...{
            open: levelOneOpen,
            labelKey,
            valueKey,
            nextLevelKey,
            levelOneCheckedKeys,
            levelTwoCheckedKeys,
            levelThreeCheckedKeys,
            levelKey: 'levelOne',
          }}
          data={this.transformData(levelOne)}
          onChange={(value) => {
            this.levelOneChange(value)
          }}
        />

        {showLevelTwo ? (
          <Select
            searchProps={(searchProps && searchProps[1]) || {}}
            selectProps={(selectProps && selectProps[1]) || {}}
            treeProps={(treeProps && treeProps[1]) || {}}
            // eslint-disable-next-line react/no-string-refs
            // ref="levelTwoRef"
            value={levelTwoCheckedKeys}
            onChangeOpen={(flag) => {
              this.setState({
                levelOneOpen: false,
                levelTwoOpen: flag,
                levelThreeOpen: false,
              })
            }}
            {...{
              open: levelTwoOpen,
              labelKey,
              valueKey,
              nextLevelKey,
              levelOneCheckedKeys,
              levelTwoCheckedKeys,
              levelThreeCheckedKeys,
              levelKey: 'levelTwo',
            }}
            data={this.transformData(levelTwo)}
            onChange={(value) => {
              this.levelTwoChange(value)
            }}
          />
        ) : null}
        {showLevelThree ? (
          <Select
            searchProps={(searchProps && searchProps[2]) || {}}
            selectProps={(selectProps && selectProps[2]) || {}}
            treeProps={(treeProps && treeProps[2]) || {}}
            // eslint-disable-next-line react/no-string-refs
            // ref="levelThreeRef"
            value={levelThreeCheckedKeys}
            onChangeOpen={(flag) => {
              this.setState({
                levelOneOpen: false,
                levelTwoOpen: false,
                levelThreeOpen: flag,
              })
            }}
            {...{
              open: levelThreeOpen,
              labelKey,
              valueKey,
              nextLevelKey,
              levelOneCheckedKeys,
              levelTwoCheckedKeys,
              levelThreeCheckedKeys,
              levelKey: 'levelThree',
            }}
            data={this.transformData(levelThree)}
            onChange={(value) => {
              this.levelThreeChange(value)
            }}
          />
        ) : null}
      </div>
    )
  }
}
