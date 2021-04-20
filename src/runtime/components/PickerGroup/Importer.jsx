import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react'
import { Spin, Button, Select, Upload, Icon, message } from 'antd'
import { requestService, requestURI } from 'toss.service'
import { lang } from 'toss.utils/lang'
import { delay } from 'toss.utils/base'
import './Importer.scss'

const DefaultDraggerContent = React.memo(props => (
  <div>
    <p className="ant-upload-drag-icon">
      <Icon type="inbox" />
    </p>
    <p className="ant-upload-text">{lang('点击或将文件拖拽到这里上传')}</p>
    <p className="ant-upload-hint">{lang('支持扩展名：{accepts}格式', { accepts: props.accepts.join('、') })}</p>
  </div>
))

// 默认的导入错误处理函数
export const defaultImportErrorHandler = error => error

// 导入接口返回数据的默认处理函数
// 可通过组件的importRespnoseHandler来覆盖
export const defaultImportResponseHandler = response => {
  const responseData = response.data

  // 返回的数据中需要包含以下字段：
  // pollingId      异步导入模式下，轮询进度用的id
  // completed      异步导入模式下，全部导入完成的标志
  // allFailed      全部失败的标志
  // partialFailed  部分失败标志

  responseData.pollingId = responseData.id
  responseData.completed = responseData.status > 1

  responseData.allFailed = responseData.successRows === 0 // 全部失败
  responseData.partialFailed = responseData.successRows > 0 && responseData.successRows < responseData.totalRows // 部分失败

  return responseData
}

// 异步导入模式下的状态轮询接口返回数据的默认处理函数
// 可通过组件的pollingRespnoseHandler来覆盖
export const defaultPollingResponseHandler = response => {
  const responseData = response.data

  // 返回的数据中需要包含以下字段：
  // completed      全部导入完成的标志
  // allFailed      全部失败的标志
  // partialFailed  部分失败标志

  responseData.completed = responseData.status > 1
  responseData.allFailed = responseData.successRows === 0 // 全部失败
  responseData.partialFailed = responseData.successRows > 0 && responseData.successRows < responseData.totalRows // 部分失败

  return responseData
}

// 导入模式
export const importTypes = {
  SYNC: 'sync', // 同步导入模式
  ASYNC: 'async', // 异步导入模式
}

// 异步导入说明：
// 1: importType属性传'async'（或者importTypes.ASYNC）
// 2: poller/pollerServiceName/pollerServiceURI至少传一个，不然组件不知道如何轮询
// 3: 在pollingResponseHandler中，处理好服务端接口返回的数据，参考：defaultPollingResponseHandler

