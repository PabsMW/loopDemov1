// Preload and cache audio for instant playback
const audioCache = {};

export const playSound = (soundName, volume = 1.0) => {
  if (!audioCache[soundName]) {
    audioCache[soundName] = new Audio(`/sounds/${soundName}.mp3`);
  }
  // Clone for overlapping sounds
  const audio = audioCache[soundName].cloneNode();
  audio.volume = Math.max(0, Math.min(1, volume)); // Clamp between 0-1
  audio.play().catch(() => {}); // Ignore autoplay errors
};
