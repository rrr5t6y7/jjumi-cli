import React from 'react'
import { Prompt } from 'react-router-dom'
import { Form, Modal, Button, DatePicker, Select, Cascader, Checkbox, Radio, Spin } from 'antd'
import { RangePicker } from '@lingzhi/react-components'
import BasePage from 'toss.components/BasePage'
import FormInput from 'toss.components/FormInput'
import RadioInput from 'toss.components/RadioInput'
import { base, validate } from 'toss.utils'
import './styles.scss'

const { Item: FormItem } = Form
const { MonthPicker, WeekPicker } = DatePicker

/**
 * 一个用于挂载扩展表单类型的对象
 */
const extendFieldTypes = {}

/**
 * 这是一个独立的函数，用于处理RangePicker组件的属性
 */
const resolveRangePickerProps = options => {
  const { pickerProps = [], decoratorOptions = [] } = options
  let nextPickerProps = pickerProps

  if (options.readOnly) {
    nextPickerProps = [
      {
        ...pickerProps[0],
        disabled: true,
      },
      {
        ...(pickerProps[1] || pickerProps[0]),
        disabled: true,
      },
    ]
  }

  return { pickerProps: nextPickerProps, decoratorOptions }
}

class FormBasePage extends BasePage {
  /**
   * 静态方法，用于扩展表单类型
   * @param {Object|[Object]} fieldType 需要扩展的表单类型对象或数组
   */
  static extendFieldType(fieldType) {
    if (Array.isArray(fieldType)) {
      fieldType.forEach(FormBasePage.extendFieldType)
    } else if (fieldType && fieldType.type && fieldType.renderer) {
      extendFieldTypes[fieldType.type] = fieldType
    }
  }

  constructor(props) {
    super(props)

    /**
     * 从URL参数中获取pageId和pageAction
     */
    let pageId = this.pageMatchParams.id || this.pageURLParams.id
    let pageAction = this.pageMatchParams.action || this.pageURLParams.action || 'view'

    if (pageId === 'create') {
      pageAction = 'create'
      pageId = null
    }

    this.state = {
      loading: false,
      submiting: false,
      pageAction: pageAction,
      isUrgentEditMode: pageAction === this.urgentEditModeAction,
      pageId: pageId,
      willNavigate: false,
      collapsedSections: {},
      originalData: {},
      ...this.getDefaultState(),
    }
  }

  /**
   * 业务通信频道
   */
  businessChannel = null

  /**
   * 紧急修改操作的action值
   * 例如通过/xxx/urgent-edit访问，
   * 组件state中的isUrgentEditMode便是true，
   * 在组件中统一通过isUrgentEditMode来进行紧急修改业务逻辑的处理
   */
  urgentEditModeAction = 'urgent-edit'

  /**
   * 发布更新广播，用于通知相同业务通信频道下的TablePaseBage更新列表数据
   * @param {any} data 广聚数据
   */
  publishUpdate(data) {
    if (this.businessChannel) {
      this.publishBroadcast({
        channel: this.businessChannel,
        type: 'FORM_PAGE_UPDATE',
        data: data,
      })
    }
  }

  /** 表单项分组标题点击事件响应 */
  handleSectionTitleClick = event => {
    const { collapsedSections = {} } = this.state
    const { collapsible, name } = event.currentTarget.dataset

    if (collapsible === 'true') {
      this.setState({
        collapsedSections: {
          ...collapsedSections,
          [name]: !collapsedSections[name],
        },
      })
    }
  }

