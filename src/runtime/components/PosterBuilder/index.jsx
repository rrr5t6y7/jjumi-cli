import React, { Component} from 'react'
import { Modal, Spin, Tabs, message } from 'antd'
import JSZip from 'jszip'
import domtoimage from 'dom-to-image'
import moment from 'moment'
import { downloadBlob } from 'toss.utils/request'
import { createRequest } from 'toss.service'
import { TableEmptyText } from 'toss.components'
import ActivityPoster from './activityPoster'
import CouponPoster from './couponPoster'
import ProductPoster from './productPoster'
import PagePoster from './pagePoster'
import InputCopy from './inputCopy'
import SelectBatch from './selectBatch'
import { businessTypeEnum, folderNameMap } from './config'
import styles from './styles.scss'

const key1 = '0'
const key2 = '1'
const imgType = '.png'

class PosterBuilder extends Component {
  constructor(props) {
    super(props)
    this.state = {
      loading: false,
      tabValue: key1,
      selectedShop: [],
      posterList: [], // 批量海报
      dataInfo0: null,
      dataInfo1: null
    }
  }

  componentDidMount() {
   this.getQrcodeInfo()
  }

  getQrcodeInfo = (isForce=false) => {
    const { tabValue } = this.state
    if(this.getInfo(tabValue) && !isForce) return;

    this.setState({ loading: true })
    this.getData().then(data => {
      const dataInfo = Object.prototype.toString.call(data) === '[object Array]' && data.length>0? data[0] : data
      this.setState({ [`dataInfo${tabValue}`] : dataInfo })
    }).finally(() => {
      this.setState({ loading: false })
    })
  }

  getData = (isBatch=false) => {
    const { api, getDataMap } = this.getCurrentProps()
    return createRequest(api, this.getRequestParams(isBatch)).then(res => {
      const { code, data } = res
      if(code === 200) {
        const mapData = getDataMap(data)
        return isBatch? mapData.filter(item => this.isHasPermissiom(item)) : mapData
      }
    })
  }

  getRequestParams = (isBatch=false) => {
    const { __value } = this.props
    const { selectedShop } = this.state
    const { getParam, shopList } = this.getCurrentProps()
    const list = isBatch ? shopList.map(item => item[__value]) : [selectedShop]
    return getParam(list)
  }

  onChangeTab = e => {
    this.setState({ tabValue: e }, () => {
      const { selectedShop } = this.state
      const { tabList, __value } = this.props
      const { shopList } = tabList[+e]
      if(shopList && shopList.length>0 && (!selectedShop || Array.isArray(selectedShop) && selectedShop.length===0)) {
        this.onShopChange(shopList[0][__value])
      }
    })
  }

  onShopChange = val => {
    this.setState({ selectedShop: val }, () => {
      this.getQrcodeInfo(true)
    })
  }

  getInfo = index => {
    const key = `dataInfo${index}`
    return this.state[key]
  }

  getCurrentProps = () => {
    return this.props.tabList[+this.state.tabValue] || {}
  }

  getFileName = (item, isQrcode=false) => {
    const { tabValue } = this.state
    const { getPosterFileName, getFileNameQrcode } = this.getCurrentProps()
    let dataInfo = item || this.getInfo(tabValue) || {}
    let name = isQrcode? 
    (Object.prototype.toString.call(getFileNameQrcode) === '[object Function]'? getFileNameQrcode(dataInfo) : getFileNameQrcode) 
    : (Object.prototype.toString.call(getPosterFileName) === '[object Function]'? getPosterFileName(dataInfo) : getPosterFileName) 
    return `${name}${imgType}`
  }

  base64ToBlob(dataurl) {
    const arr = dataurl.split(',')
    const mime = arr[0].match(/:(.*?);/)[1]
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    return new Blob([u8arr], { type: mime })
  }

  // 单个下载小程序码
  onDownloadQrcode = url => {
    const name = this.getFileName(null, true)
    downloadBlob(this.base64ToBlob(url), name)
  }

  // 单个下载海报
  onDownloadPoster = id => {
    if(this.isIe()) return
    const node = document.getElementById(id)
    const name = this.getFileName()
    domtoimage.toBlob(node, { cacheBust: true }).then(function (blob) {
      downloadBlob(blob, name)
    }).catch(function (error) {
      console.error(error)
    })
  }

