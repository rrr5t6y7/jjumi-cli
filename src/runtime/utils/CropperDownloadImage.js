/*
 * @Author:yao guan shou
 * @Date: 2021-04-08 17:17:04
 * @LastEditTime: 2021-04-08 19:28:26
 * @LastEditors: Please set LastEditors
 * @Description:
 *  说句：改类的功能作用是：下载图片的时候是先用Cropper截图然后截图之后转换成base64路劲再在下载，
 *       这样就可以绕过浏览器的同源策略实现没有跨域下载 
 *  使用教程
 * 1.   
 * html 结构：        <div style={{ width:'202px', height: '200px' }}>
                                <img
                                  ref={(imgEl) => {
                                    this.imgEl = imgEl
                                  }}
                                  style={{ width: '200px', height: '200px' }}
                                  src="http://dev-assets-api.tianhong.cn/assets/img/2021-04-08/fea10b999bd14019b20ac5386ddd2121.png"
                                  alt=""
                  </div>
 *  2. 先 实例化Cropper类，这CropperDownloadImage可以传递两个参数，第一个是 image的dom，react可以用ref获取
 *   第二个参数是Cropper 的 options 可以不传，
 *   有三个特殊参数
 *      options.beforeDownload    图片下载前钩子函数
        options.onSuccess         图片下载成功之后钩子函数
        options.delay             图片截图之后延迟下载时间，应为Cropper有个bug 不能截图之后马上获取base64图片地址，所以只能延迟下。
        options.onError           图片下载错误钩子函数
        this.CropperDownloadImage = new CropperDownloadImage(this.imgEl,{})
    3.  实例化之后 在 下载按钮onClick 事件调用 这样就实现下载 
    this.CropperDownloadImage.init('天虹二维码')
 * 
 * @FilePath: /tossjs/runtime/utils/CropperDownloadImage.js
 */
import 'cropperjs/dist/cropper.css'
import Cropper from 'cropperjs'
class CropperDownloadImage {
  constructor(el, options = {}) {
    const defaultCropperOptions = {
      viewMode: 1, //视图模式 0:不限制 1:将裁剪框限制为不超过画布的大小。
      dragMode: 'move', //拖动模式'crop':创建新的裁剪框;'move':移动画布;'none':不做什么
      autoCropArea: 1, //0到1之间 定义初始裁剪框大小
      rotatable: true, //是否能够旋转
      scalable: false, // 是否可以缩放图片（可以改变长宽） 默认true
      movable: false, //是否可以移动图片 默认true
      zoomable: false, //是否可以缩放图片（改变焦距） 默认true
      zoomOnTouch: false, // 是否可以通过拖拽触摸缩放图片 默认true
      zoomOnWheel: false, //是否可以通过鼠标滚轮缩放图片 默认true
      cropBoxMovable: false, //是否可以拖拽裁剪框 默认true
      cropBoxResizable: false, //是否可以改变裁剪框的尺寸 默认true
      modal: false, //是否显示图片和裁剪框之间的黑色蒙版 默认true
      guides: false, // 是否显示裁剪框的虚线 默认true
      center: false, //是否显示裁剪框中间的 ‘+’ 指示器 默认true
      highlight: false, // 是否显示裁剪框上面的白色蒙版 （很淡）默认true
      background: false, // 是否在容器内显示网格状的背景 默认true
      // wheelZoomRatio: false, 设置鼠标滚轮缩放的灵敏度 默认 0.1
    //   beforeDownload: () => {}, // 下载之前触发钩子函数
    //   onSuccess: () => {}, // 下载成功之后触发钩子函数
    }
    const { delay = 3000, beforeDownload = () => {}, onSuccess = () => {},onError=()=>{} } = options

    this.el = el
    this.beforeDownload = beforeDownload
    this.onSuccess = onSuccess
    this.onError=onError;
    this.delay = delay
    this.isDownload = false
    delete options.beforeDownload
    delete options.onSuccess
    delete options.delay
    this.options = {
      ...defaultCropperOptions,
      ...options,
    }
  }
  async init(imageName = '') {
    if (this.isDownload) {
      return false
    }

    this.isDownload = true
    //创建实例
    this.instanceCropper()
    // 获取截图base64地址
    let imgUrl = await this.screenshots()
    await this.downloadIamge(imgUrl, imageName)
    this.isDownload = false
    this.onSuccess()
  }
  // 创建截图实例
  instanceCropper() {
    this.cropper = new Cropper(this.el, this.options)
  }

  async screenshots() {
    //顺时针旋转90度
    return await new Promise((resolve, reject) => {
      // 立即触发会有bug 只能延迟下
      setTimeout(() => {
        try {
          //获取截图base64地址
          let baseImg = this.cropper
            .getCroppedCanvas({
              imageSmoothingQuality: 'high',
            })
            .toDataURL('image/jpeg')
          // enable() 解冻 裁剪框
          // disable() 冻结 裁剪框
          // destroy() 摧毁裁剪框并且移除cropper实例
          this.cropper.reset()
          this.cropper.destroy()
          resolve(baseImg)
        } catch (e) {
          console.error('下载错误', e, `尝试更options.delay改配置参数改大一点，当前值为：${this.delay}`)
          this.onError();
          this.isDownload = false
        }
      }, this.delay)
    })
  }

  // 加载图片
  async loadIamge(imgsrc) {
    //下载图片地址和图片名
    let image = new Image()
    // 解决跨域 Canvas 污染问题
    image.setAttribute('crossOrigin', 'anonymous')
    // 加载图片
    image.src = imgsrc
    return await new Promise((resolve, reject) => {
      image.onload = () => {
        let canvas = document.createElement('canvas')
        canvas.width = image.width
        canvas.height = image.height
        let context = canvas.getContext('2d')
        context.drawImage(image, 0, 0, image.width, image.height)
        let url = canvas.toDataURL('image/png') //得到图片的base64编码数据
        resolve(url)
      }
    })
  }
  // 触发下载
  triggerDownload(url, name) {
    let a = document.createElement('a') // 生成一个a元素
    let event = new MouseEvent('click') // 创建一个单击事件
    a.download = name || 'photo' // 设置图片名称
    a.href = url // 将生成的URL设置为a.href属性
    a.dispatchEvent(event) // 触发a的单击事件
  }
  // 下载图片
  async downloadIamge(imgsrc, name) {
    let url = await this.loadIamge(imgsrc)
    this.triggerDownload(url, name)
  }
}

export default CropperDownloadImage
