export function beep() {
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio) return;
  try {
    const audio = new Audio();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.frequency.value = 660;
    gain.gain.setValueAtTime(0.025, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.15);
    oscillator.start();
    oscillator.stop(audio.currentTime + 0.16);
    oscillator.onended = () => audio.close().catch(() => {});
  } catch {
    // Audio is optional; a browser restriction must not fail a saved operation.
  }
}
