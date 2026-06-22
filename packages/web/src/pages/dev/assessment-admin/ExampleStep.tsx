import { Text } from '@web/components/text';

interface ExampleStepProps {
  step: number;
  title: string;
  children: React.ReactNode;
}

/** A numbered step block in the scoring worked example. */
export const ExampleStep: React.FC<ExampleStepProps> = ({ step, title, children }) => (
  <div className="flex gap-3">
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
      <Text styleProps={{ size: 'xs', weight: 'semibold', colour: 'primary' }}>{step}</Text>
    </span>
    <div className="min-w-0 flex-1 space-y-1.5">
      <Text as="p" styleProps={{ size: 'sm', weight: 'medium' }}>
        {title}
      </Text>
      {children}
    </div>
  </div>
);
