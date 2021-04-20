import { Modal } from 'antd'

export const confirm = params =>
  new Promise((resolve, reject) => {
    Modal.confirm({
      ...params,
      onOk: () => resolve(true),
      onCancel: () => reject(false),
    })
  })

export default { confirm }
