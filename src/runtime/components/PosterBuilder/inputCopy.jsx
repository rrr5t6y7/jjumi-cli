import React from 'react'
import { message } from 'antd'
import TextEllipsis from 'toss.components/TextEllipsis'
import { copyText } from 'toss.utils/base'
import styles from './styles.scss'

export default React.memo(({ text }) => {
  const onCopy = text => {
    const isCopySuccess = copyText(text)
    if(isCopySuccess) {
      message.success('复制成功')
    }
  }

  return (
    <div className={styles.inputContainer}>
      <span className={styles.title}>小程序路径：</span>
      <div className={styles.inputContent}>
        <div className={styles.input}>
          <TextEllipsis lines={1} tooltip>{text}</TextEllipsis>
        </div>
        <a className={styles.copy} onClick={() => onCopy(text)}>复制</a>
      </div>
    </div>
  )
})