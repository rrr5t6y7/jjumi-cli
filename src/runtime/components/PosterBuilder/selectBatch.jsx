import React from 'react'
import { Divider } from 'antd'
import { LazySelect } from 'toss.components'
import styles from './styles.scss'

export default React.memo(props => {
  const { shopTitle, shopList, __label, __value, selectedShop, onShopChange } = props

  const dataLoader = () => {
    const data = {
      list: getList(),
      hasNextPage: false
    } 
    return new Promise((resolve, reject) => {
      resolve({ data })
    })
  }

  const getList = () => {
    const newList = shopList.map(item => ({
      label: item[__label] || item[__value],
      value: item[__value] || item[__label],
    }))
    return newList || []
  }

  return (
    <div className={`${styles.storeContainer}`}>
      <div className={styles.btn}>
        <div className={styles.title}>全部{shopTitle}：</div>
        <a onClick={props.onDownloadQrUrlBatch}>下载小程序路径</a>
        <Divider type="vertical" />
        <a onClick={props.onDownloadPosterBatch}>下载海报</a>
        <Divider type="vertical" />
        <a onClick={props.onDownloadCodeBatch}>下载小程序码</a>
      </div>
      <div className={styles.search}>
        <div className={styles.title}>指定{shopTitle}：</div>
        <LazySelect 
          className="w200"
          allowClear={false} 
          value={selectedShop}
          dataLoader={dataLoader} 
          useLocalFilter 
          searchType="dropdown" 
          defaultOptions={getList()}
          onChange={onShopChange}
        />
      </div>
    </div>
  )
})