  /** 根据getFormFields返回的表单项配置，生成Antd表单对象 */
  createFormField = fieldData => {
    let withoutForm = false
    let fieldComponent = null
    const { isUrgentEditMode } = this.state

    /**
     * 如果表单项配置了exclude属性为true，则不生成此表单项
     * 通常用于需要根据条件动态渲染表单项的场景
     */
    if (fieldData.exclude) {
      return null
    }

    if (typeof fieldData.type === 'string') {
      const fieldType = fieldData.type.toLowerCase()
      const { collapsedSections = {} } = this.state

      /** section用于将一系列表单项归纳到一组，并在视觉上有区分显示 */
      if (fieldType === 'section') {
        return (
          <div className="lz-form-section" data-collapsed={collapsedSections[fieldData.name]}>
            {/** section的标题是可选的 */}
            {fieldData.title ? (
              <h5
                className="section-title"
                data-collapsible={fieldData.collapsible}
                data-name={fieldData.name}
                onClick={this.handleSectionTitleClick}>
                <span className="title-text">{fieldData.title}</span>
                {/** tail属性用于在section标题的右侧展示额外的内容 */}
                <div className="title-tail">{fieldData.tail}</div>
              </h5>
            ) : null}
            <div className="section-items">
              {/** 对分组下的子表单项目数组遍历并生成对应的表单元素 */}
              {fieldData.items.map(item => {
                if (!item) {
                  return null
                }
                const fieldName = item.name instanceof Array ? item.name.join('-') : item.name
                return (
                  <div key={fieldName} className={`lz-form-item ${item.hidden ? 'hidden' : ''} item-${fieldName} span-${item.span || 1}`}>
                    {this.createFormField(item)}
                  </div>
                )
              })}
            </div>
          </div>
        )
      }

      /**
       * size 属性目前仅对input和select类型的表单项生效
       * 用于控制输入框和下拉选择器的展示宽度
       */
      const { size } = fieldData
      const styleProps = {}
      if (size && size > 0) {
        styleProps.style = { width: size }
      } else if (typeof size === 'string') {
        styleProps['data-size'] = size
      }

      if (extendFieldTypes[fieldType]) {
        /** 优先匹配扩展的表单类型 */
        withoutForm = extendFieldTypes[fieldType].withoutForm
        fieldComponent = extendFieldTypes[fieldType].renderer(fieldData, this.props.form)
        fieldData = extendFieldTypes[fieldType].modifier ? extendFieldTypes[fieldType].modifier(fieldData) : fieldData
      } else if (fieldType === 'input') {
        /** 普通的输入框组件 */
        fieldComponent = <FormInput readOnly={fieldData.readOnly} {...styleProps} {...fieldData.props} />
      } else if (fieldType === 'number') {
        /** 带有加/减号的数字输入框组件 */
        fieldComponent = <FormInput readOnly={fieldData.readOnly} type="number" {...fieldData.props} />
      } else if (fieldType === 'textarea') {
        /** 多行文本输入框组件 */
        fieldComponent = <FormInput readOnly={fieldData.readOnly} type="textarea" {...fieldData.props} />
      } else if (fieldType === 'radio-input') {
        /** 单选框和输入框的组合组件 */
        fieldComponent = <RadioInput className="lz-form-raido-input" {...fieldData.props} />
      } else if (fieldType === 'select') {
        /** 下拉选择框组件 */
        const { valueKey = 'value', labelKey = 'label', options = [], showAll = false, allOptionValue = '', allOptionLabel = '请选择' } = fieldData
        fieldComponent = (
          <Select disabled={fieldData.readOnly} {...styleProps} {...fieldData.props}>
            {showAll ? <Select.Option value={allOptionValue}>{allOptionLabel}</Select.Option> : null}
            {options.map(item => (
              <Select.Option key={item[valueKey]} value={item[valueKey]}>
                {item[labelKey]}
              </Select.Option>
            ))}
          </Select>
        )
      } else if (fieldType === 'checkbox') {
        /** 复选框组件 */
        const { checkedItems = [], valueKey = 'value', labelKey = 'label', checkedOptionsLocked, handleChange = base.noop, options = [] } = fieldData
        fieldComponent = (
          <Checkbox.Group disabled={fieldData.readOnly} className="lz-checkbox-group" {...fieldData.props}>
            {options.map(item => (
              <Checkbox
                key={item[valueKey]}
                value={item[valueKey]}
                onChange={handleChange}
                disabled={(checkedOptionsLocked && checkedItems.map(item => `${item}`).includes(`${item[valueKey]}`)) || item.disabled}>
                {item[labelKey]}
              </Checkbox>
            ))}
          </Checkbox.Group>
        )
      } else if (fieldType === 'radio') {
        /** 单选框组件 */
        const { valueKey = 'value', labelKey = 'label', options = [] } = fieldData
        fieldComponent = (
          <Radio.Group disabled={fieldData.readOnly} className="lz-radio-group" {...fieldData.props}>
            {options.map(item => (
              <Radio key={item[valueKey]} value={item[valueKey]} disabled={item.disabled} style={item.style ? item.style : {}}>
                {item[labelKey]}
              </Radio>
            ))}
          </Radio.Group>
        )
      } else if (fieldType === 'date') {
        /** 日期选择器组件 */
        fieldComponent = <DatePicker disabled={fieldData.readOnly} className="lz-date-picker" {...fieldData.props} />
      } else if (fieldType === 'month') {
        /** 月份选择器组件 */
        fieldComponent = <MonthPicker readOnly={fieldData.readOnly} className="lz-month-picker" {...fieldData.props} />
      } else if (fieldType === 'week') {
        /** 星期选择器组件 */
        fieldComponent = <WeekPicker readOnly={fieldData.readOnly} className="lz-week-picker" {...fieldData.props} />
      } else if (fieldType === 'button') {
        /** 普通按钮 */
        fieldComponent = <Button {...fieldData.props} />
      } else if (fieldType === 'cascader') {
        /** 级联选择器组件 */
        fieldComponent = <Cascader readOnly={fieldData.readOnly} className="lz-cascader" {...fieldData.props} options={fieldData.options} />
      } else if (fieldType === 'range') {
        /** 日期范围选择器组件 */
        withoutForm = true
        const { pickerProps, decoratorOptions } = resolveRangePickerProps(fieldData)

        fieldComponent = (
          <FormItem
            validateStatus=""
            label={fieldData.label}
            required={fieldData.required}
            className={`form-page-form-item label-size-${fieldData.labelSize || 'medium'}`}>
            <RangePicker
              form={this.props.form}
              pickerProps={pickerProps}
              fieldNames={fieldData.name}
              decoratorOptions={decoratorOptions}
              formItemProps={fieldData.formItemProps}
              className={`lz-form-page-calendar label-size-${fieldData.labelSize || 'meduim'} ${fieldData.hideErrorText ? 'hide-error-text' : ''}`}
              {...fieldData.props}
            />
            {fieldData.suffix ? fieldData.suffix : null}
          </FormItem>
        )
      }
    }

    /**
     * 除了以上定义的一系列内置表单类型，
     * 还可以通过component或render属性，来渲染自定义的组件
     */
    if (fieldData.component) {
      fieldComponent = fieldData.component
    } else if (fieldData.render) {
      fieldComponent = fieldData.render(this.props.form, this)
    }

    /**
     * 某些情况下通过extendFieldType扩展的表单类型，其内部已经包含了Antd的Form Item，
     * 不再需要FormBasePage在生成表单元素时包裹一层Form Item组件，
     * 这种情况将withoutForm参数设置为true即可
     */
    if (typeof fieldData.withoutForm !== 'undefined') {
      withoutForm = fieldData.withoutForm
    }

    if (fieldData.readOnly && fieldData.decoratorOptions) {
      // fieldData.decoratorOptions.rules = []
    }

    if (!withoutForm && fieldComponent) {
      const decoratorOptions = fieldData.decoratorOptions || {}
      let validateRules = decoratorOptions.rules || []

      if (isUrgentEditMode) {
        validateRules = validateRules.concat(decoratorOptions.urgentEditRules || [])
      }

      return (
        <FormItem
          className={`form-page-form-item label-size-${fieldData.labelSize || 'medium'} ${fieldData.hideErrorText ? 'hide-error-text' : ''}`}
          label={fieldData.label}
          {...fieldData.formItemProps}>
          {fieldData.prefix ? fieldData.prefix : null}
          {fieldData.viewOnly
            ? fieldComponent
            : this.props.form.getFieldDecorator(fieldData.name, {
                initialValue: fieldData.initialValue,
                ...decoratorOptions,
                rules: validateRules,
              })(fieldComponent)}
          {fieldData.suffix ? fieldData.suffix : null}
        </FormItem>
      )
    }

    return fieldComponent
  }

