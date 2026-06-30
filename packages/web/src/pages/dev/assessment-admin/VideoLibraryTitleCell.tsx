import { Text } from '@web/components/text';

interface VideoLibraryTitleCellProps {
  title: string;
  description: string | null;
}

/** Two-line table cell — video title with a truncated description beneath. */
export const VideoLibraryTitleCell: React.FC<VideoLibraryTitleCellProps> = ({
  title,
  description,
}) => (
  <div className="min-w-0 max-w-[280px] py-0.5">
    <Text
      as="span"
      styleProps={{ size: 'sm', weight: 'semibold', colour: 'foreground' }}
      className="block truncate"
    >
      {title}
    </Text>
    {description ? (
      <Text
        as="p"
        styleProps={{ size: 'xs', colour: 'muted-foreground' }}
        className="mt-0.5 truncate"
      >
        {description}
      </Text>
    ) : null}
  </div>
);
