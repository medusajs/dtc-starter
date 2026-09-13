# UI Primitives and Modals

## Overview
Patterns you need to follow to add a new input, modal, or form in this storefront. The contract here is **load-bearing** — the floating-label CSS in `globals.css` assumes inputs always render with `placeholder=" "`, and the `Modal` component depends on a parent `<ModalProvider>` so that `useModal()` can find the `close` callback. This file collects those contracts in one place.

## Local UI Kit (`modules/common/components/ui/index.tsx`)

Already documented in `components.md` and `storefront.md`. Key invariants:

- Every primitive uses `forwardRef` and sets `displayName`.
- Compound components use `Object.assign(Root, { Sub })`.
- Consumer `className` is appended last via `clx(base, conditional && "...", className)`.
- `Button`'s `isLoading` prop sets `disabled || isLoading` on the button and renders the literal text `"Loading..."` (no spinner).

## `Input` — Floating-Label Contract

`modules/common/components/input/index.tsx` (76 lines) — `React.forwardRef<HTMLInputElement, InputProps>`.

```ts
type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "placeholder"> & {
  label: string              // required
  name: string               // required — doubles as the id/htmlFor
  errors?: string
  touched?: boolean
  topLabel?: string
  // plus all native input props minus size and placeholder
}
```

### How the floating label works

The component renders a `peer` `<input>` with `placeholder=" "` (literal space — a non-empty placeholder is what makes the `:not(:placeholder-shown)` CSS rule fire when the field is empty). A sibling `<label htmlFor={name}>` floats up via the **global** CSS in `globals.css`:

```css
input:focus ~ label,
input:not(:placeholder-shown) ~ label {
  @apply -translate-y-2 text-xsmall-regular;
}
input:focus ~ label { @apply left-0; }
```

The label is **not** a JS state — it is entirely driven by CSS, so the floating effect degrades gracefully if Tailwind classes change. The component also renders a `Label` (from the local UI kit) for the optional `topLabel` — this is a separate "static" label rendered above the input, not the floating one.

### Why `placeholder` and `size` are stripped

The type **omits** `"placeholder"` and `"size"` from the native input props to prevent consumers from accidentally breaking the floating-label CSS. If a consumer passes `placeholder="Enter your name"`, the input's `placeholder` attribute would be that string and `:not(:placeholder-shown)` would fire as soon as the field is focused (before any value), making the label stick in the wrong state. Stripping these props makes the contract enforceable.

### Password toggle

When `type === "password"`, the component renders an `Eye` / `EyeOff` icon button on the right that flips `inputType` between `"password"` and `"text"` via `useState`. The required-field asterisk (`*`) is appended after the label text.

### When to use `Input` vs native `<input>`

- Use `Input` for any form field where the floating-label design is wanted.
- For an input that should be flush to the page (e.g. a search input without a label), use a native `<input className="...">` with `peer` + your own label markup.
- For a checkbox/radio in a form group, use `Checkbox` or `RadioGroup` from the UI kit, not `Input`.

## `Modal` API

`modules/common/components/modal/index.tsx` (118 lines) — `@headlessui/react` `Dialog` wrapped in `Transition`. Default export; subcomponents attached via `Object.assign`.

```ts
type ModalProps = {
  isOpen: boolean
  close: () => void
  size?: "small" | "medium" | "large"   // → max-w-md | max-w-xl | max-w-3xl
  search?: boolean                       // when true: transparent bg, no shadow, top-anchored
  children: React.ReactNode
  "data-testid"?: string
}

Modal.Title      // data-testid="close-modal-button" — uses useModal() for the X button
Modal.Description
Modal.Body
Modal.Footer
```

**Sizing convention** (updated 2026-09-05):

| Size | Tailwind | Use for |
|---|---|---|
| `small` | `max-w-md` (448px) | confirm dialogs, toasts |
| `medium` (default) | `max-w-xl` (576px) | single-field forms, login, simple inputs |
| `large` | `max-w-3xl` (768px) | **address forms** (`add-address`, `edit-address-modal`) — fits 2-column first-name/last-name + 144px postal + city layout on desktop without horizontal scroll |

The `Dialog.Panel` has `max-h-[90vh] overflow-y-auto` (changed from `max-h-[75vh]` with no overflow on 2026-09-05). The outer wrapper is `overflow-y-auto` (was `overflow-y-hidden`). This means long content scrolls inside the panel, and the page behind can scroll if needed. Forms with 10+ fields (address) stay usable on viewports as small as ~500px tall.

### Modal is dumb (no internal state)

`Modal` does not own the open/close state. The parent component owns `useToggleState()` (or `useState`) and passes `isOpen` + `close` in. This is the inverse of the typical React-modal pattern, but it composes better with server actions: a `useActionState` form can re-derive `isOpen` from the `successState` of the action.

### The context only exposes `close`

`modules/lib/context/modal-context.tsx` (34 lines) — `ModalContext = { close: () => void }`. **There is no `open` or state in the context.** `Modal` internally wraps its children in `<ModalProvider close={close} value={{ close }}>`, and `Modal.Title` reads `useModal()` to wire its `X` button to `close`. `useModal()` throws `"useModal must be used within a ModalProvider"` if no provider is found.

This means any subcomponent rendered inside `<Modal>` can close the modal without prop-drilling, but nothing can **open** it from inside — opening is always owned by the parent.

