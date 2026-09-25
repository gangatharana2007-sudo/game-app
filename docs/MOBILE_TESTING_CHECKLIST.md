# NEXORA ARENA — Mobile & Responsive Testing Checklist

## 1. Viewport & Breakpoint Matrix

| Device Profile | Viewport Width | Orientation | Status | Pass Criteria |
|---|---|---|---|---|
| **Compact Mobile (iPhone SE)** | `375px` | Portrait | Verified | Grid fits without horizontal scroll; Navbar collapses cleanly. |
| **Standard Mobile (iPhone 14 / Pixel 7)** | `390px - 412px` | Portrait | Verified | 4x4 sensory grid renders centered with 44px+ cell hit areas. |
| **Large Mobile (iPhone 15 Pro Max)** | `430px` | Portrait | Verified | Touch targets easy to reach with single-thumb or two-finger play. |
| **Tablet (iPad Mini / Air)** | `768px - 820px` | Portrait & Landscape | Verified | Bracket tree renders horizontally with smooth native panning. |
| **Desktop / Laptop** | `1024px - 1920px` | Landscape | Verified | Full multi-column dashboard and dual telemetry review screens. |

---

## 2. Touch & Sensory Interaction Tests

- [x] **Minimum 44x44px Touch Targets**:
  - Reaction Grid Duel cells measure at least 64px x 64px on mobile viewports (`aspect-square`).
  - Action buttons (`Mark Ready`, `Register`, `Submit Action`) meet or exceed WCAG 2.1 AAA touch targets.
- [x] **Touch Action & Gesture Conflict**:
  - `touch-action: manipulation` applied to prevent double-tap zooming during rapid clicking.
  - Pull-to-refresh disabled inside the active game arena container to prevent accidental match abandonment.
- [x] **Web Audio API Mobile Unlock**:
  - AudioContext initialized or resumed on explicit user interaction (`Mark Ready` tap) to satisfy iOS Safari autoplay security policy.
  - Sound toggle button functions reliably on iOS Safari and Android Chrome.

---

## 3. Network Disruption & Offline Handling

- [x] **Airplane Mode / Signal Drop**:
  - Disconnecting mobile network displays the sticky `OfflineBanner` instantly (`Network connection disconnected. Grace period timer is running`).
  - Reconnecting network triggers automatic heartbeat resumption and dismisses banner.
- [x] **Browser Tab & App Switching**:
  - Minimizing browser or switching to an incoming call triggers `visibilitychange` telemetry (`TAB_FOCUS_LOST`).
  - Single switch records telemetry without penalizing; excessive (>3) switches flags case for moderator inspection.

---

## 4. Virtual Keyboard & Modal Accessibility

- [x] **Auth & Dispute Modals**:
  - Virtual keyboard opening on mobile does not obscure input fields or submit buttons.
  - Modals use `max-h-[90vh]` with `overflow-y-auto` to accommodate software keyboards.
- [x] **Landscape Orientation Behavior**:
  - Reaction Grid Duel centers cleanly in landscape mode with left/right HUD split.
