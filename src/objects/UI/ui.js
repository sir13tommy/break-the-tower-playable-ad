import './ui.style.css'
import blankTemplate from './ui.template.html'
import splashTemplate from './splash.template.html'

export default class UI {
  constructor() {
    
  }

  show(text, showCursor, btnConfig, finalSplash, title) {
    let body = document.body
    let template

    if (finalSplash) {
      template = splashTemplate
    } else {
      template = blankTemplate
    }

    let dom = document.createElement('div')
    dom.innerHTML = template

    this.dom = dom.firstChild

    this.dom.querySelector('.content').innerText = text || ''
    if (finalSplash) {
      this.dom.querySelector('.title').innerText = title || ''
    }


    let cursor = dom.querySelector('.cursor')
    if (cursor) {
      if (showCursor) {
        cursor.style.display = 'block'
      } else {
        cursor.style.display = 'none'
      }
    }

    let buttonsBlock = dom.querySelector('.buttons')
    if (!btnConfig) {
      buttonsBlock.style.display = 'none'
    } else {
      let ctaBtn = buttonsBlock.querySelector('.cta')
      let restartBtn = buttonsBlock.querySelector('.restart')

      if (restartBtn) {
        if (btnConfig.restartCallback) {
          restartBtn.addEventListener('click', btnConfig.restartCallback, false)
        } else {
          restartBtn.style.display = 'none'
        }
      }

      if (btnConfig.ctaCallback) {
        ctaBtn.addEventListener('click', btnConfig.ctaCallback, false)
      } else {
        ctaBtn.style.display = 'none'
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