  // 批量下载小程序路径
  onDownloadQrUrlBatch = () => {
    this.setState({ loading: true })
    createRequest.download(this.props.downloadQrUrlApi, this.getRequestParams(true)).finally(() => {
      this.setState({ loading: false })
    })
  }
  
  onDownloadCodeBatch = () => {
    this.setState({ loading: true })
    this.getData(true).then((list=[]) => {
      if(list.length>0) {
        this.onDownZip(list, 'qrCode', { base64: true })
      }
    }).finally(() => {
      this.setState({ loading: false })
    })
  }

  // 批量下载海报
  onDownloadPosterBatch = () => {
    if(this.isIe()) return
    this.setState({ loading: true })
    this.getData(true).then((list=[]) => {
      if(list.length>0) {
        this.setState({
          posterList: list
        }, () => {
          let urlArr = []
          for(let i=0; i<list.length;i++) {
            const item = list[i]
            const imgName = this.getFileName(item)
            const node = document.getElementById(`domtoimageId-${i}`)
            domtoimage.toBlob(node, { cacheBust: true }).then(function (blob) {
              urlArr.push({ qrCode: blob, imgName})
            }).finally(() => {
              if(urlArr.length === list.length) {
                this.onDownZip(urlArr)
              }
            })
          }
        })
      }
    }).catch(e => {
      console.log(e)
    }).finally(() => {
      this.setState({ loading: false })
    })
  }

  onDownZip = (list, fileKey='qrPoster', options) => {
    const { businessType } = this.props
    const { getPosterFolderName, getQrcodeFolderName } = this.getCurrentProps()
    const isqrCode = fileKey === 'qrCode'
    let nameprops = !isqrCode? 
    (Object.prototype.toString.call(getPosterFolderName) === '[object Function]'? getPosterFolderName() : getPosterFolderName)
    : (Object.prototype.toString.call(getQrcodeFolderName) === '[object Function]'? getQrcodeFolderName() : getQrcodeFolderName)
    const date = moment().format('YYYY-MM-DD')
    const name = nameprops || `${(folderNameMap[businessType] || folderNameMap[businessTypeEnum.activity])[fileKey]}-${date}`
    const zip = new JSZip() //创建实例，zip是对象实例
    const file_name = `${name}.zip` // 定义zip包的名字
    let zipimg = zip.folder(name) // 定义解压后的zip的文件夹的名字
    for(let i = 0; i < list.length; i++) {
      const item = list[i]
      const imgName = item.imgName || this.getFileName(item, isqrCode)
      zipimg.file(imgName, item.qrCode, options)
    }
    //异步去打包下载canvas
    zip.generateAsync({type: 'blob'}).then(content => {
      downloadBlob(content, file_name)
    })
  }

  isIe = () => {
    if(window.navigator && window.navigator.msSaveOrOpenBlob) {
      message.warn(this.props.tip)
      return true
    }
  }

  isHasPermissiom = (item) => {
    const { shopeKey } = this.props
    return item.hasOwnProperty(shopeKey)? item[shopeKey] : true
  }

  getTypeDom = (options) => {
    const { businessType } = this.props
    const data = this.getCurrentProps()?.shopList || []
    const isShop = data.length > 0

    if(businessType === businessTypeEnum.product) {
      return (
        <ProductPoster
          isShop={isShop}
          {...this.props}
          {...options}
          onDownloadPoster={this.onDownloadPoster}
          onDownloadQrcode={this.onDownloadQrcode}
        />
      )
    }else if (businessType === businessTypeEnum.activity) {
      return (
        <ActivityPoster
          {...this.props}
          {...options}
          onDownloadPoster={this.onDownloadPoster}
          onDownloadQrcode={this.onDownloadQrcode}
        />
      )
    }else if (businessType === businessTypeEnum.page) {
      return (
        <PagePoster
          {...this.props}
          {...options}
          onDownloadPoster={this.onDownloadPoster}
          onDownloadQrcode={this.onDownloadQrcode}
        />
      )
    }else {
      return (
        <CouponPoster
          {...this.props}
          {...options}
          onDownloadPoster={this.onDownloadPoster}
          onDownloadQrcode={this.onDownloadQrcode}
        />
      )
    }
  }
  