const Importer = React.memo(
  React.forwardRef((props, ref) => {
    const pollingTimer = useRef()
    const [importing, setImporting] = useState(false)
    const [importError, setImportError] = useState(null)
    const [importResponse, setImportResponse] = useState(null)
    const [templateType, setTemplateType] = useState(Array.isArray(props.template) ? props.template[0]?.type : '')

    // 处理导入模板的下载参数
    const templateParams = useMemo(() => {
      return Array.isArray(props.template) ? props.template : props.template ? { ...Importer.defaultProps.template, ...props.template } : null
    }, [props.template])

    // 下载导入模板
    const downloadTemplate = useCallback(() => {
      if (!templateParams) {
        return false
      }

      const { code, downloadParams } =
        (Array.isArray(templateParams) ? templateParams.find(item => item.type === templateType) : templateParams) || {}

      const mergedDownloadParams = { ...downloadParams, templateType, code }

      if (props.templateDownloader) {
        props.templateDownloader(mergedDownloadParams)
      } else if (props.templateDownloadServiceName) {
        requestService.download(props.templateDownloadServiceName, mergedDownloadParams)
      } else if (props.templateDownloadServiceURI) {
        requestURI.download(props.templateDownloadServiceURI, mergedDownloadParams)
      } else {
        console.warn('未指定下载模版的服务名(templateDownloadServiceName)或服务地址(templateDownloadServiceURI)或下载函数(templateDownloader)')
      }
    }, [templateType, templateParams, props.templateDownloader, props.templateDownloadServiceName, props.templateDownloadServiceURI])

    // 导入成功
    const handleImportSuccess = useCallback(
      (response, file) => {
        const handledResponse = props.importResponseHandler(response)
        setImporting(false)
        setImportResponse(handledResponse)
        props.onImport && props.onImport(handledResponse, file, templateType)
      },
      [props.onImport, props.importResponseHandler, templateType]
    )

    // 导入失败
    const handleImportError = useCallback(
      (error, file) => {
        const handledError = props.importErrorHandler(error)
        setImporting(false)
        setImportError(handledError)
        props.onImportError && props.onImportError(handledError, file, templateType)
      },
      [props.onImportError, props.importErrorHandler, templateType]
    )

    // 导入开始之前的数据处理
    const handleBeforeImport = useCallback(
      file => {
        if (!file) {
          return false
        }

        // 校验文件格式
        if (!props.accepts.includes(`.${file.name.split('.').slice(-1)[0].toLowerCase()}`)) {
          message.error(lang('文件格式错误，支持格式：{accepts}', { accepts: props.accepts.join('、') }))
          return false
        }

        setImportError(null)
        setImportResponse(null)
        return props.onBeforeImport ? props.onBeforeImport(file, templateType) : true
      },
      [props.onBeforeImport, props.accepts, templateType]
    )

    // 轮询请求函数
    const getPollingHandler = useCallback(
      (pollingId, templateType) => {
        if (props.poller) {
          return props.poller({ id: pollingId, templateType })
        } else if (props.pollingServiceName) {
          return requestService(props.pollingServiceName, null, { id: pollingId, templateType })
        } else if (props.pollingServiceURI) {
          return requestURI.post(props.pollingServiceURI, { id: pollingId, templateType })
        } else {
          return false
        }
      },
      [props.poller, props.pollingServiceName, props.pollingServiceURI]
    )

    // 轮训异步导入状态
    const pollingAsyncStatus = useCallback(
      (pollingId, file, templateType, onSuccess, onError) => {
        // 先清除定时器
        clearTimeout(pollingTimer.current)

        // 获取轮询器
        const pollingHandler = getPollingHandler(pollingId, templateType)

        if (!pollingHandler) {
          const error = { code: 404, message: '未指定轮询服务名(pollingServiceName)或服务地址(pollingServiceURI)或轮询函数(poller)' }
          return handleImportError(error, file), onError(error)
        }

        pollingHandler
          .then(res => {
            const handledResponse = props.pollingResponseHandler(res)

            if (handledResponse.completed) {
              // 全部导入完后进入导入成功的处理逻
              setImporting(false)
              setImportResponse(handledResponse)
              props.onImport && props.onImport(handledResponse, file, templateType)
              onSuccess(res, file)
            } else {
              // 否则继续轮询
              pollingTimer.current = setTimeout(() => {
                pollingAsyncStatus(pollingId, file, templateType, onSuccess, onError)
              }, props.pollingInterval)
            }
          })
          .catch(error => {
            // 导入状态获取出错
            handleImportError(error, file)
            onError(error)
          })
      },
      [getPollingHandler, handleImportError, props.onImport, props.pollingResponseHandler, props.pollingInterval]
    )

    // 开始获取异步导入状态
    const beginPollingAsyncStatus = useCallback(
      (response, file, onSuccess, onError) => {
        const handledResponse = props.importResponseHandler(response)
        if (handledResponse.completed) {
          // 如果一开始就返回了全部导入完成，
          // 那直接进入导入成功的处理逻辑即可
          handleImportSuccess(response, file)
          onSuccess(response, file)
        } else {
          // 否则开始轮询
          pollingAsyncStatus(handledResponse.pollingId, file, templateType, onSuccess, onError)
        }
      },
      [props.importResponseHandler, handleImportSuccess, pollingAsyncStatus, templateType]
    )

    // 处理导入操作
    const handleImport = useCallback(
      options => {
        const mergedImportParams = {
          [props.importFileFieldName]: options.file,
          ...props.importParams,
          templateType,
        }
        let importHandler = null
        setImporting(true)

        // 将object转换为FormData
        const importFormData = new FormData()
        Object.keys(mergedImportParams).forEach(key => {
          importFormData.append(key, mergedImportParams[key])
        })

        if (props.importer) {
          importHandler = props.importer(importFormData, mergedImportParams)
        } else if (props.importServiceName) {
          importHandler = requestService(props.importServiceName, importFormData, null, {
            isFormData: true,
            timeout: props.importTimeout,
          })
        } else if (props.importServiceURI) {
          importHandler = requestURI.post(props.importServiceURI, importFormData, {
            isFormData: true,
            timeout: props.importTimeout,
          })
        } else {
          setImporting(false)
          console.warn('未指定导入的服务名(importServiceName)或服务地址(importServiceURI)或导入函数(importer)')
          return false
        }

        importHandler
          .then(res => {
            if (props.importType === importTypes.ASYNC) {
              // 异步导入的场景，导入接口返回导入标志，
              // 后续根据标志轮询导入进度，直到导入完成
              beginPollingAsyncStatus(res, options.file, options.onSuccess, options.onError)
            } else {
              // 同步导入的场景，接口调完成即导入成功
              handleImportSuccess(res, options.file)
              options.onSuccess(res, options.file)
            }
          })
          .catch(error => {
            handleImportError(error, options.file)
            options.onError(error)
          })
      },
      [
        templateType,
        beginPollingAsyncStatus,
        props.importType,
        props.importer,
        props.importFileFieldName,
        props.importServiceName,
        props.importServiceURI,
        props.importParams,
      ]
    )

    // 下载错误文件
    const downloadErrorFile = useCallback(() => {
      const importRecordId = importResponse[props.importIdFieldName]
      const mergedDownloadParams = {
        ...props.errorFileDownloadParams,
        templateType,
        id: importRecordId,
      }

      if (props.errorFileDownloader) {
        props.errorFileDownloader(mergedDownloadParams)
      } else if (props.errorFileDownloadServiceName) {
        requestService.download(props.errorFileDownloadServiceName, mergedDownloadParams, {
          id: importRecordId,
        })
      } else if (props.errorFileDownloadServiceURI) {
        requestURI.download(props.errorFileDownloadServiceURI, mergedDownloadParams)
      } else {
        console.warn('未指定下载错误文件的服务名(errorFileDownloadServiceName)或服务地址(errorFileDownloadServiceURI)或下载函数(errorFileDownloader)')
        return false
      }
    }, [
      templateType,
      importResponse,
      props.importIdFieldName,
      props.errorFileDownloader,
      props.errorFileDownloadServiceName,
      props.errorFileDownloadServiceURI,
      props.errorFileDownloadParams,
    ])

    const importResult = useMemo(() => {
      if (importing) {
        return <span>{props.importingText}</span>
      }
      console.log('importResponse')
      console.log(importResponse)
      if (importError) {
        return (
          <span>
            {lang('导入失败：')}
            <span className="text-danger">{importError?.message || lang('未知原因')}</span>
          </span>
        )
      }

      if (importResponse) {
        if (importResponse.partialFailed) {
          return (
            <span>
              {lang('部分成功：')}
              <span className="text-link" onClick={downloadErrorFile}>
                {lang('下载错误文件')}
              </span>
            </span>
          )
        } else if (importResponse.allFailed) {
          return (
            <span>
              {lang('导入失败：')}
              <span className="text-link" onClick={downloadErrorFile}>
                {lang('下载错误文件')}
              </span>
            </span>
          )
        } else {
          return <span>{lang('导入成功')}</span>
        }
      }
      return null
    }, [importError, importResponse, importing, props.importingText])

    useEffect(() => {
      return () => {
        clearTimeout(pollingTimer.current)
      }
    }, [])

    return (
      <div className="lz-drag-importer">
        <Spin className="lz-centered-spinning" tip={props.importingText} spinning={importing} />
        <div className="header">
          <div className="left">
            {Array.isArray(templateParams) ? (
              <>
                <Select value={templateType} onChange={setTemplateType}>
                  {templateParams.map(item => (
                    <Select.Option key={item.type}>{item.title}</Select.Option>
                  ))}
                </Select>
                <Button icon="download" onClick={downloadTemplate}>
                  {lang('下载模板')}
                </Button>
              </>
            ) : templateParams ? (
              <Button icon="download" onClick={downloadTemplate}>
                {templateParams.title}
              </Button>
            ) : null}
          </div>
          <div className="right">{props.extraContent}</div>
        </div>
        <div className="content">
          <Upload.Dragger
            accept={props.accepts.join(',')}
            beforeUpload={handleBeforeImport}
            customRequest={handleImport}
            multiple={false}
            showUploadList={false}
            ref={ref}
            {...props.draggerProps}>
            {props.draggerContent || <DefaultDraggerContent accepts={props.accepts} />}
          </Upload.Dragger>
        </div>
        <div className="footer">{importResult}</div>
      </div>
    )
  })
)

