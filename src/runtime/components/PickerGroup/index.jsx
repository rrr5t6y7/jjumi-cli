import React, { useState, useEffect, useCallback, useMemo, useImperativeHandle } from 'react'
import { Button, Icon } from 'antd'
import { tryExecute } from 'toss.utils/base'
import { EmbedTablePicker } from './TablePicker'
import { EmbedTreePicker } from './TreePicker'
import ModalTrigger from './ModalTrigger'
import TextEllipsis from '../TextEllipsis'
import { lang } from 'toss.utils/lang'
import './styles.scss'

const productCardRender = data => {
  return (
    <div className="product-list-card">
      <img src={data.productImage} alt={data.productName} />
      <div className="metas">
        <div className="product-name">
          <TextEllipsis tooltip lines={2}>
            {data.productName}
          </TextEllipsis>
        </div>
        <span>{data.productCode}</span>
      </div>
    </div>
  )
}

// 预设的一些选择器配置
export const presetPickerTypes = {
  PRODUCT: {
    key: 'product',
    type: 'table',
    title: '商品',
    importable: true,
    searchFields: [
      {
        type: 'input',
        name: 'productName',
        label: '商品名称',
        labelSize: 'small',
      },
      {
        type: 'input',
        name: 'productCode',
        label: '商品编码',
        labelSize: 'small',
      },
      {
        type: 'input',
        name: 'barCode',
        label: '商品条码',
        labelSize: 'small',
      },
      {
        type: 'select',
        name: 'category',
        label: '商品分类',
        labelSize: 'small',
      },
      {
        type: 'input',
        name: 'brandCode',
        label: '品牌',
        labelSize: 'small',
      },
      {
        type: 'input',
        name: 'shopCode',
        label: '可售门店',
        labelSize: 'small',
      },
      {
        type: 'input',
        name: 'status',
        label: '商品状态',
        labelSize: 'small',
      },
    ],
    searchBarProps: {
      tailSpan: 2,
      tailAlign: 'right',
    },
    rowKey: 'productCode',
    selectable: true,
    columns: [
      {
        title: '商品信息',
        key: 'productInfo',
        render: productCardRender,
      },
      {
        title: '品牌',
        dataIndex: 'brandName',
      },
      {
        title: '销售价',
        dataIndex: 'salePrice',
      },
      {
        title: '可售库存',
        dataIndex: 'stock',
      },
      {
        title: '状态',
        dataIndex: 'statusName',
      },
    ],
  },
  BRAND: {
    key: 'brand',
    type: 'table',
    title: '品牌',
    importable: false,
    rowKey: 'brandCode',
    searchFields: [
      {
        type: 'input',
        name: 'brandName',
        label: lang('品牌名称'),
        labelSize: 'small',
      },
      {
        type: 'input',
        name: 'brandCode',
        label: lang('品牌编码'),
        labelSize: 'small',
      },
    ],
    columns: [
      {
        title: lang('品牌编码'),
        dataIndex: 'brandCode',
      },
      {
        title: lang('品牌名称'),
        dataIndex: 'brandName',
      },
    ],
  },
  CATEGORY: {
    key: 'category',
    type: 'tree',
    title: '商品分类',
  },
  STORE: {
    key: 'store',
    type: 'tree',
    transfer: true,
    title: '门店',
  },
}

export const addPresetPickerType = (typeName, sectionConfig) => {
  presetPickerTypes[typeName] = sectionConfig
}

export const removePresetPickerType = typeName => {
  delete presetPickerTypes[typeName]
}

const SectionContent = React.memo(props => {
  const { section, value, active, readOnly } = props
  const [activedBefore, setActivedBefore] = useState(false)
  const innerReadOnly = typeof section.readOnly === 'boolean' ? section.readOnly : readOnly

  const handleChange = useCallback(
    (...argus) => {
      return innerReadOnly ? false : props.onChange(props.sectionKey, ...argus)
    },
    [props.onChange, props.sectionKey, innerReadOnly]
  )

  useEffect(() => {
    if (active && !activedBefore) {
      setActivedBefore(true)
    }
  }, [activedBefore, active])

  /**
   * 第一次active之前，不渲染任何内容
   */
  if (!active && !activedBefore) {
    return null
  }

  /**
   * 如果一个section本身具有render属性，
   * 则直接返回其render的结果，不再渲染默认内容
   */
  if (typeof section.render === 'function') {
    return section.render(section)
  }

  /**
   * 树形选择器
   */
  if (section.type === 'tree') {
    return (
      <EmbedTreePicker
        {...section}
        value={value}
        active={active}
        onChange={handleChange}
        readOnly={innerReadOnly}
        className={`section section-key-${section.key} section-type-tree`}
      />
    )
  }

  /**
   * 列表型选择器
   */
  if (section.type === 'table') {
    return (
      <EmbedTablePicker
        {...section}
        value={value}
        active={active}
        onChange={handleChange}
        readOnly={innerReadOnly}
        className={`section section-key-${section.key} section-type-table`}
      />
    )
  }
})

