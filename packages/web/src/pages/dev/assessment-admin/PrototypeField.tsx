import { Text } from '@web/components/text';

interface PrototypeFieldProps {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
}

/** Label + hint wrapper for the prototype's controlled form fields. */
export const PrototypeField: React.FC<PrototypeFieldProps> = ({
  label,
  hint,
  htmlFor,
  children,
}) => (
  <div className="space-y-1.5">
    <label htmlFor={htmlFor} className="block">
      <Text styleProps={{ size: 'sm', weight: 'medium' }}>{label}</Text>
    </label>
    {children}
    {hint && (
      <Text as="p" styleProps={{ size: 'xs', colour: 'muted-foreground' }}>
        {hint}
      </Text>
    )}
  </div>
);