  getErrorDom = (text='获取微信小程序路径/小程序码失败') => {
    return (
      <div className={styles.emptyContainer}>
        {!this.state.loading && <TableEmptyText text={text} />}
      </div>
    )
  }

  renderDom = (dataInfo, dom) => {
    const { shopeKey } = this.props
    const { qrCode, qrUrl } = dataInfo
    const reg = /[\/]?([\da-zA-Z]+[\/+]+)*[\da-zA-Z]+([+=]{1,2}|[\/])?/
    const isMatch = qrCode && qrUrl && reg.test(qrCode)
    if(dataInfo.hasOwnProperty(shopeKey)) {
      if(!dataInfo[shopeKey]) {
        return this.getErrorDom('权限不足')
      } else {
        return isMatch? dom : this.getErrorDom()
      }
    }else {
      return isMatch? dom : this.getErrorDom()
    }
  }

  render() {
    const { 
      onCancel,
      tabList,
      title,
    } = this.props

    const { 
      loading=false,
      selectedShop,
      tabValue,
      posterList=[]
    } = this.state

    return (
      <Modal
        title={title}
        visible={true}
        closable
        onCancel={onCancel}
        width={600}
        footer={null}
      >
      <div className={styles.exportPosterContainer}>
        <Spin spinning={loading}>
          {tabList.length>1 && 
            <Tabs value={tabValue} onChange={this.onChangeTab}>
              {tabList.map((item, index) => {
                const dataInfo = this.getInfo(index) || {}
                return (
                  <Tabs.TabPane key={String(index)} tab={item.tabName}>
                    <div>
                      {item.shopList && 
                        <SelectBatch
                          {...this.props}
                          shopList={item.shopList}
                          selectedShop={selectedShop}
                          onShopChange={this.onShopChange}
                          onDownloadQrUrlBatch={this.onDownloadQrUrlBatch}
                          onDownloadPosterBatch={this.onDownloadPosterBatch}
                          onDownloadCodeBatch={this.onDownloadCodeBatch}
                        />}
                      {this.renderDom(dataInfo, 
                        <>
                          <InputCopy text={dataInfo.qrUrl} />
                          {this.getTypeDom({ id: `poster-${index}`, ...item, ...dataInfo })}
                        </>)
                      }
                    </div>
                  </Tabs.TabPane>
                )
              })}
            </Tabs>
          }
          {tabList.length === 1 && tabList.map((item, index) => {
            const dataInfo = this.getInfo(index) || {}
            return (
              <>
                {this.renderDom(dataInfo, 
                  <>
                    <InputCopy text={dataInfo.qrUrl} />
                    {this.getTypeDom({ ...item, ...dataInfo, })}
                  </>
                )}
              </>
            )
          })}
          <div className={styles.posterScroll}>
            {posterList.length>0 && 
              posterList.map((item, index) => {
                return (
                  <div key={index}>
                    {this.getTypeDom({ ...this.getCurrentProps(), ...item, id: `domtoimageId-${index}`})}
                  </div>
                )
              })
            }
          </div>
        </Spin>
      </div>
    </Modal>
    )
  }
}

PosterBuilder.defaultProps = {
  businessType: businessTypeEnum.marketing,  // 业务类型
  __label: 'shopName', 
  __value: 'shopCode', 
  shopeKey: 'hasOwnerShoppePermission', // 判断是否有权限权限key
  title: '',
  shopTitle: '门店', // 购物中心是店铺，品牌是门店
  description: '扫描小程序码，自动进入推荐的门店的活动专区页面',
  storeLogo: '', // ui图最上层的logo 一般是商城logo
  storeName: '', // ui图最上层的logo 一般是商城名称
  downloadQrUrlApi: '', // 批量下载小程序链接接口excel
  onCancel: () => {},
  tip: '抱歉，该功能不支持当前浏览器，请使用Chrome浏览器访问' // 海报不支持ie提示tip
}

export default PosterBuilder