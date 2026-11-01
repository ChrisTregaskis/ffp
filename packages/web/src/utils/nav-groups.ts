export interface NavSection<TItem> {
  /** The group's heading; absent for ungrouped items */
  heading?: string;
  items: TItem[];
}

/** Splits nav items into sections: each run of items sharing a group becomes one section. */
export const groupNavItems = <TItem extends { group?: string }>(
  items: TItem[]
): NavSection<TItem>[] => {
  const sections: NavSection<TItem>[] = [];

  for (const item of items) {
    const current = sections.at(-1);

    if (current && current.heading === item.group) {
      current.items.push(item);
    } else {
      sections.push({ heading: item.group, items: [item] });
    }
  }

  return sections;
};
