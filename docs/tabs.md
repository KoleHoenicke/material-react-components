# Tabs

This independent React port follows AndroidX Material 3 at revision [`40ff481447ab78cbdc1a316bc7c8ecfca630f19e`](https://github.com/androidx/androidx/commit/40ff481447ab78cbdc1a316bc7c8ecfca630f19e). It maps dp and sp to CSS pixels and uses the package's color, typography, ripple and motion systems.

## Components

All names have matching `Material`-prefixed exports.

| Component | Native behavior |
| --- | --- |
| `PrimaryTabRow` | Equal-width tabs, content-width rounded indicator, primary content |
| `SecondaryTabRow` | Equal-width tabs, full-tab square indicator, on-surface content |
| `PrimaryScrollableTabRow` | Intrinsic-width tabs, content-width rounded indicator |
| `SecondaryScrollableTabRow` | Intrinsic-width tabs, full-tab square indicator |
| `Tab` | Text, icon, stacked icon/text, or custom `children` |
| `LeadingIconTab` | Icon before text with an 8px gap |
| `TabRow`, `ScrollableTabRow` | AndroidX legacy defaults: primary content with a full-tab indicator |
| `PrimaryTabIndicator`, `SecondaryTabIndicator` | Standalone or custom indicator content |
| `TabRowDefaults` | Default colors, dimensions and indicator components |
| `TabPanel` | Web panel semantics and controlled visibility |

```tsx
import { useState } from 'react'
import { PrimaryTabRow, Tab, TabPanel } from '@kolehoenicke/material-react-components'

export function MediaTabs() {
  const [selected, setSelected] = useState(0)
  const labels = ['Music', 'Podcasts', 'Audio books']
  return <>
    <PrimaryTabRow selectedTabIndex={selected} aria-label="Media">
      {labels.map((text, index) => <Tab
        key={text}
        id={`media-tab-${index}`}
        aria-controls={`media-panel-${index}`}
        text={text}
        selected={selected === index}
        onClick={() => setSelected(index)}
        unselectedContentColor="var(--md-sys-color-on-surface-variant)"
      />)}
    </PrimaryTabRow>
    {labels.map((text, index) => <TabPanel
      key={text}
      selected={selected === index}
      id={`media-panel-${index}`}
      aria-labelledby={`media-tab-${index}`}
    >{text}</TabPanel>)}
  </>
}
```

Use unique IDs when rendering multiple instances. Selection stays controlled, just as in Compose: the row's `selectedTabIndex` and each tab's `selected` must agree. Icons, badge content, panel data and any content-swipe or pager behavior belong to the application. Tabs themselves do not invent a page-transition animation.

## Geometry and tokens

| Property | AndroidX value |
| --- | --- |
| Container background / elevation / shape | Surface / level 0 / corner none |
| Text-only, icon-only height | `max(48px, icon height + text height + 20px)` |
| Leading-icon height | 48px |
| Stacked icon/text height | `max(72px, icon height + text height + 20px)` |
| Text padding | 16px at each logical edge |
| Icon / leading icon gap | 24px / 8px |
| Typography | TitleSmall, 14px / 20px, weight 500, tracking 0.1px |
| Last stacked text baseline above indicator | 14px for one line, 6px for multiple lines |
| Icon bottom to first stacked text baseline | 20px |
| Both indicator heights / color | 3px / primary |
| Primary indicator shape / minimum content width | 3px rounded corners / 24px |
| Primary indicator width | `max(24px, intrinsic tab width - 32px)`, clamped to fixed tab width before subtracting padding |
| Secondary indicator width / shape | Full tab width / square |
| Scrollable tab minimum width / edge padding | 90px / 52px at both logical edges |
| Divider | 1px / outline-variant |

Stacked content uses actual browser first and last baselines, including wrapped labels, instead of a guessed icon/text gap. All tabs in a row stretch to its tallest tab. Fixed widths use integer division, retaining AndroidX's small trailing remainder. The primary width calculation also preserves AndroidX's subtraction of 32px for icon-only and generic content.

There are three implementation/token discrepancies in the pinned native source. `Tab.kt` uses 72px for stacked tabs while `PrimaryNavigationTabTokens` declares 64px. `SecondaryIndicator` uses the primary 3px height and color, and each row supplies `HorizontalDivider()`, whose color is outline-variant, rather than the secondary generated surface-variant divider token. This port follows the implementation.

Compose `Tab` defaults both selected and unselected content to the row's inherited content color. It does not automatically apply the generated inactive on-surface-variant role or change the inactive label to on-surface on hover. Use `unselectedContentColor` for the inactive token, as in the example and the main gallery previews. `selectedContentColor` defaults to the inherited row color; an explicit selected color also becomes the unselected default unless an unselected color is supplied. The ripple always uses the selected color. Disabling a native tab removes interaction without introducing an opacity change. The port preserves that behavior and adds native disabled semantics.

## Configuration

Rows accept native div attributes and refs, `selectedTabIndex`, `containerColor`, `contentColor`, `edgePadding`, `minTabWidth`, `indicatorSize="content" | "tab"`, `activationMode`, `indicator` and `divider`. `TabRow` additionally accepts `variant="primary" | "secondary"` and `scrollable`. Minimum scrollable width is clamped to 48px for web touch targets.

`indicator` can be a node, `null`, or a function receiving `{ positions, selectedTabIndex, matchContentSize }`. Each position has physical `left`, `width` and `contentWidth` in CSS pixels. The wrapper already animates the selected position and width; set a custom indicator's width to `100%` to fill it. `divider={null}` suppresses the divider.

Tabs accept native button attributes and refs, `selected`, `text`, `icon`, `children`, `selectedContentColor` and `unselectedContentColor`. Supply an accessible name for icon-only tabs. Text and custom content keep the caller's casing. Selected text keeps the baseline TitleSmall role; it does not gain an unsupported bold or emphasized role.

Typed `MaterialTabStyle` and `MaterialTabRowStyle` support `--md-tab-*` and `--md-tab-row-*` overrides. Useful properties include container/stacked height, horizontal text padding, icon size, leading icon gap, selected/unselected content color, row container/content color, minimum tab width, edge padding, divider color/height and indicator color/height/shape. Application CSS can override the Material system typography tokens. Indicator components accept `width`, `height`, `color`, `shape`, native span attributes and refs.

## Motion and accessibility

Keyboard focus applies the selected-color focus state layer at the shared 0.1 opacity, entering over AndroidX's 45ms linear tween and exiting over its 15ms tween. It replaces the hover layer while keyboard focus is visible, preventing double opacity. The visible web focus outline is separate from that state layer.

Indicator position and width use an analytic DefaultSpatial spring with the active Material motion scheme. Expressive uses damping 0.8 and stiffness 380; standard uses damping 0.9 and stiffness 700. Initial placement is immediate. Retargeting preserves current indicator position and velocity. Scrollable selection centers the tab and clamps at either edge using the same spring. Pointer or wheel input cancels automatic scrolling. Color selection uses shared DefaultEffects and deselection uses FastEffects. Bounded state layers and ripples use the selected color across the whole tab. Shared timings live in `src/theme/motion.css`.

Rows expose `tablist`; buttons expose `tab` and `aria-selected`. One enabled tab joins the Tab key order. Arrow keys wrap, skip disabled items, and follow RTL; Home and End focus the first and last enabled tab. Automatic activation also invokes that tab's native click. Manual activation moves focus and waits for Enter or Space. Caller keyboard handlers can cancel the default behavior. `TabPanel` exposes `tabpanel`, hides inactive content, and preserves mounted state by default; `keepMounted={false}` removes inactive content. Focus outlines and forced-colors support are web additions.

Reduced motion snaps the indicator and scroll position and removes content color transitions. Resizing, loading fonts, dynamic content, direction changes and motion-scheme changes trigger fresh measurements. Effects clean up their observers, media listeners and animation frames.

## Source and verification scope

The references are [Tab.kt](https://github.com/androidx/androidx/blob/40ff481447ab78cbdc1a316bc7c8ecfca630f19e/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/Tab.kt), [TabRow.kt](https://github.com/androidx/androidx/blob/40ff481447ab78cbdc1a316bc7c8ecfca630f19e/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/TabRow.kt), [PrimaryNavigationTabTokens.kt](https://github.com/androidx/androidx/blob/40ff481447ab78cbdc1a316bc7c8ecfca630f19e/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/PrimaryNavigationTabTokens.kt), [SecondaryNavigationTabTokens.kt](https://github.com/androidx/androidx/blob/40ff481447ab78cbdc1a316bc7c8ecfca630f19e/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/SecondaryNavigationTabTokens.kt), and the [Material tabs guidance](https://m3.material.io/components/tabs/overview).

Source comparison and browser verification establish implementation alignment. They do not establish a 100% pixel match to a running Android device. Browser text shaping, rasterization and the existing CSS effects-curve conversion differ from Compose. The package does not bundle Android fonts. Tab panels are a web addition; pager gestures are an application concern.
