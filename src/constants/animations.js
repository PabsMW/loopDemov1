// Animation duration constants
export const SWAP_FLY_DURATION = 0.3; // seconds - duration for swap fly-fade animation
export const RING_FADE_DURATION = 0.2; // seconds - ring appear/disappear
export const OPACITY_FADE_DURATION = 0.25; // seconds - general opacity fades

// Check animation timings
export const CHECK_PROGRESS_DURATION = 2; // seconds - total ring animation
export const CHECK_SEGMENT_DURATION = CHECK_PROGRESS_DURATION / 12; // seconds - per segment (~0.167s)
export const CHECK_PIECE_TRANSITION_DELAY = 0; // seconds - extra delay before piece color changes
export const CHECK_PIECE_TRANSITION_DURATION = 0.3; // seconds - how long color fade takes

// Transition configs (objects with duration and easing)
export const COLOR_FADE = { duration: 0.5, ease: "easeInOut" }; // Background color transitions

// Spring animation configs
export const PIECE_SPRING = { stiffness: 400, damping: 25 }; // Position/scale animations
export const SIZE_SPRING = { stiffness: 500, damping: 30 }; // Width/height size changes

