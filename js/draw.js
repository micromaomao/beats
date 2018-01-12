let ctx = null
let freeModeBackground = null
function init ({context}) {
  ctx = context
  handleResize()
}
function handleResize () {
  let {width, height} = ctx.canvas
  freeModeBackground = ctx.createLinearGradient(0, 0, 0, height)
  freeModeBackground.addColorStop(0, '#fffeb3')
  freeModeBackground.addColorStop(1, '#ffe28a')
}
let lastSize = null
function drawFreeMode ({nextFrame}) {
  let {width, height} = ctx.canvas
  if (lastSize === null || lastSize.width !== width || lastSize.height !== height) {
    handleResize()
  }
  ctx.save()
  ctx.fillStyle = freeModeBackground
  ctx.fillRect(0, 0, width, height)
  ctx.restore()
}
function updateFreeMode ({nextFrame, redraw, lastDrawState, state}) {
  return redraw()
}

export { drawFreeMode, updateFreeMode, init }
