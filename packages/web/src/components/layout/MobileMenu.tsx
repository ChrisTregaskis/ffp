import { AnimatePresence } from 'motion/react';
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

import { IconButton } from '@web/components/button';
import type { IconName } from '@web/components/Icon/types';
import { Logo } from '@web/components/logo';
import { Backdrop, ClickScale, SlideDrawer, SlideVertical } from '@web/components/motion';
import { Text } from '@web/components/text';

import { NavItem } from './NavItem';

export interface MobileMenuNavItem {
  key: string;
  label: string;
  icon: IconName;
  path: string;
  section: 'main' | 'footer';
  onClick?: () => void;
}

export interface MobileMenuProps {
  // Navigation items to display
  navItems: MobileMenuNavItem[];
  // Additional CSS classes for the hamburger button
  className?: string;
}

/**
 * Mobile/Small screen navigation menu with hamburger button and slide-in drawer
 */
export const MobileMenu: React.FC<MobileMenuProps> = ({ navItems, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const headerRef = useRef<HTMLDivElement>(null);

  // Handle scroll behavior
  useEffect(() => {
    const handleScroll = (): void => {
      const currentScrollY = window.scrollY;
      const headerHeight = headerRef.current?.offsetHeight ?? 0;

      // If header would be in viewport anyway, keep it visible
      if (currentScrollY <= headerHeight) {
        setIsVisible(true);
      } else if (currentScrollY < lastScrollY.current) {
        // Scrolling up - show header
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY.current) {
        // Scrolling down - hide header
        setIsVisible(false);
      }

      lastScrollY.current = currentScrollY;
    };

    // passive: true essentially means we commit to not preventing default scroll behaviour.
    // This helps avoid janky behaviour
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleMenu = (): void => {
    setIsOpen(!isOpen);
  };
  const closeMenu = (): void => {
    setIsOpen(false);
  };

  const mainNavItems = navItems.filter((item) => item.section === 'main');
  const footerNavItems = navItems.filter((item) => item.section === 'footer');

  return (
    <>
      {/* Header Bar - Positioned at top with logo left, menu button right */}
      <SlideVertical
        forwardedRef={headerRef}
        isVisible={isVisible}
        slideDistance={-100}
        duration={0.15}
        easing="easeInOut"
        className={`
          sticky top-0 z-40 bg-ffp-navy shadow-md
          flex items-center justify-between px-4 py-3
          lg:hidden
          ${className}
        `}
      >
        {/* Logo on the left */}
        <Link to="/" className="flex items-center gap-2">
          <Logo variant="white" size="xs" />
          <Text styleProps={{ size: 'sm', weight: 'semibold', colour: 'white' }}>
            Fit For Purpose
          </Text>
        </Link>

        {/* Hamburger Button on the right */}
        <ClickScale scale={0.95} duration={0.1}>
          <IconButton
            icon={isOpen ? 'Close' : 'Menu'}
            size="md"
            colour="#fff"
            onClick={toggleMenu}
            ariaLabel="Toggle mobile menu"
            className="rounded-md p-2"
          />
        </ClickScale>
      </SlideVertical>

      {/* Overlay Backdrop */}
      <AnimatePresence>
        {isOpen && <Backdrop onClick={closeMenu} className="lg:hidden" zIndex={45} opacity={0.5} />}
      </AnimatePresence>

      {/* Open nav items */}
      <AnimatePresence>
        {isOpen && (
          <SlideDrawer
            position="right"
            duration={0.3}
            easing="easeInOut"
            className="fixed right-0 top-0 z-50 flex h-screen w-64 flex-col bg-ffp-navy shadow-xl lg:hidden"
          >
            {/* Header with close button */}
            <div className="flex items-center justify-between border-b border-white p-4">
              <Text styleProps={{ size: 'lg', weight: 'semibold', colour: 'white' }}>
                Fit For Purpose
              </Text>
              <ClickScale scale={0.95} duration={0.1}>
                <IconButton
                  icon="Close"
                  size="md"
                  colour="#fff"
                  onClick={closeMenu}
                  ariaLabel="Close menu"
                  className="rounded-md p-2"
                />
              </ClickScale>
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 w-full justify-center overflow-y-auto">
              <div className="flex-col w-full space-y-1 justify-center">
                {mainNavItems.map((item) => (
                  <div key={item.key} onClick={closeMenu}>
                    <NavItem
                      label={item.label}
                      icon={item.icon}
                      path={item.path}
                      isCollapsed={false}
                      onClick={item.onClick}
                    />
                  </div>
                ))}
              </div>
            </nav>

            {/* Footer Navigation */}
            <div className="py-4">
              <div className="space-y-1">
                {footerNavItems.map((item) => (
                  <div key={item.key} onClick={closeMenu}>
                    <NavItem
                      label={item.label}
                      icon={item.icon}
                      path={item.path}
                      isCollapsed={false}
                      onClick={item.onClick}
                    />
                  </div>
                ))}
              </div>
            </div>
          </SlideDrawer>
        )}
      </AnimatePresence>
    </>
  );
};