/**
 * 组合选择器组件核心
 */
export const EmbedPickerGroup = React.memo(
  React.forwardRef((props, ref) => {
    const [activeSectionKey, setActiveSectionKey] = useState(null)
    const handleSwitchSeciton = useCallback(event => {
      setActiveSectionKey(event.currentTarget.dataset.key)
    }, [])

    const handleChange = useCallback(
      (sectionKey, value) => {
        props.onChange({ ...props.value, [sectionKey]: value })
      },
      [props.value, props.onChange]
    )

    const renderedSections = useMemo(() => {
      return props.readOnly ? props.sections.filter(section => props.value[section.key].length > 0) : props.sections
    }, [props.readOnly, props.sections, props.value])

    useEffect(() => {
      setActiveSectionKey(props.readOnly ? renderedSections[0]?.key : props.defaultActiveKey || renderedSections[0]?.key)
    }, [renderedSections, props.readOnly, props.defaultActiveKey])

    return (
      <div className={`lz-embed-picker-group ${props.className}`}>
        <div className="picker-header">
          <h4 className="picker-title">{props.title}</h4>
          <div className="header-center">{props.headerCenterContent}</div>
        </div>
        {props.headerExtraContent}
        <div className="picker-body">
          <div className="section-titles">
            {renderedSections.map(section => {
              return (
                <div
                  key={section.key}
                  data-key={section.key}
                  onClick={handleSwitchSeciton}
                  className={`item ${section.key === activeSectionKey ? 'active' : ''}`}>
                  {section.title}
                </div>
              )
            })}
          </div>
          {renderedSections.map(section => {
            const sectionActive = section.key === activeSectionKey
            return (
              <div key={section.key} className={`section-content ${sectionActive ? 'active' : ''}`}>
                <SectionContent
                  active={sectionActive}
                  sectionKey={section.key}
                  onChange={handleChange}
                  value={props.value[section.key]}
                  section={section}
                  readOnly={props.readOnly}
                />
              </div>
            )
          })}
        </div>
        {props.footerExtraContent}
        {props.readOnly ? (
          <div className="picker-footer">
            <div className="footer-left">{props.customFooterLeft}</div>
            <div className="selected-count">
              {props.selectedLabel}
              {renderedSections.map(section => (
                <span className="item" key={section.key}>
                  {section.title}（<span className="text-danger">{props.value[section.key]?.length || 0}</span>）
                </span>
              ))}
            </div>
            <div className="footer-buttons">
              <Button className="button-cancel" onClick={props.onCancel}>
                {props.closeText}
              </Button>
            </div>
          </div>
        ) : (
          <div className="picker-footer">
            <div className="footer-left">{props.customFooterLeft}</div>
            <div className="selected-count">
              {props.selectedLabel}
              {renderedSections.map(section => (
                <span className="item" key={section.key}>
                  {section.title}（<span className="text-danger">{props.value[section.key]?.length || 0}</span>）
                </span>
              ))}
            </div>
            <div className="footer-buttons">
              <Button className="button-confirm" type="primary" onClick={props.onConfirm}>
                {props.confirmText}
              </Button>
              <Button className="button-cancel" onClick={props.onCancel}>
                {props.cancelText}
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  })
)

EmbedPickerGroup.defaultProps = {
  value: {},
  defaultValue: {},
  sections: [],
  className: '',
  readOnly: false,
  confirmText: lang('确定'),
  cancelText: lang('取消'),
  closeText: lang('关闭'),
  selectedLabel: lang('已选：'),
}

export const selectedRangeFormatter = props => {
  return (
    <div className="selected-text">
      {lang('已选：')}
      {props.sections.map(item => {
        if (props.readOnly && !props.value[item.key]?.length) {
          return null
        }
        return (
          <span key={item.key}>
            {item.title}(<span className="text-danger">{props.value[item.key]?.length || 0}</span>)
          </span>
        )
      })}
    </div>
  )
}

export default React.memo(
  React.forwardRef((props, ref) => {
    return (
      <ModalTrigger
        modalClassName="lz-picker-group-modal"
        selectedTextFormatter={selectedRangeFormatter}
        showFooter={false}
        modalWidth={1006}
        entryChildren={props.children}
        {...props}>
        <EmbedPickerGroup ref={ref} />
      </ModalTrigger>
    )
  })
)