  /**
   * 定义表单的表单项目，返回一个数组
   */
  getFormFields = () => {
    return []
  }

  /**
   * 返回是否需要在离开页面前弹窗提示
   */
  getNeedPrompt = () => {
    return !this.state.willNavigate && this.isFieldsTouched() && !this.preventNavigatePrompt
  }

  /**
   * 设置离开页面的弹窗提示文字
   */
  routeInterceptFn = location => {
    return lang('确认要离开此页面么？')
  }

  /**
   * 传入一个表单项目的字段名，获取其当前值
   */
  getFieldValue = fieldName => {
    return this.props.form.getFieldValue(fieldName)
  }

  /**
   * 传入一组表单项目的字段名，获取其当前值
   */
  getFieldsValue = fieldNames => {
    return this.props.form.getFieldsValue(fieldNames)
  }

  /**
   * 通过键值对对象的方式设置表单值
   */
  setFieldsValue = (fieldsData, callback) => {
    return this.props.form.setFieldsValue(fieldsData, callback)
  }

  /**
   * 返回表单当前是否进行过修改
   */
  isFieldsTouched = () => {
    return this.props.form.isFieldsTouched()
  }

  /**
   * 重写方法，用于定义表单的初始值
   * 需要返回一个包含initData和originalData的对象
   */
  getInitData = () => null

  /**
   * 初始化表单
   */
  initForm = async () => {
    try {
      this.setState({ loading: true })
      const result = await this.getInitData()
      this.setState({ loading: false })
      if (result && result.initData) {
        this.setFieldsValue(result.initData)
        this.setState({
          originalData: result.originalData,
        })
      }
    } catch (error) {
      console.warn(error)
      this.setState({ loading: false })
    }
  }

