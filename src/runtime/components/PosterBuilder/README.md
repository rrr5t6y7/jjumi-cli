下载海报支持购物中心和品牌sass的商品、促销模块、商城页面

#### 参数&方法

参数 | 说明 | 类型 | 默认值
----|------|-----|------
businessType | 业务类型 1：促销 2：商品 3: 券（满减券、兑换劵） 4：券包 5:页面 | number | 1
downloadQrUrlApi | 批量下载小程序链接接口 | string | -
__label | 店铺/门店级海报时 门店/店铺list label | string | shopName
__value | 店铺/门店级海报时 门店/店铺list value| string | shopCode
title | modal title | string | -
storeLogo | 商城logo | string | 业务类型为商品和促销时必传，就是ui图最上层的logo和name,可以从store获取，因为用户登录进来就已经知道商城名称和logo
storeName | 商城名称/小程序名称 | string | -
shopTitle | 店铺还是名称 | string | -
description | 描述文字 | string | 扫描小程序码，自动进入推荐的店铺的活动专区页面
tabList |  | array | []
onCancel | 关闭弹框的函数 | function | -


 
#### 额外说明
下载优惠券海报命名：优惠券海报-券编码
下载优惠券小程序命名：优惠券小程序码-券编码 
券类推广（满减券、兑换劵）使用
```js
  <ExportCanvasPoster
    businessType={3}
    onCancel={this.togglePosterVisble}
    description="扫描小程序码，自动进入推荐的店铺的活动专区页面"
    title="优惠劵推广"
    tabList={
      [
        { 
          api: 'marketing.couponDataDetail.test',
          getPosterFileName: `优惠券海报-${selectItem.code}`, // 单个海报名称 
          getFileNameQrcode: `优惠券小程序码-${selectItem.code}`, // 单个小程序码名称
          getParam: this.getParam,
          getDataMap: this.handleData
        },
      ]
    }
  />

  getParam = () => {
    return {
      code: this.state.selectItem.code,
      status: this.state.selectItem.status
    }
  }

  handleData = data => {
    const { brandLogo, name, activityTime, couponAmount } = data
    return {
      storeLogo: brandLogo, // 券logo 展示在顶部左侧图片
      shareText // 分享文案 有就显示 默认为送你一张优惠劵 展示在顶部右侧描述
      name, // 券名称
      activityTime,
      couponAmount, // 券价值
      qrUrl, // 小程序链接
      qrCode: brandLogo // base64 前面不需要data:image/jpg;base64,
      num // 购买金额 有就显示 默认为无门槛券
    }
  }
```

#### 额外说明
下载券包海报命名：券包海报-券包编码
下载券包小程序命名：券包小程序码-券包编码
券类推广（优惠劵、劵包）使用
```js
  <ExportCanvasPoster
    businessType={4}
    onCancel={this.togglePosterVisble}
    description="扫描小程序码，自动进入推荐的店铺的活动专区页面"
    title="劵包推广"
    tabList={
      [
        { 
          api: 'marketing.couponDataDetail.test',
          getPosterFileName: `券包海报-${selectItem.code}`, // 单个海报名称 
          getFileNameQrcode: `券包小程序码-${selectItem.code}`, // 单个小程序码名称
          getParam: this.getParam,
          getDataMap: this.handleData
        },
      ]
    }
  />

  getParam = () => {
    return {
      code: this.state.selectItem.code,
      status: this.state.selectItem.status
    }
  }

  handleData = data => {
    const { brandLogo, name, activityTime } = data
    return {
      storeLogo: brandLogo, // 商城logo 
      storeName,  // 小程序名称
      name, // 券包名称
      activityTime,
      qrUrl, // 小程序链接
      qrCode: brandLogo // base64 前面不需要data:image/jpg;base64,
    }
  }
```



商品使用
```js
<ExportCanvasPoster
    businessType={2}
    onCancel={this.togglePosterVisble}
    downloadQrUrlApi="product.manage.getShoppeLink"
    shopTitle="店铺"
    description="扫描小程序码，自动进入最近定位店铺的商品详情页"
    storeLogo={storeLogo}
    storeName={storeName}
    tabList={
      [
        { 
          tabName: '商品级海报',
          api: 'product.manage.getProductQrcode',
          getPosterFileName: this.getFileName, 
          getFileNameQrcode: this.getFileName,
          getParam: this.getProductParam,
          getDataMap: this.handleData,
        },
        { 
          tabName: '店铺级海报', 
          shopList: selectItem.shoppeProductResponseList, // 店铺列表
          api: 'product.manage.getShoppeQrcode', // 单个查询店铺/批量下载小程序码是同一个接口
          getParam: this.getShoppeParam,
          getDataMap: this.handleData,
          getPosterFileName: this.getFileName, 
          getFileNameQrcode: this.getFileName,
          isShowShopName: true // 是否展示门店名称
        },
      ]
    }
  />

  getFileName = dataInfo => {
    if(dataInfo && dataInfo.shoppeName) {
      return `${dataInfo.shoppeName}-${dataInfo.productCode}`
    }
    return dataInfo.productCode
  }

  getProductParam = () => {
    return {
      productCodeList: [this.state.selectItem.productCode]
    }
  }

  getShoppeParam = shoppeCodeList => {
    return {
      productCodeList: [this.state.selectItem.productCode],
      shoppeCodeList
    }
  }

  handleData = data => {
    const { productPlayBillResponseList: list=[] } = data
    list.map(item => {
      item.shopName = item.shoppeName
      item.qrCode, // base64 前面不需要data:image/jpg;base64,
      qrUrl // 小程序链接
      productPrimaryImage, 
      productName, 
      minSalePrice='', 
      maxSalePrice='',
      minMarketPrice='', 
      maxMarketPrice='', 
      tags,   // 活动tag ['限时5折', '满100-99']
      activityTime,  // 活动时间
    })
    return list
  }
```


