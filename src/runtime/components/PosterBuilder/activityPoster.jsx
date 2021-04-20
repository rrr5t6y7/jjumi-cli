import React from 'react'
import DownBtn from './downBtn'
import { getImgUrl, getLocalImg } from './config'
import styles from './styles.scss'

export default React.memo(props => {
  const { 
    id='activityDomtoimageId', 
    qrCode, 
    storeLogo, 
    storeName='',
    activityName='', 
    activityTime='', 
    description,
    hidden=false 
  } = props

  const codeUrl = getImgUrl(qrCode)

  return (
    <div className={styles.domToImage}>
      <div className={styles.poster}>
        <div id={id} className={styles.posterContainer}>
          <div className={styles.posterContent}>
            <div className={styles.top}>
              <img className={styles.logo} src={getLocalImg(storeLogo)} />
              <div className={styles.logoName}>{storeName}</div>
            </div>
            <div className={styles.middle}>
              <img className={styles.img} src={require('./assets/icon_activity_decoration.svg')} />
              <div>
                <div className={styles.name1}>{activityName}</div>
                <div className={styles.name2}>手慢无</div>
              </div>
            </div>
            <div className={styles.codeContainer}>
              <img className={styles.code} src={codeUrl}/>
            </div>
            <div className={styles.textContent}>
              <div className={`${styles.text} mb5`}>长按图片识别小程序码</div>
              <div className={styles.text}>活动时间：{activityTime}</div>
            </div>
          </div>
        </div>
        <div className={styles.des}>
          <img src={require('./assets/icon_line.svg')} />
          <div className={styles.text}>{description}</div>
        </div>
      </div>
      {!hidden && <DownBtn {...props} id={id} qrCode={codeUrl} />}
    </div>
  )
})