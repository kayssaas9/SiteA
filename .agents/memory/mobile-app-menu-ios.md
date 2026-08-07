---
name: iOS app mobile menu
description: How the full-screen mobile menu for the authenticated app is rendered reliably on iOS Safari.
---

Use a native HTML `<dialog>` element with `dialog.showModal()` — NOT a React portal, NOT a fixed div.

`showModal()` promotes the dialog to the browser's **top layer**, a native browser concept that sits above every CSS stacking context including `backdrop-filter` and `will-change: transform` ancestors. No z-index can interfere with the top layer.

**Why:** The header uses `-webkit-backdrop-filter` which creates a new stacking context on iOS Safari. Even a `position: fixed` child rendered via React portal (`createPortal` to `document.body`) can still appear below the header on iOS because the portal div is a sibling of `#root` in DOM order, but iOS Safari compositing can still be affected by the `backdrop-filter` stacking context. The `<dialog>` top layer bypasses this entirely at the browser engine level.

**How to apply:**
1. Place a `<dialog ref={menuDialogRef} className="app-mobile-overlay">` in the JSX (always in DOM when `!isLanding`, no conditional render).
2. Call `dialog.showModal()` on open, `dialog.close()` on close, inside a `useEffect` watching `menuOpen`.
3. iOS scroll lock: set `body.style = { overflow: hidden, position: fixed, top: -scrollY, width: 100% }` on open, restore + `window.scrollTo(0, scrollY)` on close.
4. CSS: `dialog.app-mobile-overlay { border: none; padding: 0; margin: 0; position: fixed; inset: 0; width: 100%; max-width: 100%; height: 100%; max-height: 100%; background: #0f0f0f; }` and `dialog[open] { display: flex; flex-direction: column; }` and `dialog::backdrop { display: none; }`.
5. Hide Crisp imperatively with `$crisp.push(["do", "chat:hide"])` on open; CSS hiding alone is not reliable enough.

Do NOT use createPortal, portal div, z-index hacks, animation transforms, or contain:paint on the overlay.
