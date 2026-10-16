import { Card, StaticAlert } from '@web/components/molecules';

import type { ReactNode } from 'react';

export interface AuthFormCardProps {
  title: string;
  subtitle: string;
  /** Shown above the form in an error alert */
  error?: string | null;
  onDismissError?: () => void;
  children: ReactNode;
}

/** The card every sign-in screen's form sits in, with its error alert above the form. */
export const AuthFormCard: React.FC<AuthFormCardProps> = ({
  title,
  subtitle,
  error,
  onDismissError,
  children,
}) => (
  <Card title={title} subtitle={subtitle} centerHeader>
    {error && (
      <StaticAlert variant="error" message={error} onDismiss={onDismissError} className="mb-6" />
    )}

    <div className="space-y-6">{children}</div>
  </Card>
);