  /**
   * 重写方法，用于自行处理提交操作
   * 可从参数中获取到表单里面全部字段的值
   */
  submitForm = formData => {}

  /**
   * 重写方法，用于在表单提交前做一下拦截操作
   * 返回false可阻止表单提交
   */
  formWillSubmit = async event => {
    return true
  }

  /**
   * 内部方法，用于处理表单提交
   */
  handleSubmit = async event => {
    if (event && (!event.target || event.target.dataset.role !== 'lz-page-form')) {
      return false
    }

    if (event) {
      event.preventDefault()
    }

    this.setState({ willNavigate: true }, () => {
      this.validateFieldsAndScroll(async (errors, fields) => {
        const allowSubmit = await this.formWillSubmit(errors, fields)
        if (!errors) {
          try {
            if (allowSubmit === false) {
              return false
            }
            this.setState({ submiting: true })
            await this.submitForm(fields)
            this.safeSetState({ submiting: false })
          } catch (error) {
            console.warn(errors)
            this.setState({ submiting: false })
          }
        } else {
          console.warn(errors)
        }
      })
      this.safeSetState({ willNavigate: false })
    })
  }

  /**
   * 内部方法，用于阻止回车提交表单
   */
  handleFormKeyDown = (event) => {
    if (event && event.keyCode === 13 && event.target && event.target.tagName === 'INPUT' ) {
      event.preventDefault()
      return false
    }
  }

  /**
   * 高阶函数，用于指定表单项目的校验函数
   */
  getCustomValidator = validateFn => (rule, value, callback) => {
    try {
      callback(validateFn(value, validate, rule))
    } catch (error) {
      callback(error.message)
    }
  }

  /**
   * 另外一个用于处理校验规则的函数，可能会弃用
   */
  getFieldValidator = (validatorName, dependencies, validateRule, message) => {
    return (rule, value, callback) => {
      let dependenciesValue = null
      if (Array.isArray(dependencies)) {
        dependenciesValue = this.getFieldsValue(dependencies)
      } else if (typeof dependencies === 'string') {
        dependenciesValue = this.getFieldValue(dependencies)
      }
      if (validate.validators[validatorName]) {
        if (validate.validators[validatorName](value, validateRule || dependenciesValue)) {
          callback()
        } else {
          callback(message)
        }
      } else {
        callback(`找不到校验器:${validatorName}`)
      }
    }
  }

  /**
   * 主动校验当前表单中的某些字段或全部字段
   */
  validateFields = (filedNames, options, callback) => {
    return this.props.form.validateFields(filedNames, options, callback)
  }

  /**
   * 主动校验当前表单中的某些字段或全部字段，并将页面滚动到最顶部的错误位置
   */
  validateFieldsAndScroll = (filedNames, options, callback) => {
    return this.props.form.validateFieldsAndScroll(filedNames, options, callback)
  }

  /**
   * 处理页面退出操作
   */
  handleExitPage = () => {
    if (this.isFieldsTouched()) {
      Modal.confirm({
        width: 360,
        title: lang('温馨提示'),
        content: lang('关闭后当前已输入信息不会保存，确定关闭吗？'),
        onOk: () => {
          window.close()
        },
      })
    } else {
      window.close()
    }
  }

  /**
   * 重写方法，用于指定表单底部内容，通常是提交、关闭的按钮
   */
  renderFormFooter = () => {
    return null
  }

  /**
   * 内部方法，用于渲染表单组件
   */
  renderForm = () => {
    const { loading, submiting, pageAction } = this.state
    const formFooter = this.renderFormFooter(loading)

    return (
      <Spin spinning={loading || submiting}>
        <Form onSubmit={this.handleSubmit} data-action={pageAction} data-role="lz-page-form" className="lz-page-standard-form">
          <div className="form-content" onKeyDown={this.handleFormKeyDown}>
            <Prompt when={this.getNeedPrompt()} message={this.routeInterceptFn} />
            {this.getFormFields().map(item => {
              const fieldName = item.name instanceof Array ? item.name.join('-') : item.name
              return item.exclude ? null : (
                <div
                  key={fieldName}
                  className={`lz-form-item type-${item.type || 'custom'} item-${fieldName} ${item.hidden ? 'hidden' : ''} span-${item.span || 1}`}>
                  {this.createFormField(item)}
                </div>
              )
            })}
          </div>
          {formFooter && <div className="lz-form-footer">{formFooter}</div>}
        </Form>
      </Spin>
    )
  }

  componentDidMount() {
    super.componentDidMount()
    this.initForm()
  }
}

export default FormBasePage
