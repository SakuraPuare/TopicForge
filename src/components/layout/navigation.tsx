'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Database, Github, Home } from 'lucide-react';
import { ModeToggle } from '@/components/mode-toggle';

export function Navigation() {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/',
      label: '首页',
      icon: Home,
      description: '返回主页',
    },
    {
      href: '/generate',
      label: '生成选题',
      icon: Sparkles,
      description: '使用 AI 生成新的毕业设计选题',
    },
    {
      href: '/topics',
      label: '选题库',
      icon: Database,
      description: '浏览和搜索现有的毕业设计选题',
    },
  ];

  return (
    <nav className='bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur-md'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='flex h-16 items-center justify-between'>
          <div className='flex items-center space-x-8'>
            <Link href='/' className='group flex items-center space-x-3'>
              <div className='rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 p-2'>
                <Sparkles className='h-5 w-5 text-white' />
              </div>
              <div className='flex items-center space-x-2'>
                <span className='gradient-text text-xl font-bold'>
                  TopicForge
                </span>
                <Badge
                  variant='secondary'
                  className='hidden text-xs sm:inline-flex'
                >
                  AI
                </Badge>
              </div>
            </Link>

            <div className='hidden items-center space-x-1 md:flex'>
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? 'default' : 'ghost'}
                      className={cn(
                        'flex h-9 items-center space-x-2',
                        isActive &&
                          'bg-primary text-primary-foreground shadow-sm'
                      )}
                      size='sm'
                    >
                      <Icon className='h-4 w-4' />
                      <span className='hidden lg:inline'>{item.label}</span>
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className='flex items-center space-x-2'>
            <ModeToggle />
            <Button variant='ghost' size='sm' asChild>
              <Link
                href='https://github.com/sakurapuare/TopicForge'
                target='_blank'
                rel='noopener noreferrer'
                className='hidden sm:flex'
              >
                <Github className='h-4 w-4' />
                <span className='ml-2 hidden lg:inline'>GitHub</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Mobile navigation */}
        <div className='border-border/40 border-t pb-3 pt-2 md:hidden'>
          <div className='flex space-x-1'>
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link key={item.href} href={item.href} className='flex-1'>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    className='w-full justify-center'
                    size='sm'
                  >
                    <Icon className='mr-2 h-4 w-4' />
                    <span className='text-xs'>{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