#### 额外说明
下载活动级海报命名：活动级海报
单个下载门店海报命名为：门店名称
批量下载海报压缩包命名为海报，里面每个图片为门店名称
批量下载小程序路径下载为表格，表格名称为 活动小程序路径，表格内门店名称、小程序路径
批量下载小程序码压缩包叫小程序码，里面图片名称是门店名称
促销（限时秒杀、限时折扣、满减满折）使用
```js
<ExportCanvasPoster
  businessType={1}
  onCancel={this.togglePosterVisible}
  downloadQrUrlApi="product.manage.getShoppeLink"
  shopTitle="店铺"
  description="扫描小程序码，自动进入推荐的店铺的活动专区页面"
  __label="shopName"
  __value="shopCode"
  storeLogo={avatar}
  storeName={nickname}
  tabList={
    [
      { 
        tabName: '活动级海报',
        activityName: '限时折扣', // 限时秒杀、限时折扣、满减满折
        api: 'marketing.discount.popularize',
        getPosterFileName: '活动级海报', 
        getFileNameQrcode: '活动级小程序码',
        getParam: this.getPosterParam,
        getDataMap: this.handleData
      },
      { 
        tabName: '店铺级海报', 
        activityName: '限时折扣', // 限时秒杀、限时折扣、满减满折
        shopList: selectItem.shops, // 店铺列表
        api: 'marketing.discount.storePopularize', // 单个查询店铺/批量下载小程序码是同一个接口
        getParam: this.getShoppeParam,
        getDataMap: this.handleShoppeData,
        getPosterFileName: this.getFileName, 
        getFileNameQrcode: this.getFileName,
        getQrcodeFolderName: `小程序码-${selectItem.code}-${moment().format('YYYY-MM-DD')}`, // 压缩包小程序名称
        getPosterFolderName: `海报-${selectItem.code}-${moment().format('YYYY-MM-DD')}` // 压缩包海报名称
      },
    ]
  }
  />
  
  getFileName = dataInfo => {
    if(dataInfo && dataInfo.shopName) {
      return `${dataInfo.shopName}`
    }
  }

  getPosterParam = () => {
    return {
      code: this.state.selectItem.code
    }
  }

  getShoppeParam = shoppeCodeList => {
    return {
      code: this.state.selectItem.code,
      shoppeCodeList
    }
  }

  handleData = data => {
    return {
      qrCode: data.appletCode, // base64 前面不需要data:image/jpg;base64,
      qrUrl: ata.appletUrl,    // 小程序链接
      activityTime:  `${data.startTime}至${data.endTime}`  // 活动时间
    }
  }

  handleShoppeData = data => {
    const { storePopularizeList: list=[], startTime, endTime } = data
    list.map(item => {
      item.qrCode = item.appletCode
      item.qrUrl = item.appletUrl
      item.activityTime = `${startTime}至${endTime}`
    })
    return list
  }
```


#### 额外说明
商城页面使用
```js
<ExportCanvasPoster
  businessType={5}
  onCancel={this.togglePosterVisible}
  downloadQrUrlApi="marketing.fullDiscount.exportApplet"
  shopTitle="店铺"
  description="扫描小程序码，自动进入推荐的店铺的活动专区页面"
  __label="shopName"
  __value="shopCode"
  tabList={[
    {
      tabName: '页面级海报',
      api: 'marketing.fullDiscount.popularize',
      getPosterFileName: `海报-${selectItem.code}-${moment().format('YYYY-MM-DD')}`, // 单个海报名称
      getFileNameQrcode: `小程序码-${selectItem.code}-${moment().format('YYYY-MM-DD')}`, // 单个小程序码名称
      getParam: this.getPosterParam,
      getDataMap: this.handleData,
    },
    {
      tabName: '门店级海报',
      shopList: selectItem.shops, // 店铺列表
      api: 'marketing.fullDiscount.storePopularize',
      getParam: this.getShoppeParam,
      getDataMap: this.handleShoppeData,
      getPosterFileName: dataInfo => `海报-${this.getFileName(dataInfo)}-${moment().format('YYYY-MM-DD')}`,
      getFileNameQrcode: dataInfo => `小程序码-${this.getFileName(dataInfo)}-${moment().format('YYYY-MM-DD')}`,
      getPosterFolderName: `海报-${selectItem.code}-${moment().format('YYYY-MM-DD')}`, // 压缩包小程序名称
      getQrcodeFolderName: `小程序码-${selectItem.code}-${moment().format('YYYY-MM-DD')}`,  // 压缩包海报名称
    },
  />
  
  getFileName = dataInfo => {
    if(dataInfo && dataInfo.name) {
      return `${dataInfo.name}`
    }
  }

  getPosterParam = () => {
    return {
      code: this.state.selectItem.code
    }
  }

  getShoppeParam = shoppeCodeList => {
    return {
      code: this.state.selectItem.code,
      shoppeCodeList
    }
  }

  handleData = data => {
    return {
      qrCode: data.appletCode, // base64 前面不需要data:image/jpg;base64,
      qrUrl: ata.appletUrl,    // 小程序链接
      name: data.name, // 页面标题
      subName: data.subName, // 页面分享描述
    }
  }

  handleShoppeData = list => {
    list.map(item => {
      item.qrCode = item.appletCode
      item.qrUrl = item.appletUrl
      item.name = item.name
      item.subName = item.subName
    })
    return list
  }
```


