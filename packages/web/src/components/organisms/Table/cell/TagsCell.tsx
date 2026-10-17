import { Badge } from '@web/components/atoms';

import type { CellContext } from '@tanstack/react-table';
import type { ReactNode } from 'react';

interface TagsCellProps<TData> {
  info: CellContext<TData, unknown>;
  maxVisible?: number;
}

export const TagsCell = <TData,>({ info, maxVisible = 3 }: TagsCellProps<TData>): ReactNode => {
  const value = info.getValue() as string[] | null | undefined;

  if (!value || value.length === 0) {
    return '-';
  }

  const visible = value.slice(0, maxVisible);
  const remaining = value.length - maxVisible;

  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((tag) => (
        <Badge key={tag} label={tag} />
      ))}
      {remaining > 0 && <Badge label={`+${String(remaining)} more`} />}
    </div>
  );
};
