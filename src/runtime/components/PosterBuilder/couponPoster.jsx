import React from 'react'
import DownBtn from './downBtn'
import { getImgUrl, getLocalImg, businessTypeEnum } from './config'
import styles from './styles.scss'

export default React.memo(props => {
  const { 
    id='couponDomtoimageId', 
    qrCode, 
    storeLogo, 
    storeName, 
    shareText,
    name, 
    couponAmount, 
    num, 
    activityTime, 
    businessType,
    hidden=false 
  } = props

  const isCouponBag = businessTypeEnum.couponBag === businessType
  const codeUrl = getImgUrl(qrCode)

  return (
    <div className={`${styles.domToImage} ${styles.domToImageCoupon}`}>
      <div className={`${styles.poster} ${styles.posterCoupon}`}>
        <div id={id} className={styles.posterContainer}>
          <div className={styles.posterContent}>
            <div className={styles.top}>
              <img width={40} height={40} className={styles.logo} src={getLocalImg(storeLogo)} />
              {isCouponBag?
                <div className={styles.logoName}>{storeName}</div>
                :
                <div className={styles.logoName}>{shareText || '送你一张优惠劵'}</div>
              }
            </div>
            <div className={styles.middleCoupon}>
            {isCouponBag?
              <div className={styles.name}>{name}</div>
              :
              <>
                <div className={styles.discount}>{couponAmount}</div>
                <div className={styles.name}>{name}</div>
                <div className={styles.name}>{num || '无门槛券'}</div>
              </>
            }
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
        {/* <div className={styles.des}>
          <img src={require('./assets/icon_line.svg')} />
          <div className={styles.text}>{description}</div>
        </div> */}
      </div>
      {!hidden && <DownBtn {...props} id={id} qrCode={codeUrl} />}
    </div>
  )
})