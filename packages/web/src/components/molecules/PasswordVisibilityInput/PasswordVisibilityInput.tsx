import { useState } from 'react';

import { IconButton, Icons, Input, type InputProps } from '@web/components/atoms';

export type PasswordToggleSize = 'sm' | 'md';

/** Room on the right of the text so it never runs under the toggle */
const INPUT_PADDING: Record<PasswordToggleSize, string> = {
  sm: 'pr-10',
  md: 'pr-12',
};

export interface PasswordVisibilityInputProps extends Omit<InputProps, 'type'> {
  /** Size of the show/hide icon @default 'sm' */
  toggleSize?: PasswordToggleSize;
}

/** A password `Input` with the show/hide toggle every password field uses. */
export const PasswordVisibilityInput: React.FC<PasswordVisibilityInputProps> = ({
  toggleSize = 'sm',
  className,
  disabled,
  ...inputProps
}) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        {...inputProps}
        type={isVisible ? 'text' : 'password'}
        disabled={disabled}
        className={`${INPUT_PADDING[toggleSize]} ${className ?? ''}`.trim()}
      />
      <IconButton
        icon={isVisible ? Icons.VISIBILITYOFF : Icons.VISIBILITY}
        size={toggleSize}
        ariaLabel={isVisible ? 'Hide password' : 'Show password'}
        disabled={disabled}
        onClick={() => {
          setIsVisible(!isVisible);
        }}
        className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
      />
    </div>
  );
};
