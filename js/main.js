'use strict'

require('babel-polyfill')

import { init as stateInit, store, draw } from './state.js'
let state = store

function readFromLocalStorage () {
  try {
    let stateData = window.localStorage.getItem('state')
    let parse = JSON.parse(stateData)
    if (typeof parse === 'object') {
      return parse
    } else {
      return false
    }
  } catch (e) {
    return false
  }
}

document.body.innerHTML = ''
let canvas = document.createElement('canvas')
document.body.appendChild(canvas)

function handleResize (evt) {
  let { innerWidth: width, innerHeight: height } = window
  canvas.width = width
  canvas.height = height
  state.dispatch({type: 'repaint'})
}
window.addEventListener('resize', handleResize)

Object.assign(canvas.style, {
  position: 'absolute',
  left: '0',
  right: '0',
  top: '0',
  bottom: '0'
})

let drawFrame = null
let context = canvas.getContext('2d')
stateInit({context})
state.subscribe(() => {
  if (drawFrame === null) {
    drawFrame = requestAnimationFrame(() => {
      drawFrame = null
      draw(context)
    })
  }
})
state.dispatch({type: 'init'})

handleResize()
