import React from 'react'
import { Divider } from 'antd'
import styles from './styles.scss'

export default React.memo(({ id, qrCode, onDownloadPoster, onDownloadQrcode, className }) => {
  return (
    <div className={`${styles.down} ${className}`}>
      <a onClick={() => onDownloadPoster(id)}>下载海报</a>
      <Divider type="vertical" />
      <a onClick={() => onDownloadQrcode(qrCode)}>下载小程序码</a>
    </div>
  )
})