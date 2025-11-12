'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as NavigationMenu from '@radix-ui/react-navigation-menu';
import { Home, FileText } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/lib/utils';

export function Navigation() {
  const pathname = usePathname();

  return (
    <NavigationMenu.Root className="relative z-50 w-full border-b border-[var(--border)] bg-[var(--background)]">
      <div className="container mx-auto max-w-7xl px-4">
        <NavigationMenu.List className="flex items-center justify-between h-16 list-none m-0 p-0">
          {/* Left side - Home button */}
          <NavigationMenu.Item className="flex items-center">
            <NavigationMenu.Link asChild>
              <Link
                href="/"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold transition-colors",
                  "text-[var(--foreground)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]",
                  "focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2"
                )}
              >
                <Home className="w-5 h-5" />
                <span>Lexsy</span>
              </Link>
            </NavigationMenu.Link>
          </NavigationMenu.Item>

          {/* Center - Navigation items */}
          <div className="flex items-center gap-1">
            <NavigationMenu.Item>
              <NavigationMenu.Link asChild>
                <Link
                  href="/test"
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2",
                    pathname === '/test'
                      ? "bg-[var(--primary)] text-[var(--lexsy-purple)]"
                      : "text-[var(--lexsy-purple)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
                  )}
                  style={{
                    backgroundColor: pathname === '/test'
                      ? "var(--primary)"
                      : "var(--background)",
                    color: "var(--lexsy-purple)"
                  }}
                >
                  <FileText className="w-4 h-4" />
                  <span>Try Now</span>
                </Link>
              </NavigationMenu.Link>
            </NavigationMenu.Item>

          </div>

          {/* Right side - Theme toggle */}
          <NavigationMenu.Item className="flex items-center">
            <ThemeToggle />
          </NavigationMenu.Item>

          {/* Viewport for dropdown menus (if needed in future) */}
          <NavigationMenu.Viewport className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-90 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 absolute top-full left-0 w-full origin-top rounded-md border border-[var(--border)] bg-[var(--background)] shadow-lg" />
        </NavigationMenu.List>
      </div>
    </NavigationMenu.Root>
  );
}

