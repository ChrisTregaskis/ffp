import React from 'react';

import type { InputHTMLAttributes, Ref } from 'react';

export interface FileInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className' | 'value'> {
  /** The trigger opens the picker by calling `click()` on this element */
  forwardedRef?: Ref<HTMLInputElement>;
}

/**
 * A native file picker, kept out of sight. The only place a file `<input>` renders.
 *
 * A visible control (usually a `Button`) opens it through its ref; read the choice in `onChange`.
 */
export const FileInput: React.FC<FileInputProps> = ({ forwardedRef, ...rest }) => (
  <input ref={forwardedRef} type="file" className="hidden" {...rest} />
);
