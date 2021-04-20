import React from 'react'
import moment from 'moment'

/**
 * 将指定秒数转换为时分秒字符传
 * @param {number} seconds 需要格式化的秒数
 * @param {string} hourText 小时描述字符
 * @param {string} minuteText 分钟描述字符
 * @param {string} secondText 秒钟描述字符
 * @returns {string} 转换结果
 */
export const formatSeconds = (seconds, hourText = '时', minuteText = '分', secondText = '秒') => {
  let minutes = 0
  let hours = 0
  let result = ''

  if (seconds > 60) {
    minutes = Math.floor(seconds / 60)
    seconds = Math.floor(seconds % 60)
    if (minutes > 60) {
      hours = Math.floor(minutes / 60)
      minutes = Math.floor(minutes % 60)
    }
  }

  if (seconds < 10 && seconds > 0) {
    result = `0${seconds}${secondText}`
  } else {
    result = `${seconds}${secondText}`
  }

  if (minutes < 10 && minutes > 0) {
    result = `0${minutes}${minuteText}${result}`
  } else {
    result = `${minutes}${minuteText}${result}`
  }

  if (hours > 0) {
    result = `${hours}${hourText}${result}`
  }

  return result
}

export const formatTimestamp = (timestamp, format = 'YYYY-MM-DD HH:mm:ss') => {
  if (typeof timestamp === 'number') {
    if (`${timestamp}`.length === 13) {
      return moment(timestamp).format(format)
    }
    if (`${timestamp}`.length === 10) {
      return moment(+`${timestamp}000`).format(format)
    }
    return `${timestamp}`
  }

  if (moment.isMoment(timestamp)) {
    return timestamp.format(format)
  }

  if (moment(timestamp).isValid()) {
    return moment(timestamp).format(format)
  }

  return ''
}

export const formatTimeRangeDisplay = ({ startTime, endTime }, singleLine = false) => {
  return startTime || endTime ? (
    <div>
      {formatTimestamp(startTime)}
      {singleLine ? (
        ' 至 '
      ) : (
        <>
          <br />至<br />
        </>
      )}
      {formatTimestamp(endTime)}
    </div>
  ) : (
    ''
  )
}

export default {
  formatTimestamp,
  formatSeconds,
  formatTimeRangeDisplay,
}
