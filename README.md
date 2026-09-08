# Material React Components

An independent, open-source implementation of Material Design components for React on the web. The current release targets Material 3 Expressive.

[Open the interactive component gallery](https://kolehoenicke.github.io/material-react-components/)

The package includes reusable controls, dynamic color, typography hooks, shape tokens, state layers, and expressive motion.

> [!IMPORTANT]
> This is an independent community project. It is not affiliated with, sponsored by, or endorsed by Google. Material Design is a trademark of Google LLC.

## Status

The library is an early alpha. The API is usable, tested, and packaged, but it may change as the component set expands.

Included now:

- App bars, including small, center-aligned, medium, large, flexible, bottom, FAB, and scroll-aware variants
- Badge
- Icon buttons and controlled icon toggles, with all four color styles, five sizes, three widths, and round/square shape morphing
- Button and button group
- Card, including filled, elevated, outlined, checked, and dragged states
- Divider, including horizontal, vertical, full-width, inset, one-sided, heavy, and custom styles
- Dialogs, including alert, basic custom-content, and full-screen variants
- Checkbox, including indeterminate and error states, checkbox groups, and list items
- Chips, including assist, filter, input, suggestion, elevated, removable, and expressive-shape variants
- Floating action buttons, including every current size and color mapping, extended and collapsible variants, lowered elevation, and baseline compatibility
- FAB menus with controlled launchers, two to six actions, all three color sets, and regular, medium, and large launcher geometry
- Lists, including standard, segmented, selectable, expandable, swipe-reveal, media, dividers, counts, and trailing actions
- Loading indicator
- Menus, including baseline and expressive vertical styles, standard and vibrant colors, groups, selection, and submenus
- Quantity stepper
- Rich option list
- Ripple and state layers
- Segmented action list
- Slider, including centered ranges and stops
- Switch
- Progress indicators, including standard and Expressive linear and circular variants
- Dynamic Material color themes
- Typography with all 15 baseline and 15 Expressive emphasized roles
- Material 3 Expressive motion tokens

## Install from GitHub

Until the first npm release, install the package directly from GitHub:

```sh
npm install github:KoleHoenicke/material-react-components#v0.15.0
```

React and React DOM are peer dependencies. React 18 and 19 are supported.

## Use

```tsx
import { useState } from 'react'
import {
  AppBarIconButton,
  Button,
  Card,
  MaterialThemeProvider,
  Slider,
  Switch,
  TopAppBar,
} from '@kolehoenicke/material-react-components'
import '@kolehoenicke/material-react-components/styles.css'

export function Settings() {
  const [enabled, setEnabled] = useState(true)
  const [amount, setAmount] = useState(50)

  return (
    <MaterialThemeProvider seed={{ primary: '#6750a4' }}>
      <TopAppBar
        title="Settings"
        navigationIcon={
          <AppBarIconButton aria-label="Go back">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </AppBarIconButton>
        }
        scrollBehavior="pinned"
      />

      <Button variant="filled">Save</Button>

      <Card variant="elevated" contentPadding={16} href="/details">
        Open details
      </Card>

      <Switch
        aria-label="Enable feature"
        checked={enabled}
        onChange={(event) => setEnabled(event.currentTarget.checked)}
      />

      <Slider
        aria-label="Amount"
        min={0}
        max={100}
        value={amount}
        valueIndicator="always"
        onChange={(event) => setAmount(event.currentTarget.valueAsNumber)}
      />
    </MaterialThemeProvider>
  )
}
```

Every component is exported with a short name such as `Button` and its explicit name such as `MaterialButton`.

### Motion

The default is the Material 3 Expressive motion scheme. Set `motionScheme="standard"` on `MaterialThemeProvider` for a utilitarian motion scheme. A nested element can also set `data-motion-scheme="expressive"` or `data-motion-scheme="standard"` to change the scheme for one subtree.

```tsx
<MaterialThemeProvider
  motionScheme="standard"
  seed={{ primary: '#6750a4' }}
>
  <Settings />
</MaterialThemeProvider>
```

The package exposes all six Material motion roles through `MATERIAL_MOTION_PRESETS`, `MATERIAL_MOTION_SPRING_ATTRIBUTES_BY_SCHEME`, `getMaterialMotionPreset`, and `getMaterialSpringAttributes`. Spatial roles animate position, size, rotation, and shape. Effects roles animate color and opacity. Use fast for small components, default for partial-screen motion, and slow for full-screen motion.

The spring attributes match the current AndroidX Material 3 v0.14 generated tokens. Expressive spatial springs are `0.6 / 800` for fast, `0.8 / 380` for default, and `0.8 / 200` for slow, written as damping ratio and stiffness. Standard spatial springs are `0.9 / 1400`, `0.9 / 700`, and `0.9 / 300`. Both schemes use critically damped effects springs with stiffness values of `3800`, `1600`, and `800`.

CSS components use Material's official web curve conversions for those springs. Native spring engines should use the exported damping and stiffness values directly. The older easing and duration tokens remain available only for transition patterns and component algorithms that still require them. `prefers-reduced-motion: reduce` shortens spatial motion to 1ms and effects motion to 50ms, including components inside a theme provider.

Sources: [Material motion physics system](https://m3.material.io/styles/motion/overview/how-it-works), [web conversion specs](https://m3.material.io/styles/motion/overview/specs), and [AndroidX `MotionScheme`](https://android.googlesource.com/platform/frameworks/support/+/refs/heads/androidx-main/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/MotionScheme.kt).

### Dialogs

`AlertDialog` ports the current AndroidX Material 3 dialog slots and adapts the platform behavior to the native web `<dialog>` top layer. It supports an optional icon, headline, supporting text, custom scrollable content, optional divider, confirm and dismiss buttons, centered or start-aligned layouts, and complete custom actions. The container is 280px to 560px wide, uses the 28px extra-large shape, `surfaceContainerHigh`, level-3 elevation, and a 32% scrim. Fine-pointer devices automatically use AndroidX's compact 20px padding and 20px/26px headline treatment. Touch layouts retain the 24px padding and `headlineSmall` metrics.

```tsx
import { AlertDialog, Button } from '@kolehoenicke/material-react-components'

export function DeleteDialog({ open, setOpen }: {
  open: boolean
  setOpen: (open: boolean) => void
}) {
  return (
    <AlertDialog
      open={open}
      onDismissRequest={() => setOpen(false)}
      title="Delete file?"
      supportingText="This file will be moved to the trash."
      dismissButton={
        <Button variant="text" onClick={() => setOpen(false)}>Cancel</Button>
      }
      confirmButton={
        <Button variant="text" onClick={() => setOpen(false)}>Delete</Button>
      }
    />
  )
}
```

The dialog keeps confirm last visually in a horizontal action row, then places confirm before dismiss when the actions wrap vertically, matching AndroidX. `closeOnEscape` and `closeOnBackdropClick` control platform dismissal requests. The component traps focus through the native modal, restores focus when it closes, prevents scroll chaining inside long content, and keeps the surface mounted for the 400ms enter and 150ms exit motion. Reduced-motion and forced-color modes have dedicated treatments.

`BasicAlertDialog` provides the same controlled modal behavior, width constraints, focus handling, and dismissal policy around arbitrary content. The caller owns the inner surface and semantics. `FullScreenDialog` implements Material's second dialog variant with a 64px safe-area-aware header, required close affordance, headline, optional trailing action and divider, and independently scrolling body content.

Every component-level value can be overridden through `MaterialDialogStyle`, including container width, height, padding, shape, elevation, colors, icon size, action spacing, focus color, and scrim color or opacity.

Sources: [Material 3 dialogs](https://m3.material.io/components/dialogs/overview), [AndroidX `AlertDialog`](https://android.googlesource.com/platform/frameworks/support/+/refs/heads/androidx-main/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/AlertDialog.kt), [AndroidX dialog tokens](https://android.googlesource.com/platform/frameworks/support/+/refs/heads/androidx-main/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/DialogTokens.kt), and [Material Components for Android dialogs](https://github.com/material-components/material-components-android/blob/master/docs/components/Dialog.md).

### Icon buttons

`IconButton` and `IconToggleButton` port the current AndroidX icon-button family. Use `variant="standard"`, `"filled"`, `"tonal"`, or `"outlined"`; five sizes from `"extra-small"` to `"extra-large"`; `width="narrow"`, `"uniform"`, or `"wide"`; and `shape="round"` or `"square"`. Small controls retain a 48px minimum target. Press and selection morph the container using AndroidX's non-bouncing shape motion.

```tsx
<IconToggleButton
  aria-label="Favorite"
  variant="tonal"
  checked={favorite}
  onCheckedChange={setFavorite}
  selectedIcon={<FilledStarIcon />}
>
  <OutlinedStarIcon />
</IconToggleButton>
```

Supply application icons and an accessible label. `title` defaults to `aria-label` for a native hover tooltip. Android-style exports include `FilledIconButton`, `FilledTonalIconButton`, `OutlinedIconButton`, and their `IconToggleButton` counterparts. `colors`, `shapes`, `animated`, `colorMode`, and typed CSS tokens provide explicit overrides. `AppBarIconButton` uses the same implementation with inherited content color.

See the [complete API, token tables, pinned Android sources, and platform adaptations](docs/icon-buttons.md). Use this family for icon buttons; the older `Button iconOnly` prop remains a regular-button configuration.

### Floating action buttons

`FloatingActionButton` follows the current AndroidX Material 3 implementation. The default is the 56px regular FAB with a 24px icon, 16px corners, primary-container colors, level-3 elevation, and a level-4 hover elevation. Medium and large FABs use 80px and 96px containers. The 40px small FAB remains available for baseline compatibility and keeps a 48px interaction target.

```tsx
import {
  ExtendedFloatingActionButton,
  FloatingActionButton,
  LargeFloatingActionButton,
} from '@kolehoenicke/material-react-components'

export function CreateActions({ expanded }: { expanded: boolean }) {
  return (
    <>
      <FloatingActionButton aria-label="Create note" color="primary-container">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </FloatingActionButton>

      <ExtendedFloatingActionButton
        expanded={expanded}
        icon={<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>}
        label="Create note"
      />

      <LargeFloatingActionButton aria-label="Create note" color="tertiary">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </LargeFloatingActionButton>
    </>
  )
}
```

The current color mappings are `primary-container`, `secondary-container`, `tertiary-container`, `primary`, `secondary`, and `tertiary`. The baseline `surface` mapping also remains available. Set `elevation="lowered"` for AndroidX's lower-emphasis elevation or `elevation="none"` when another container owns the shadow.

`ExtendedFloatingActionButton` defaults to the current Expressive small extended FAB. It supports icon-and-label and label-only content. With an icon, `expanded={false}` animates to the matching square FAB while the label stays available to assistive technology. The named exports cover `SmallExtendedFloatingActionButton`, `MediumExtendedFloatingActionButton`, `LargeExtendedFloatingActionButton`, and the deprecated `BaselineExtendedFloatingActionButton`.

Set `visible={false}` to apply the Android show/hide scale and opacity treatment while removing the button from the keyboard and accessibility order. `visibilityAlignment` controls the transform origin. Every color, dimension, shape, elevation, state layer, focus indicator, typography value, expansion gap, and visibility scale is typed on `MaterialFabStyle` through `--md-fab-*` properties.

### FAB menu

`FloatingActionButtonMenu` ports the current AndroidX FAB menu layout and adapts its semantics to the web menu pattern. It accepts two to six `FloatingActionButtonMenuItem` children. The controlled launcher can start at 56px, 80px, or 96px, then animates to the shared 56px circular close button while preserving the original footprint. Items reveal from the launcher outward and collapse in reverse.

```tsx
import { useState } from 'react'
import {
  FloatingActionButtonMenu,
  FloatingActionButtonMenuItem,
} from '@kolehoenicke/material-react-components'

const AddIcon = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
const CloseIcon = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>

export function CreateMenu() {
  const [expanded, setExpanded] = useState(false)

  return (
    <FloatingActionButtonMenu
      closeIcon={<CloseIcon />}
      color="primary"
      expanded={expanded}
      icon={<AddIcon />}
      menuLabel="Create actions"
      onExpandedChange={setExpanded}
      size="medium"
      toggleLabel="Toggle create actions"
    >
      <FloatingActionButtonMenuItem icon={<AddIcon />}>New note</FloatingActionButtonMenuItem>
      <FloatingActionButtonMenuItem icon={<AddIcon />}>New list</FloatingActionButtonMenuItem>
    </FloatingActionButtonMenu>
  )
}
```

The `primary`, `secondary`, and `tertiary` color sets pair a solid close button with container-colored menu items. The menu uses 56px pill items, 24px icons, title-medium labels, 24px side padding, an 8px icon-label gap, and 4px between items. `alignment` supports logical start, center, and end placement, including RTL. Long menus scroll behind the unobstructed close button.

The launcher keeps focus when it opens. Tab moves from the close button to the top item, arrow keys move through the visible actions, Escape closes the menu, and collapsed items are inert and removed from the accessibility tree. Outside pointer interactions and item selection close the menu by default. `closeOnOutsideClick` and `closeOnItemClick` can disable those behaviors. Use `ToggleFloatingActionButton` separately when you need the controlled launcher without the menu layout. All component tokens are typed through `MaterialFabMenuStyle` and `MaterialToggleFabStyle`.

### Menus

`Menu` is the web counterpart to AndroidX `DropdownMenu` and `DropdownMenuPopup`. The default `expressive` variant implements the newer vertical menu. Set `variant="baseline"` for the original M3 menu. Standard menus use surface colors; vibrant menus use the tertiary palette and should be reserved for higher-emphasis choices.

```tsx
import { useState } from 'react'
import {
  Button,
  CheckableDropdownMenuItem,
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  MenuDivider,
  MenuSubmenu,
  SelectableDropdownMenuItem,
} from '@kolehoenicke/material-react-components'

const CheckIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24">
    <path d="m5 12 4 4L19 6" />
  </svg>
)

export function ViewMenu() {
  const [open, setOpen] = useState(false)
  const [grid, setGrid] = useState(true)
  const [sort, setSort] = useState('date')

  return (
    <DropdownMenu
      anchor={<Button variant="tonal">View options</Button>}
      ariaLabel="View options"
      color="standard"
      onOpenChange={setOpen}
      open={open}
    >
      <DropdownMenuGroup label="Layout">
        <CheckableDropdownMenuItem
          checked={grid}
          onCheckedChange={setGrid}
          selectedLeadingIcon={<CheckIcon />}
          supportingText="Show files in a grid"
        >
          Grid view
        </CheckableDropdownMenuItem>
      </DropdownMenuGroup>

      <DropdownMenuGroup label="Sort">
        <SelectableDropdownMenuItem
          onClick={() => setSort('date')}
          selected={sort === 'date'}
          selectedLeadingIcon={<CheckIcon />}
        >
          Date created
        </SelectableDropdownMenuItem>
        <MenuDivider />
        <MenuSubmenu itemChildren="More options" submenuLabel="More options">
          <DropdownMenuItem>Rename</DropdownMenuItem>
          <DropdownMenuItem>Move to trash</DropdownMenuItem>
        </MenuSubmenu>
      </DropdownMenuGroup>
    </DropdownMenu>
  )
}
```

The baseline surface is 112px to 280px wide with 4px corners, 8px vertical padding, level-2 elevation, 48px rows, 12px content padding, and 24px icons. Expressive menus use 16px group corners, 2px group gaps and vertical padding, 4px unselected item corners, 12px selected corners, 20px icons, and the current AndroidX standard or vibrant selection colors. Fine-pointer layouts use AndroidX's 44px item height, 12px element spacing, 16px leading padding, 10px trailing padding, and 24px trailing icon slot. Touch layouts retain a 48px target. `density` also exposes the web levels from `0` through `-3`.

The popup uses a fixed top-layer-style portal, copies Material theme variables from its anchor, and repositions on resize or scroll. It tries the requested logical placement, flips above or to the opposite side when space runs out, and clamps to AndroidX's 8px horizontal and 48px vertical window margins. Use `anchorRef` for an externally owned trigger, `anchorPoint` for context menus, and `placement="start" | "end"` for cascading menus. `offset` follows text direction.

Opening places focus on the first item. Arrow keys wrap, Home and End jump to the menu edges, letters use typeahead, and Escape closes the current menu. Logical left and right arrows open or close submenus. Disabled items remain focusable but cannot run an action, matching the current Material accessibility guidance. Checkable items stay open for multi-selection; selectable and action items close the complete menu tree by default. All decorative item icons are hidden from assistive technology. Forced colors, RTL, reduced motion, links, custom slots, persistent overflow scrollbars, focus restoration, and opt-out dismissal policies are included.

`MaterialMenuStyle` types every component token used by the surface, groups, items, selection, typography, elevation, spacing, focus ring, scrollbar, and viewport margins. `MaterialMenuItem` accepts leading and selected-leading icons, supporting text, trailing icons, badges, keyboard labels, links, and per-item color, shape, or variant overrides. For a typical web menu, use dividers between sections. Use grouped surfaces when the product is intentionally matching Android's expressive treatment.

Sources: [Material 3 menus](https://m3.material.io/components/menus/overview), [menu specs](https://m3.material.io/components/menus/specs), [menu accessibility](https://m3.material.io/components/menus/accessibility), [AndroidX `Menu`](https://android.googlesource.com/platform/frameworks/support/+/refs/heads/androidx-main/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/Menu.kt), [AndroidX menu defaults](https://android.googlesource.com/platform/frameworks/support/+/refs/heads/androidx-main/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/MenuDefaults.kt), and [Material Web menus](https://github.com/material-components/material-web/blob/main/docs/components/menu.md).

### Checkboxes

`Checkbox` follows the current Material 3 measurements and AndroidX behavior. It renders a native checkbox input, so names, values, required validation, form submission, keyboard activation, labels, and refs work like ordinary web controls. `indeterminate` sets the native mixed state. `error` applies the Material error treatment and `aria-invalid` semantics.

```tsx
import { useState } from 'react'
import {
  CheckboxList,
  CheckboxListItem,
} from '@kolehoenicke/material-react-components'

const formats = ['Photos', 'Videos'] as const

export function ExportFormats() {
  const [selected, setSelected] = useState(() => new Set(['Photos']))
  const allSelected = selected.size === formats.length
  const someSelected = selected.size > 0 && !allSelected

  return (
    <CheckboxList ariaLabel="Export formats">
      <CheckboxListItem
        label="Select all formats"
        checkboxProps={{
          checked: allSelected,
          indeterminate: someSelected,
          onChange: (event) => {
            setSelected(event.currentTarget.checked ? new Set(formats) : new Set())
          },
        }}
      />
      {formats.map((format) => (
        <CheckboxListItem
          key={format}
          label={format}
          checkboxProps={{
            checked: selected.has(format),
            name: 'format',
            value: format,
            onChange: (event) => {
              const checked = event.currentTarget.checked
              setSelected((current) => {
                const next = new Set(current)
                if (checked) next.add(format)
                else next.delete(format)
                return next
              })
            },
          }}
        />
      ))}
    </CheckboxList>
  )
}
```

The default visual container is 18px with a 2px corner and stroke. The state layer is 40px and the interaction target is 48px. `MaterialCheckboxStyle` types every `--md-checkbox-*` property, including separate checkmark, box, outline, interaction, disabled, indeterminate, error, and focus-indicator values. `CheckboxListItem` can place the control at the leading or trailing edge and keeps adjacent text on the `on-surface` role in every selection state.

### Dividers

`Divider` combines the current AndroidX horizontal and vertical API with Material Web's logical inset variants and MDC-Android's heavy divider. The regular line is 1px, the heavy line is 8px, and both use `outline-variant`. A boolean inset uses the 16px Material measurement. Numeric `thickness`, `inset`, `insetStart`, and `insetEnd` values are interpreted as CSS pixels; CSS lengths work directly.

```tsx
import {
  Divider,
  HorizontalDivider,
  VerticalDivider,
} from '@kolehoenicke/material-react-components'

export function ArticleLayout() {
  return (
    <>
      <HorizontalDivider />
      <Divider inset />
      <Divider insetStart={24} insetEnd={0} />
      <Divider variant="heavy" />

      <div style={{ display: 'flex', height: 240 }}>
        <article>Copy</article>
        <VerticalDivider inset role="separator" aria-label="Related media" />
        <aside>Media</aside>
      </div>
    </>
  )
}
```

Dividers are decorative by default, matching Material's accessibility guidance. Add `role="separator"` only when the line communicates a meaningful boundary; the component then supplies the correct horizontal or vertical `aria-orientation`. `ListDivider` composes this same primitive, uses separator semantics, and maps its `content` and `full` inset options onto the shared logical inset tokens. `MaterialDividerStyle` types the color, regular and heavy thickness, and inset CSS properties. Dividers have no typography, state, or motion tokens.

### Lists

`List` and `ListItem` port the current AndroidX Material 3 list model to accessible web controls. Standard, segmented, and legacy baseline containers are available. Items support one-, two-, and three-line layouts; overline, leading, and trailing slots; icons, avatars, controls, images, and both Material video sizes; links; disabled, selected, dragged, and long-press states; custom padding, shape, color, elevation, and state tokens; and automatic top alignment for three-line content.

```tsx
import { useState } from 'react'
import {
  ExpandableList,
  List,
  ListAvatar,
  ListItem,
  ListSwipeActions,
} from '@kolehoenicke/material-react-components'

export function FileLists() {
  const [selected, setSelected] = useState('documents')
  const [expanded, setExpanded] = useState(false)
  const [revealed, setRevealed] = useState(false)

  return (
    <>
      <List ariaLabel="Choose a folder" selectionMode="single" variant="segmented">
        {['documents', 'photos'].map((folder) => (
          <ListItem
            key={folder}
            headline={folder[0].toUpperCase() + folder.slice(1)}
            leading={<ListAvatar>{folder[0].toUpperCase()}</ListAvatar>}
            leadingType="avatar"
            selected={selected === folder}
            supportingText="Available offline"
            onSelectedChange={() => setSelected(folder)}
          />
        ))}
      </List>

      <ExpandableList
        ariaLabel="Project folders"
        expanded={expanded}
        onExpandedChange={setExpanded}
        summary={{ headline: 'Design files', supportingText: '3 folders' }}
      >
        <ListItem headline="Components" onClick={() => {}} />
        <ListItem headline="Motion studies" onClick={() => {}} />
      </ExpandableList>

      <List ariaLabel="Messages">
        <ListSwipeActions
          actions={<button type="button">Archive</button>}
          actionsLabel="Message actions"
          revealed={revealed}
          onRevealedChange={setRevealed}
        >
          <ListItem headline="Avery Chen" supportingText="Updated just now" />
        </ListSwipeActions>
      </List>
    </>
  )
}
```

Selectable lists render `listbox` and `option` semantics, expose single- or multi-selection state, and use a roving tab stop with wrapping arrow-key, Home, and End navigation. Independent controls in either slot join the same keyboard order without creating invalid nested buttons. `ExpandableList` is controlled and removes collapsed content from the focus order. `ListSwipeActions` supports start or end reveal, RTL, pointer snap and overshoot, and a visible button alternative for keyboard and screen-reader users. Set `keyboardNavigation={false}` only when a surrounding composite owns focus.

Every dimension and color is configurable through typed `--md-list-*` properties on `MaterialListStyle`. Short names such as `List`, `ListItem`, `ListDivider`, `ListAvatar`, `ListMedia`, `ExpandableList`, and `ListSwipeActions` have matching explicit `Material*` exports.

### Chips

The chip family follows current AndroidX dimensions, color roles, elevation, icon animation, and optional expressive shape morphing. `ChipSet` adds the toolbar semantics and wrapping arrow-key focus behavior used by Material Web.

```tsx
import { useState } from 'react'
import {
  AssistChip,
  ChipSet,
  FilterChip,
  InputChip,
} from '@kolehoenicke/material-react-components'

export function SearchFilters() {
  const [recent, setRecent] = useState(true)
  const [people, setPeople] = useState(['Avery'])

  return (
    <>
      <ChipSet aria-label="Search filters">
        <FilterChip
          selected={recent}
          onSelectedChange={setRecent}
          shapeMode="expressive"
        >
          Recent
        </FilterChip>
        {people.map((person) => (
          <InputChip
            key={person}
            onRemove={() => setPeople((items) => items.filter((item) => item !== person))}
          >
            {person}
          </InputChip>
        ))}
      </ChipSet>
      <AssistChip elevated>Add to calendar</AssistChip>
    </>
  )
}
```

All chips keep a 32px visual container and a 48px interaction target by default. Use `touchTarget="none"` only when a parent supplies the accessible target. Flat and elevated surfaces, controlled `selected` state, `selectedIcon`, `leadingIcon`, `trailingIcon`, input avatars, removable actions, links, drag state, disabled state, and focusable `softDisabled` state are configurable. Every visual token is available through `--md-chip-*` custom properties.

### App bars

The app-bar family follows the current AndroidX Material 3 API and tokens. It includes `TopAppBar`, `CenterAlignedTopAppBar`, `MediumTopAppBar`, `LargeTopAppBar`, `MediumFlexibleTopAppBar`, `LargeFlexibleTopAppBar`, and `BottomAppBar`. Pass `collapseProgress` for controlled rendering, or connect `scrollTarget` with `pinned`, `enter-always`, `exit-until-collapsed`, or `exit-always` behavior.

```tsx
import { useRef, type ReactNode } from 'react'
import {
  AppBarIconButton,
  LargeFlexibleTopAppBar,
} from '@kolehoenicke/material-react-components'

export function Feed({ content }: { content: ReactNode }) {
  const scrollContainer = useRef<HTMLDivElement>(null)

  return (
    <>
      <LargeFlexibleTopAppBar
        title="Weekend in Kyoto"
        subtitle="April 18–21"
        navigationIcon={<AppBarIconButton aria-label="Back">←</AppBarIconButton>}
        actions={<AppBarIconButton aria-label="Search">⌕</AppBarIconButton>}
        scrollBehavior="exit-until-collapsed"
        scrollTarget={scrollContainer}
      />
      <div ref={scrollContainer}>{content}</div>
    </>
  )
}
```

All app-bar colors, dimensions, safe-area insets, and slot colors have public `--md-top-app-bar-*` and `--md-bottom-app-bar-*` CSS properties. Pass `safeAreaInsets={false}` when the surrounding layout already handles browser safe areas.

### Progress indicators

The progress family ports the current AndroidX Material 3 standard and Expressive APIs. Each shape supports determinate and indeterminate operation. Omit `value` for indeterminate progress.

```tsx
import {
  CircularProgressIndicator,
  CircularWavyProgressIndicator,
  LinearProgressIndicator,
  LinearWavyProgressIndicator,
} from '@kolehoenicke/material-react-components'

export function SyncProgress({ value }: { value: number }) {
  return (
    <>
      <LinearProgressIndicator label="Uploading files" value={value} />
      <LinearProgressIndicator label="Preparing upload" />
      <CircularWavyProgressIndicator label="Indexing files" value={value} />
      <LinearWavyProgressIndicator
        amplitude={0.7}
        label="Processing images"
        strokeWidth={8}
        trackStrokeWidth={8}
        value={value}
        wavelength={56}
      />
    </>
  )
}
```

The Android defaults are 240 by 4 pixels for standard linear, 240 by 10 pixels for linear wavy, 40 pixels for standard circular, and 48 pixels for circular wavy. Active and track strokes default to 4 pixels. Both linear forms include the 4 pixel stop marker used by current Material 3. For Android's thick Expressive examples, use a 14 pixel linear height with 8 pixel strokes or a 52 pixel circular size with 8 pixel strokes.

Use `max` for a range other than 0 to 1. Set `animateProgress` when the component should apply the AndroidX recommended transition between determinate values. Wavy indicators also accept `amplitude`, `wavelength`, and `waveSpeed`. Stroke widths, track widths, cap shape, gap, stop size, colors, dimensions, native span attributes, `aria-valuetext`, and `aria-labelledby` are configurable. Motion stops under `prefers-reduced-motion: reduce`, and linear indicators follow RTL direction.

The legacy `WavyProgress` name remains as a compatibility alias for determinate `LinearWavyProgressIndicator`.

## Typography

`Text` ports the current AndroidX Material 3 `Typography` model to semantic HTML. The type scale has all 15 baseline roles and all 15 Material 3 Expressive emphasized roles. Visual style and document structure stay independent, so a `displayLarge` style does not silently create an `h1`.

```tsx
import { MaterialThemeProvider, Text } from '@kolehoenicke/material-react-components'

export function Article() {
  return (
    <MaterialThemeProvider
      seed={{ primary: '#6750a4' }}
      typography={{
        brandFontFamily: "'Example Display', sans-serif",
        plainFontFamily: "'Example Text', sans-serif",
        weights: { medium: 550 },
        styles: {
          bodyLarge: { fontVariationSettings: "'opsz' 16" },
        },
      }}
    >
      <Text as="h1" variant="displayLarge">Field notes</Text>
      <Text as="p" variant="bodyLarge">A semantic paragraph using the plain typeface role.</Text>
      <Text as="p" variant="titleMedium" emphasized>Important supporting title</Text>
      <Text maxLines={2} overflow="ellipsis">Two lines at most.</Text>
    </MaterialThemeProvider>
  )
}
```

The default scale matches AndroidX generated type tokens v0.103:

| Role | Size / line height | Baseline weight / tracking | Emphasized weight / tracking |
| --- | ---: | ---: | ---: |
| displayLarge | 57 / 64px | 400 / -0.2px | 500 / 0px |
| displayMedium | 45 / 52px | 400 / 0px | 500 / 0px |
| displaySmall | 36 / 44px | 400 / 0px | 500 / 0px |
| headlineLarge | 32 / 40px | 400 / 0px | 500 / 0px |
| headlineMedium | 28 / 36px | 400 / 0px | 500 / 0px |
| headlineSmall | 24 / 32px | 400 / 0px | 500 / 0px |
| titleLarge | 22 / 28px | 400 / 0px | 500 / 0px |
| titleMedium | 16 / 24px | 500 / 0.2px | 700 / 0.15px |
| titleSmall | 14 / 20px | 500 / 0.1px | 700 / 0.1px |
| bodyLarge | 16 / 24px | 400 / 0.5px | 500 / 0.15px |
| bodyMedium | 14 / 20px | 400 / 0.2px | 500 / 0.25px |
| bodySmall | 12 / 16px | 400 / 0.4px | 500 / 0.4px |
| labelLarge | 14 / 20px | 500 / 0.1px | 700 / 0.1px |
| labelMedium | 12 / 16px | 500 / 0.5px | 700 / 0.5px |
| labelSmall | 11 / 16px | 500 / 0.5px | 700 / 0.5px |

Use an emphasized role directly, such as `bodyLargeEmphasized`, or set `emphasized` on a baseline role. `as` accepts intrinsic elements and React components while keeping their native props. Direct color, family, size, style, stretch, weight, feature, variation, line-height, tracking, alignment, and decoration props override the selected role. The standard `style` prop remains the final override.

Package components use the same complete role resolver as `Text`. Component tokens keep the current AndroidX baseline assignments. M3 Expressive emphasis is applied only where the Material guidance calls out hierarchy or importance: filled or selected buttons, badges, extended FAB labels, and selected list-item headlines. Secondary actions and unselected content keep their baseline counterpart.

Every role exposes `--md-sys-typescale-<role>-font`, `-size`, `-weight`, `-line-height`, and `-tracking`. Brand and plain families use `--md-ref-typeface-brand` and `--md-ref-typeface-plain`; weight aliases use `--md-ref-typeface-weight-regular`, `-medium`, and `-bold`. CSS pixel values preserve the Android `sp` geometry while browser zoom still scales the complete page.

## Theming

`MaterialThemeProvider` generates Material color roles from a source color with Google's open-source Material Color Utilities. Fidelity palettes are enabled by default.

```tsx
<MaterialThemeProvider
  mode="dark"
  seed={{ primary: '#5b8f34', secondary: '#b8e48d' }}
>
  <App />
</MaterialThemeProvider>
```

Components use public CSS custom properties. Override Material tokens at any ancestor when you need more control:

```css
.my-theme {
  --md-sys-shape-corner-large: 20px;
  --md-card-container-shape: 20px;
  --md-card-dragged-elevation: var(--md-sys-elevation-level5);
  --md-slider-active-track-color: #006a6a;
  --md-progress-active-color: #006a6a;
  --md-progress-track-color: #b9ccc9;
  --material-loading-indicator-size: 40px;
}
```

The package does not bundle Google Sans. It uses Google Sans when the host application provides it, then falls back to Roboto and system sans-serif fonts.

## Development

```sh
pnpm install
pnpm verify
```

Run the gallery locally with `pnpm gallery:dev`.

`pnpm verify` runs TypeScript checks, tests, package and gallery builds, and an npm package dry run.

## License

Apache License 2.0. See `NOTICE` and `THIRD_PARTY_NOTICES.md` for attribution.
