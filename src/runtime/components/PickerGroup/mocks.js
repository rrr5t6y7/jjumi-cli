import { delay } from 'toss.utils/base'
import { generateUnid } from 'toss.utils/base'
import { requestURI, registerLocalService } from 'toss.service'

const mockNames = {
  GET_PRODUCT_CATEGORY: 'mock.getProductCategory',
  GET_PRODUCTS: 'mock.getProductList',
  GET_SELECTED_PRODUCTS: 'mock.searchProduct',
  IMPORT_PRODUCT: 'mock.importProduct',
}

const productMockData = Array.from({ length: 13534 }).map((item, index) => ({
  productId: `${index + 1}`,
  productCode: `${index + 1}`,
  productName: `商品${index + 1}`,
  productImage: null,
  stock: Math.ceil(Math.random() * 10000),
  salePrice: (0.01 + Math.random() * 10000).toFixed(2),
  brandName: '未知品牌',
  statusName: '已上架',
}))

const generateCategoryData = (level = 0, parentLevelString = '') => {
  return level === 3
    ? null
    : Array.from({ length: Math.ceil(15 * Math.random()) }).map((item, index) => ({
        id: generateUnid(),
        key: generateUnid(),
        title: level ? `分类${parentLevelString}-${index + 1}` : `分类${index + 1}`,
        children: generateCategoryData(
          level + 1,
          level ? `${parentLevelString}-${index + 1}` : `${index + 1}`
        ),
      }))
}

const productCategoryMockData = generateCategoryData()

registerLocalService(mockNames.GET_PRODUCTS, async (requestParams) => {
  await delay(200 + Math.random() * 1000)

  const filteredData = productMockData.slice(
    (requestParams.pageNum - 1) * requestParams.pageSize,
    requestParams.pageNum * requestParams.pageSize
  )

  return {
    code: 200,
    data: {
      list: filteredData,
      total: productMockData.length,
      pageSize: requestParams.pageSize,
      pageNum: requestParams.pageNum,
    },
    message: 'OK',
  }
})

registerLocalService(mockNames.GET_SELECTED_PRODUCTS, async (requestParams) => {
  await delay(200 + Math.random() * 1000)

  const scopedData = requestParams.productIds
    ? productMockData.filter((item) => requestParams.productIds.includes(item.productId))
    : productMockData
  const filteredData = scopedData
    .filter((item) => {
      return Object.keys(requestParams).every((paramName) => {
        return item[paramName]?.includes(requestParams[paramName])
      })
    })
    .slice(
      (requestParams.pageNum - 1) * requestParams.pageSize,
      requestParams.pageNum * requestParams.pageSize
    )

  return {
    code: 200,
    data: {
      list: filteredData,
      total: productMockData.length,
      pageSize: requestParams.pageSize,
      pageNum: requestParams.pageNum,
    },
    message: 'OK',
  }
})

registerLocalService(mockNames.GET_PRODUCT_CATEGORY, async () => {
  await delay(200 + Math.random() * 1000)

  return {
    code: 200,
    data: productCategoryMockData,
    message: 'OK',
  }
})

registerLocalService(mockNames.IMPORT_PRODUCT, async (params) => {
  await delay(200 + Math.random() * 1000)

  return {
    code: 200,
    data: {
      id: generateUnid(),
      data: {
        sheetName: productMockData.slice(0, 15),
      },
      status: 3,
      failedCount: 1,
      successCount: 4,
      totalCount: 5,
    },
    message: 'OK',
  }
})

export default mockNames
