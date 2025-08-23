// src/composables/useSound.js
export function useSound() {
  const playBeep = () => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioCtx.createOscillator()
    const gainNode = audioCtx.createGain()

    oscillator.type = "sine"
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime) // Hz
    oscillator.connect(gainNode)
    gainNode.connect(audioCtx.destination)

    oscillator.start()
    gainNode.gain.exponentialRampToValueAtTime(
      0.0001,
      audioCtx.currentTime + 1
    )
    oscillator.stop(audioCtx.currentTime + 1)
  }

  return { playBeep }
}
