import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Navigation } from '@/components/layout/navigation';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/theme-provider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'TopicForge - AI 驱动的毕业设计选题生成系统',
  description:
    '基于人工智能技术的毕业设计选题自动生成平台，为学生提供创新性和实用性兼备的研究方向',
  keywords: ['毕业设计', '选题生成', 'AI', '人工智能', '学术研究'],
  authors: [{ name: 'TopicForge Team' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='zh-CN' suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-background min-h-screen font-sans antialiased`}
      >
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange
        >
          <div className='relative flex min-h-screen flex-col'>
            <Navigation />
            <main className='flex-1'>{children}</main>
          </div>
          <Toaster
            position='top-center'
            theme='system'
            richColors
            closeButton
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
