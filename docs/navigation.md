# Navigation motion

`runMaterialNavigationTransition` applies Material navigation patterns to a content viewport. Choose `shared-axis-z` for a parent/detail relationship, `shared-axis-x` for ordered pages or tabs, and `fade-through` for peer destinations such as bottom navigation. Pass `direction: 'back'` to reverse shared-axis motion. X motion respects the content's computed text direction.

```tsx
void runMaterialNavigationTransition({
  target: () => contentRef.current,
  pattern: 'shared-axis-z',
  direction: 'forward',
  update: () => { flushSync(() => setPage('detail')) },
})
```

The application owns React state and router integration. For an async router, return a promise from `update` that resolves after the destination commits. `target` is called before and after the update, allowing a router to replace the content node. Keep app bars, bottom navigation, tabs, and modal dialogs outside this viewport. Modal components retain their own motion. Do not animate data refreshes, filtering, or initial loading as navigation.

Sources are Material Components for Android revision [`60ff09436d5d477a4b9d02940f31eb01e1250620`](https://github.com/material-components/material-components-android/tree/60ff09436d5d477a4b9d02940f31eb01e1250620/lib/java/com/google/android/material/transition), specifically `MaterialSharedAxis.java`, `MaterialFadeThrough.java`, `ScaleProvider.java`, `SlideDistanceProvider.java`, and `FadeThroughProvider.java`. The implementation carries over the 0.35 fade threshold, 0.8/1.1 shared-depth scales, 0.92 incoming peer scale, and 30dp slide distance mapped to CSS pixels. M3 themed duration and easing use the package's existing long1 and emphasized tokens. This is a web adaptation of Material motion, not Android's system activity or predictive-back gesture implementation.

The View Transitions API captures outgoing content without mounting a duplicate React tree. The document root temporarily uses `view-transition-name: none`, so persistent chrome remains live and its own selection/ripple animations are not replayed. Computed CSS duration tokens accept seconds or milliseconds and convert to WAAPI milliseconds. The outgoing snapshot keeps its original size and position relative to the destination snapshot group, preventing jumps or stretching when headers and page layouts differ. These geometry values are fixed before playback. WAAPI animates only transform and opacity. A new navigation cancels the old animation, and a superseded snapshot cannot apply its stale state callback. Reduced motion uses a 150ms fade without translation or scale. Browsers without View Transitions animate the incoming content. Snapshot failures still commit the application update. The returned promise reports application update errors.
