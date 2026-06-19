// src/utils/sound.js

class SoundManager {
  constructor() {
    this.enabled = true
    this.sounds = {
      trade: null,
      purchase: null,
      signal: null,
      win: null,
      loss: null,
      click: null
    }
    this.loadSounds()
  }

  loadSounds() {
    // In production, these would be actual audio files
    // For now, we'll use Web Audio API to generate simple sounds
    this.sounds = {
      trade: this.createTradeSound(),
      purchase: this.createPurchaseSound(),
      signal: this.createSignalSound(),
      win: this.createWinSound(),
      loss: this.createLossSound(),
      click: this.createClickSound()
    }
  }

  createTradeSound() {
    return () => {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
        const oscillator = audioCtx.createOscillator()
        const gainNode = audioCtx.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioCtx.destination)
        
        oscillator.frequency.value = 440
        oscillator.type = 'sine'
        
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3)
        
        oscillator.start(audioCtx.currentTime)
        oscillator.stop(audioCtx.currentTime + 0.3)
      } catch (e) {
        // Silent fail if audio not supported
      }
    }
  }

  createPurchaseSound() {
    return () => {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
        const oscillator = audioCtx.createOscillator()
        const gainNode = audioCtx.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioCtx.destination)
        
        oscillator.frequency.value = 660
        oscillator.type = 'sine'
        
        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2)
        
        oscillator.start(audioCtx.currentTime)
        oscillator.stop(audioCtx.currentTime + 0.2)
      } catch (e) {
        // Silent fail
      }
    }
  }

  createSignalSound() {
    return () => {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
        const oscillator = audioCtx.createOscillator()
        const gainNode = audioCtx.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioCtx.destination)
        
        oscillator.frequency.value = 880
        oscillator.type = 'sine'
        
        gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1)
        
        oscillator.start(audioCtx.currentTime)
        oscillator.stop(audioCtx.currentTime + 0.1)
      } catch (e) {
        // Silent fail
      }
    }
  }

  createWinSound() {
    return () => {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
        const notes = [523, 659, 784]
        notes.forEach((freq, i) => {
          const oscillator = audioCtx.createOscillator()
          const gainNode = audioCtx.createGain()
          
          oscillator.connect(gainNode)
          gainNode.connect(audioCtx.destination)
          
          oscillator.frequency.value = freq
          oscillator.type = 'sine'
          
          const startTime = audioCtx.currentTime + i * 0.1
          gainNode.gain.setValueAtTime(0.15, startTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15)
          
          oscillator.start(startTime)
          oscillator.stop(startTime + 0.15)
        })
      } catch (e) {
        // Silent fail
      }
    }
  }

  createLossSound() {
    return () => {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
        const oscillator = audioCtx.createOscillator()
        const gainNode = audioCtx.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioCtx.destination)
        
        oscillator.frequency.value = 200
        oscillator.type = 'sawtooth'
        
        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4)
        
        oscillator.start(audioCtx.currentTime)
        oscillator.stop(audioCtx.currentTime + 0.4)
      } catch (e) {
        // Silent fail
      }
    }
  }

  createClickSound() {
    return () => {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
        const oscillator = audioCtx.createOscillator()
        const gainNode = audioCtx.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioCtx.destination)
        
        oscillator.frequency.value = 1200
        oscillator.type = 'sine'
        
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05)
        
        oscillator.start(audioCtx.currentTime)
        oscillator.stop(audioCtx.currentTime + 0.05)
      } catch (e) {
        // Silent fail
      }
    }
  }

  play(soundName) {
    if (!this.enabled) return
    const sound = this.sounds[soundName]
    if (sound) {
      sound()
    }
  }

  toggle() {
    this.enabled = !this.enabled
    return this.enabled
  }
}

export const soundManager = new SoundManager()
