import React from 'react'
import TextEllipsis from 'toss.components/TextEllipsis'
import DownBtn from './downBtn'
import { getImgUrl, getLocalImg, getPriceRange } from './config'
import styles from './productPoster.scss'

export default React.memo(props => {
  const { 
    id='productDomtoimageId', 
    qrCode, 
    productPrimaryImage, 
    productName, 
    minSalePrice='', 
    maxSalePrice='',
    minMarketPrice='', 
    maxMarketPrice='', 
    tags,
    activityTime, 
    storeLogo, 
    storeName,
    shopName,
    description,
    isShowShopName=false,
    isShop = false, // 门店级别
    hidden=false,  
  } = props

  const codeUrl = getImgUrl(qrCode)

  const salePrice = getPriceRange(minSalePrice, maxSalePrice)
  const marketPrice = getPriceRange(minMarketPrice, maxMarketPrice)
  const isEqual = minSalePrice == maxSalePrice

  return (
    <div className={styles.domToImageProduct}>
      <div className={styles.poster}>
        <div className={styles.posterContainer}>
          <div id={id} className={styles.posterContent}>
            <div className={styles.top}>
              <img className={styles.logo} src={getLocalImg(storeLogo)} />
              <div>
                <div className={styles.logoName}>{storeName}</div>
                {isShowShopName && <div className={styles.subName}>{shopName}</div>}
              </div>
            </div>
            <div className={styles.middle}>
              <img className={styles.img} src={getLocalImg(productPrimaryImage)} />
              {isShop?
                <>
                  <div className={styles.price}>
                    ￥<span className={styles.salePrice}>{minSalePrice}</span>
                    {!isEqual? 
                    '起' : 
                      <>
                        {maxMarketPrice != minSalePrice && minMarketPrice !=0 && <span className={styles.marketPrice}>￥{minMarketPrice}{minMarketPrice != maxMarketPrice && '起'}</span>}
                      </>
                    }
                  </div>
                  {tags && tags.length>0 && 
                    <div className={styles.tagContainer}>
                      {tags.map((item, index) => (
                        <span className={styles.num} key={index}>{item}</span>
                      ))}
                    </div>
                  }
                  {activityTime && <div className={styles.time}>价格有效期：{activityTime}</div> }
                </>
                :
                <div className={styles.price}>
                  <div className={styles.salePrice}>{salePrice}</div>
                  <div className={styles.marketPrice}>{marketPrice != salePrice && marketPrice}</div>
                </div>
              }
            </div>
            <div className={styles.codeContainer}>
              <div className={styles.productNameContent}>
                {/* {discount&& <span className={styles.discount}>折扣</span>} */}
                <span className={styles.productName}>
                  <TextEllipsis lines={2}>{productName}</TextEllipsis>
                </span>
              </div>
              <div className={styles.codeContent}>
                <img className={styles.code} src={codeUrl}/>
                <div className={styles.text}>长按识别查看</div>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.des}>
          <img src={require('./assets/icon_line.svg')} />
          <div className={styles.text}>{description}</div>
        </div>
      </div>
      {!hidden && <DownBtn {...props} id={id} qrCode={codeUrl} className={styles.down} />}
    </div>
  )
})