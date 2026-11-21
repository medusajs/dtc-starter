import { Checkbox, Label } from "@modules/common/components/ui"
import React from "react"

type CheckboxProps = {
  checked?: boolean
  onChange?: () => void
  label: string
  name?: string
  'data-testid'?: string
}

const CheckboxWithLabel: React.FC<CheckboxProps> = ({
  checked = true,
  onChange,
  label,
  name,
  'data-testid': dataTestId
}) => {
  const checkboxId = React.useId()
  const checkboxRef = React.useRef<HTMLInputElement>(null)
  // Native form reset must preserve the controlled choice, including failed action retries.
  React.useLayoutEffect(() => {
    if (checkboxRef.current) checkboxRef.current.defaultChecked = checked
  }, [checked])
  return (
    <div className="flex items-center space-x-2 ">
      <Checkbox
        className="text-base-regular flex items-center gap-x-2"
        id={checkboxId}
        ref={checkboxRef}
        role="checkbox"
        checked={checked}
        readOnly={!onChange}
        aria-checked={checked}
        onChange={onChange}
        name={name}
        data-testid={dataTestId}
      />
      <Label
        htmlFor={checkboxId}
        className="!transform-none !txt-medium"
      >
        {label}
      </Label>
    </div>
  )
}

export default CheckboxWithLabel
