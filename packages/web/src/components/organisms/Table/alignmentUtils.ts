export const getAlignTextClass = (align?: 'left' | 'center' | 'right'): string => {
  if (align === 'center') {
    return 'text-center';
  }

  if (align === 'right') {
    return 'text-right';
  }

  return 'text-left';
};

export const getAlignJustifyClass = (align?: 'left' | 'center' | 'right'): string => {
  if (align === 'center') {
    return 'justify-center';
  }

  if (align === 'right') {
    return 'justify-end';
  }

  return '';
};