### Adding a new modal

```tsx
"use client"
import { useState } from "react"
import Modal from "@modules/common/components/modal"
import { Button } from "@modules/common/components/ui"
import { useToggleState } from "@lib/hooks/use-toggle-state"   // optional helper

const MyModal = () => {
  const toggle = useToggleState(false)        // gives state, open, close, toggle
  return (
    <>
      <Button onClick={toggle.open} data-testid="open-modal-button">Open</Button>
      <Modal isOpen={toggle.state} close={toggle.close} size="medium" data-testid="my-modal">
        <Modal.Title>Hello</Modal.Title>
        <Modal.Body>...</Modal.Body>
        <Modal.Footer>
          <Button onClick={toggle.close}>Close</Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}
```

## Canonical Form-Modal Pattern (Address Card)

The `add-address.tsx` and `edit-address-modal.tsx` files in `modules/account/components/address-card/` are the canonical example of a modal that hosts a form-action. The pattern:

```tsx
"use client"
import { useActionState, useEffect, useState } from "react"
import Modal from "@modules/common/components/modal"
import { useToggleState } from "@lib/hooks/use-toggle-state"
import { addCustomerAddress } from "@lib/data/customer"          // or updateCustomerAddress
import { SubmitButton } from "@modules/checkout/components/submit-button"

const AddAddress = ({ customer, region }) => {
  const toggle = useToggleState(false)
  const [successState, setSuccessState] = useState(false)
  const [formState, formAction] = useActionState(addCustomerAddress, {
    success: false,
    error: null,
  })

  useEffect(() => {
    if (formState.success) toggle.close()
  }, [formState])

  return (
    <>
      <button onClick={toggle.open} data-testid="add-address-button">+ Add address</button>
      <Modal isOpen={toggle.state} close={toggle.close} size="large" data-testid="add-address-modal">
        <Modal.Title>Add address</Modal.Title>
        <Modal.Body>
          <form action={formAction}>
            {/* Input fields — Input component from above */}
            {formState.error && <div data-testid="address-error">{formState.error}</div>}
            <SubmitButton data-testid="save-button">Save</SubmitButton>
            <Button type="button" variant="secondary" onClick={toggle.close} data-testid="cancel-button">Cancel</Button>
          </form>
        </Modal.Body>
      </Modal>
    </>
  )
}
```

The key trick: `useEffect` watching `formState.success` calls `toggle.close()` once the action reports success. Without this effect, the modal would stay open after a successful submit.

The `SubmitButton` is from `modules/checkout/components/submit-button` and uses `useFormStatus()` to show `isLoading` automatically during the action's pending state.

## Cart Dropdown Cleanup Pattern (re-stated for reference)

`modules/layout/components/cart-dropdown/index.tsx` uses `useRef` + `useState` for a `setTimeout` that auto-cancels on hover or unmount:

```ts
const [activeTimer, setActiveTimer] = useState<NodeJS.Timer | undefined>(undefined)
const open = () => setCartDropdownOpen(true)
const close = () => setCartDropdownOpen(false)
const timedOpen = () => {
  open()
  const timer = setTimeout(close, 5000)
  setActiveTimer(timer)
}
const openAndCancel = () => {
  if (activeTimer) clearTimeout(activeTimer)
  open()
}
useEffect(() => () => { if (activeTimer) clearTimeout(activeTimer) }, [activeTimer])
```

Anywhere you need a similar "show then auto-hide" pattern (e.g. toasts, banners), follow this shape: store the timer ID in state, cancel in the `onMouseEnter`/equivalent, and clean up in a separate effect.

## Headless UI Primitives Used

| Primitive | Used by |
|---|---|
| `Dialog` / `Transition` | `Modal` |
| `Listbox` / `ListboxButton` / `ListboxOption` / `ListboxOptions` | `CountrySelect`, `LanguageSelect` |
| `Popover` / `PopoverButton` / `PopoverPanel` | `CartDropdown`, `SideMenu` |
| `RadioGroup` | `Payment` (provider list), `Radio` (raw) |

## Radix Primitives Used

| Primitive | Used by |
|---|---|
| `@radix-ui/react-accordion` | `ProductTabs`, `OptionsPicker` |

## Common Gotchas

- **`useModal()` throws when used outside `<ModalProvider>`** — only call it from inside `<Modal.Title>`, `<Modal.Body>`, etc. (which are themselves rendered inside the provider). Calling it in a sibling component will crash.
- **`Input`'s `placeholder` is hard-coded to `" "`** — don't try to pass your own placeholder; use `topLabel` for a static label and the floating label for the field name.
- **Modal's `size` only changes `max-w`** — for a full-screen or scrollable modal, write your own classes via `className` and don't use the `search` variant (it changes the layout to top-anchored with a transparent background).
- **`SubmitButton` requires `<form action={...}>`** — it relies on `useFormStatus()`, so it only works inside a server-action form. For client-side handlers, use the regular `Button` and manage `isLoading` yourself.
- **`<Toaster>` is not present** — the upstream `Toaster` component was removed. Adding notifications requires either re-adding the upstream `Toaster` from `@medusajs/ui` (the comment `// TODO: Re-add Toaster component when needed` appears in `account/layout.tsx` and `cart-dropdown/index.tsx`) or wiring a third-party toast library.
