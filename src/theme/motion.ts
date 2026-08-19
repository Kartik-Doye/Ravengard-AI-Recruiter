export const transitions = {
  smoothFade: {
    duration: 0.8,
    ease: [0.16, 1, 0.3, 1], // Custom bezier for smooth out
  },
  modalScale: {
    duration: 0.4,
    ease: [0.16, 1, 0.3, 1],
  },
  elementLift: {
    duration: 0.3,
    ease: "easeOut",
  },
  pulseSlow: {
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut",
  }
};

export const variants = {
  smoothFadeIn: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  modalScaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  }
};
