let activeStream: MediaStream | null = null
let activeVideo: HTMLVideoElement | null = null
let lastError = ''

export function stopCamera() {
  if (activeStream) {
    activeStream.getTracks().forEach(t => t.stop())
    activeStream = null
  }
  if (activeVideo) {
    activeVideo.pause()
    activeVideo.srcObject = null
    activeVideo = null
  }
}

export function getCameraError() {
  return lastError
}

function setError(err: unknown) {
  const name = (err as DOMException)?.name || ''
  if (name === 'NotAllowedError') lastError = 'Camera permission denied. Please allow camera access.'
  else if (name === 'NotFoundError') lastError = 'No camera found on this device.'
  else if (name === 'NotReadableError') lastError = 'Camera is already in use. Close other apps and try again.'
  else if (name === 'OverconstrainedError') lastError = 'Camera settings not supported.'
  else if (name === 'AbortError') lastError = 'Camera start was aborted.'
  else lastError = (err as Error)?.message || 'Camera failed to start.'
}

export async function startCamera(video: HTMLVideoElement): Promise<boolean> {
  stopCamera()
  lastError = ''

  if (!video) {
    lastError = 'Video element not found.'
    return false
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    })
    activeStream = stream
    activeVideo = video
    video.srcObject = stream
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => { video.play(); resolve() }
      video.onerror = () => reject(new Error('Video element error'))
    })
    return true
  } catch (err) {
    setError(err)

    if ((err as DOMException)?.name === 'OverconstrainedError') {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        stopCamera()
        lastError = ''
        activeStream = s
        activeVideo = video
        video.srcObject = s
        await new Promise<void>((resolve, reject) => {
          video.onloadedmetadata = () => { video.play(); resolve() }
          video.onerror = () => reject(new Error('Video element error'))
        })
        return true
      } catch {}
    }

    return false
  }
}
