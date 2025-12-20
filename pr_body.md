Root cause

Programmatic, animated auto-advances could trigger while the FlatList was still under native momentum/interaction (fling/drag). When audio playback is active the JS thread scheduling and timers can behave differently (playback updates and timers running), making the scheduled auto-advance occasionally fire during momentum and fight the native scroll. The result was the banner "fighting" gestures or snapping unexpectedly while playback was active.

Changes made

- src/components/BannerSlider.tsx
  - Track interaction/momentum state with an internal ref and avoid performing animated programmatic scrolls while interaction is active.
  - Retry auto-advance if an interaction is in progress instead of forcing a scroll that can fight native momentum.
  - Keep previous safety and layout fixes (measured itemWidth, memoized slides, cleared timers). These were preserved and integrated with the interaction guard.

Reproduction steps (before)

1. npm install
2. npm run start
3. On device/emulator: open app, start any song so PlaybackContext is active
4. On Home screen, interact with banner: slow drag, quick fling, or press dots.

Observed: while playback is active the banner sometimes fought gestures, slowly slid back/forward after release, or auto-advanced at the wrong times.

Reproduction steps (after)

1. Follow the same steps above.
2. While a song is playing, manually drag and fling the banner repeatedly.

Expected/Observed: manual drags follow finger smoothly, no stuck half-state after release, pagination dots update while dragging, and auto-advance happens every ~5s when idle and no longer fights native gestures.

Verification

- Type-check: npx tsc --noEmit  (ran in CI/local)  PASSED (no TypeScript errors)
- Manual verification: tested interactive drags and flings with playback active; programmatic scrolls no longer animate while a momentum/interaction is active.

Notes & next steps

- If any device-specific jank remains (particularly Android), we can further tune FlatList props (removeClippedSubviews, windowSize) or introduce a short debounce when resuming auto-advance.
- I did not add visual media to this PR; please let me know if you want before/after screen recordings and I will attach them.
