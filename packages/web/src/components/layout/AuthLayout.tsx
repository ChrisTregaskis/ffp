import { Logo } from '@web/components/logo/Logo';
import { FadeSlideIn } from '@web/components/motion/FadeSlideIn';

import { Title } from '../text';

import type { ReactNode } from 'react';

export interface AuthLayoutProps {
  /** Page content (typically an auth form card) */
  children: ReactNode;
  /** Optional page title (displayed above the card) */
  title?: string;
  /** Show logo above card @default true */
  showLogo?: boolean;
  /** Maximum width of the centered container @default 'max-w-md' */
  maxWidth?: string;
}

/**
 * Authentication layout template component.
 *
 * Provides consistent layout for all auth screens (login, register, forgot password, etc).
 */
export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  showLogo = true,
  maxWidth = 'max-w-md',
}) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-100 via-purple-50 to-purple-100 px-4 py-12">
      {/*
        Gradient uses hard-coded colours for visual effect.
        This is an acceptable exception to theme colour enforcement.
        Future: Consider adding CSS variables for gradient stops in theme.
      */}
      <FadeSlideIn className={`w-full ${maxWidth}`}>
        <div className="space-y-6">
          {/* Logo section */}
          {showLogo && (
            <div className="flex justify-center">
              <Logo variant="primary-dark" size="lg" />
            </div>
          )}

          {/* Header section */}
          {title && (
            <div className="text-center space-y-2">
              <Title as="h1">{title}</Title>
            </div>
          )}

          {/* Content slot (auth card) */}
          {children}
        </div>
      </FadeSlideIn>
    </div>
  );
};
