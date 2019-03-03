import './ui.style.css'
import template from './ui.template.html'

export default class UI {
  constructor() {
    
  }

  show(text, showCursor, btnConfig) {
    let body = document.body

    let dom = document.createElement('div')
    dom.innerHTML = template

    this.dom = dom.firstChild

    this.dom.querySelector('.content').innerText = text || ''


    let cursor = dom.querySelector('.cursor')
    if (showCursor) {
      cursor.style.display = 'block'
    } else {
      cursor.style.display = 'none'
    }

    let buttonsBlock = dom.querySelector('.buttons')
    if (!btnConfig) {
      buttonsBlock.style.display = 'none'
    } else {
      let ctaBtn = buttonsBlock.querySelector('.cta')
      let restartBtn = buttonsBlock.querySelector('.restart')

      if (btnConfig.restartCallback) {
        restartBtn.style.display = 'inline-block'
        restartBtn.addEventListener('click', btnConfig.restartCallback, false)
      } else { 
        restartBtn.style.display = 'none'
      }

      if (btnConfig.ctaCallback) {
        ctaBtn.addEventListener('click', btnConfig.ctaCallback, false)
      }
    }


    body.appendChild(this.dom)
    this.visible = true
  }

  hide () {
    if (this.visible) {
      this.visible = false
      this.dom.remove()
    }
  }

}