Importer.defaultProps = {
  accepts: ['.xls', '.xlsx'],
  template: {
    // 模板配置，此处也可以是一个包含{type, title, code, downloadParams}的对象数组，其中type必须且值必须唯一，可用于切换不同的模板导入类型
    title: lang('下载模板'),
    code: '',
    downloadParams: {},
  },
  templateDownloader: null, // 自定义模板下载处理函数
  templateDownloadServiceName: '', // 模板下载服务名
  templateDownloadServiceURI: '', // 模板下载服务URI
  importingText: lang('导入中'), // 导入中提示文案
  importType: importTypes.SYNC, // 默认是同步模式
  importFileFieldName: 'file', // 导入接口所需的导入文件的字段名
  importIdFieldName: 'importRecordId', // 导入成功返回的数据列的字段名
  importer: null, // 自定义导入函数
  importServiceName: '', // 自定义导入服务名
  importServiceURI: '', // 自定义导入服务URI
  importParams: {}, // 额外的导入参数
  importTimeout: 60000, // 导入操作超时毫秒
  poller: null, // 轮询函数
  pollingServiceName: '', // 轮询服务名
  pollingServiceURI: '', // 轮询服务URL
  pollingInterval: 5000, // 异步导入的状态轮询间隔毫秒
  importErrorHandler: defaultImportErrorHandler, // 导入错误处理函数
  importResponseHandler: defaultImportResponseHandler, // 导入结果处理函数
  pollingResponseHandler: defaultPollingResponseHandler, // 轮询结果处理函数
  errorFileDownloader: null, // 自定义的错误文件下载函数
  errorFileDownloadServiceName: '', // 错误文件下载服务名
  errorFileDownloadServiceURI: '', // 错误文件下载服务URI
  errorFileDownloadParams: {}, // 额外的错误文件下载参数
}

export default Importer
