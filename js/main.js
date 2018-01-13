'use strict'

require('babel-polyfill')

import { init as stateInit, store, draw, onTap as stateTapHandler } from './state.js'
let state = store

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
  let localMaxScore = parseInt(localStorage.getItem('maxScore')) || 0
  localStorage.setItem('maxScore', Math.max(localMaxScore, state.getState().maxScore))
  if (drawFrame === null) {
    drawFrame = requestAnimationFrame(() => {
      drawFrame = null
      draw(context)
    })
  }
})
state.dispatch({type: 'init', maxScore: parseInt(localStorage.getItem('maxScore') || 0)})

handleResize()

document.addEventListener('mousedown', evt => {
  evt.preventDefault()
  stateTapHandler({x: evt.clientX, y: evt.clientY})
})
