// All timing values in seconds. Transform distances are CSS pixels.
export const MOTION = {
  ease: { bg: "expo.out", text: "power3.out", main: "back.out(1.4)", props: "back.out(1.8)", ui: "power3.out", exit: "power2.in", loop: "sine.inOut" },
  entrance: { bg: .9, name: .62, nameAt: .16, nameStagger: .04, main: 1.1, mainAt: .5, props: .7, propsAt: 1.05, propStagger: .12, bandStagger: .12, uiAt: 1.64, ui: .48, uiStagger: .07, bars: .72, barsAt: 1.85, badgeAt: 2.28, badge: .32, descriptionAt: 1.96, description: .5 },
  exit: { total: .45, ui: .16, props: .22, main: .3, name: .22, bg: .4, overlap: .14, back: .3, mainAt: .05, nameAt: .08, fadeAt: .05 },
  distance: { direction: 40, name: 105, main: 86, props: 18, ui: 24, exitMain: 36, swipeMax: 24 },
  loop: { breathScale: 1, breathHalf: 2, floatHalf: 2.5, desktopY: 0, mobileY: 0, extraPhase: .33, maxMobileProps: 2 },
  reduced: { entrance: .22, exit: .14 },
  gesture: { swipe: 50, tap: 10, horizontalRatio: 1.2 },
  feedback: { duration: .28, distance: 4 },
  layout: { debounce: 200 },
  character: { drop: .58, squash: .1, rebound: .19, land: .25, settle: .18, summon: .78, summonSettle: .28, priestess: 1.3, mainAt: .42, tilt: -5, reboundY: -28 },
  detail: { reveal: .18, form: 1.05, frameAt: .85, hold: .3, anticipate: .35, rotate: 1.65, settle: .35, move: .95, copy: .5, reverse: .95, frameErase: .3, fade: .24, reduced: .2 },
  bandCount: 4,
};
