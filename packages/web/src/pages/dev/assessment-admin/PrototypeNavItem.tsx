import { Icon, type Icons } from '@web/components/Icon';
import { Text } from '@web/components/text';

interface PrototypeNavItemProps {
  label: string;
  icon: Icons;
  active: boolean;
  isCollapsed: boolean;
  onClick: () => void;
}

/**
 * Side-menu nav row for the prototype — mirrors the real `NavItem` styling
 * (navy menu, `bg-primary` active, `bg-secondary` hover) but drives the
 * prototype's internal view state instead of router navigation.
 */
export const PrototypeNavItem: React.FC<PrototypeNavItemProps> = ({
  label,
  icon,
  active,
  isCollapsed,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-current={active ? 'page' : undefined}
    className={`flex w-full items-center gap-3 py-3 text-white transition-colors duration-150 ${
      active ? 'bg-primary' : 'hover:bg-secondary'
    } ${isCollapsed ? 'justify-center' : 'px-4'}`}
  >
    <Icon name={icon} styleProps={{ size: 'md', colour: 'currentColor' }} ariaLabel={label} />
    {!isCollapsed && (
      <Text styleProps={{ size: 'sm', weight: 'medium', colour: 'white' }}>{label}</Text>
    )}
  </button>
);
