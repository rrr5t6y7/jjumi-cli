export const lang = (message, data) => {
  if (!data) {
    return message
  }

  return Object.keys(data).reduce((prevMessage, key) => {
    return prevMessage.replace(new RegExp(`\{${key}\}`, 'g'), data[key])
  }, message)
}

export const getBrowserLanguage = () => {
  return navigator.language
}

export default { lang, getBrowserLanguage }
