// 业务类型 1：促销 2：商品 3:推广
export const businessTypeEnum = {
  activity: 1,
  product: 2,
  coupon: 3,
  couponBag: 4,
  page: 5
}

export const folderNameMap = {
  [businessTypeEnum.activity]: {
    qrUrl: '活动小程序路径',
    qrPoster: '海报',
    qrCode: '活动小程序码',
  },
  [businessTypeEnum.product]: {
    qrUrl: '批量导出小程序码路径',
    qrPoster: '批量导出海报',
    qrCode: '批量导出小程序码',
  },
}

export const getImgUrl = pathImg => {
  return `data:image/jpg;base64,${pathImg}`
}

export const getLocalImg = url => {
  return url
  // return url && url.replace(/^https?:\/\//, '//')
}

export const getPriceRange = (min, max) => {
  const text = (!min && !max)? '' : min==max? `￥${min}` : `￥${min}~￥${max}`
  return text
}



