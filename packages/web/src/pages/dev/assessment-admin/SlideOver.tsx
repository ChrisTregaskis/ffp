import { Icon, Icons } from '@web/components/Icon';
import { Text, Title } from '@web/components/text';

import { iconVar } from './prototype-labels';
import { SCROLL_CLASS } from './prototype-styles';

interface SlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

/** Right-hand slide-out overlay panel — stays out of the way while you keep working. */
export const SlideOver: React.FC<SlideOverProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
}) => (
  <div
    className={`fixed inset-0 z-50 ${isOpen ? '' : 'pointer-events-none'}`}
    aria-hidden={!isOpen}
  >
    {/* Backdrop */}
    <button
      type="button"
      aria-label="Close panel"
      tabIndex={isOpen ? 0 : -1}
      onClick={onClose}
      className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0'
      }`}
    />

    {/* Panel */}
    <aside
      className={`absolute right-0 top-0 flex h-full w-full max-w-[560px] flex-col bg-card shadow-xl transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="flex items-start justify-between gap-4 border-b border-border p-5">
        <div>
          <Title as="h2">{title}</Title>
          {subtitle && (
            <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
              {subtitle}
            </Text>
          )}
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          <Icon
            name={Icons.CLOSE}
            styleProps={{ size: 'md', colour: iconVar('muted-foreground') }}
          />
        </button>
      </div>

      <div className={`flex-1 overflow-y-auto p-5 ${SCROLL_CLASS}`}>{children}</div>
    </aside>
  </div>
);
