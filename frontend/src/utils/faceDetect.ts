export function detectFacePresence(video: HTMLVideoElement): boolean {
  const canvas = document.createElement('canvas')
  canvas.width = 160
  canvas.height = 120
  const ctx = canvas.getContext('2d')
  if (!ctx) return false
  ctx.drawImage(video, 0, 0, 160, 120)
  const imageData = ctx.getImageData(0, 0, 160, 120)
  const pixels = imageData.data

  let sum = 0
  for (let i = 0; i < pixels.length; i += 4) {
    sum += (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3
  }
  const avg = sum / (pixels.length / 4)

  let variance = 0
  for (let i = 0; i < pixels.length; i += 4) {
    const b = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3
    variance += (b - avg) ** 2
  }
  const stdDev = Math.sqrt(variance / (pixels.length / 4))

  const nonBlack = pixels.reduce((c, v, i) => i % 4 === 0 && v > 20 ? c + 1 : c, 0)
  const pct = nonBlack / (pixels.length / 4)

  return stdDev > 25 && pct > 0.15
}
