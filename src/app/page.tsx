'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Database,
  Zap,
  ArrowRight,
  BookOpen,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';

const features = [
  {
    icon: Sparkles,
    title: 'AI 智能生成',
    description: '基于深度学习算法，分析历史数据生成创新性选题',
    color: 'from-pink-500 to-rose-500',
  },
  {
    icon: Database,
    title: '海量题库',
    description: '收录数万条真实毕业设计选题，涵盖各个专业领域',
    color: 'from-purple-500 to-indigo-500',
  },
  {
    icon: Target,
    title: '精准匹配',
    description: '根据专业特点和年份趋势，生成最适合的选题方向',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: TrendingUp,
    title: '趋势分析',
    description: '实时分析行业热点，确保选题具有前瞻性和实用性',
    color: 'from-emerald-500 to-teal-500',
  },
];

const stats = [
  { value: '50,000+', label: '选题数量', icon: BookOpen },
  { value: '200+', label: '专业覆盖', icon: Target },
  { value: '99%', label: '生成准确率', icon: Zap },
  { value: '10,000+', label: '用户信赖', icon: Users },
];

export default function HomePage() {
  return (
    <div className='min-h-screen'>
      {/* Hero Section */}
      <section className='relative overflow-hidden py-20 lg:py-32'>
        <div className='absolute inset-0 bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900' />
        <div className='relative mx-auto max-w-7xl px-6 lg:px-8'>
          <div className='fade-in text-center'>
            <Badge variant='secondary' className='mb-6 px-4 py-2'>
              <Sparkles className='mr-2 h-4 w-4' />
              AI 驱动的选题生成系统
            </Badge>

            <h1 className='mb-6 text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl'>
              <span className='gradient-text'>TopicForge</span>
              <br />
              <span className='text-foreground'>毕业设计选题生成器</span>
            </h1>

            <p className='text-muted-foreground mx-auto mb-10 max-w-2xl text-lg sm:text-xl'>
              基于大数据分析和人工智能技术，为您的毕业设计生成具有创新性和实用性的选题方向，
              助您在学术道路上取得突破。
            </p>

            <div className='flex flex-col items-center justify-center gap-4 sm:flex-row'>
              <Button asChild size='lg' className='min-w-40'>
                <Link href='/generate'>
                  <Sparkles className='mr-2 h-5 w-5' />
                  开始生成选题
                  <ArrowRight className='ml-2 h-5 w-5' />
                </Link>
              </Button>

              <Button variant='outline' size='lg' asChild className='min-w-40'>
                <Link href='/topics'>
                  <Database className='mr-2 h-5 w-5' />
                  浏览选题库
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className='py-16 lg:py-24'>
        <div className='mx-auto max-w-7xl px-6 lg:px-8'>
          <div className='grid grid-cols-2 gap-8 lg:grid-cols-4'>
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className='slide-up text-center'
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className='mb-4 flex justify-center'>
                    <div className='bg-primary/10 rounded-full p-3'>
                      <Icon className='text-primary h-6 w-6' />
                    </div>
                  </div>
                  <div className='text-foreground text-3xl font-bold lg:text-4xl'>
                    {stat.value}
                  </div>
                  <div className='text-muted-foreground text-sm lg:text-base'>
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className='py-16 lg:py-24'>
        <div className='mx-auto max-w-7xl px-6 lg:px-8'>
          <div className='fade-in mb-16 text-center'>
            <h2 className='mb-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl'>
              为什么选择 <span className='gradient-text'>TopicForge</span>
            </h2>
            <p className='text-muted-foreground mx-auto max-w-2xl text-lg'>
              我们结合最新的AI技术和丰富的历史数据，为您提供最优质的选题生成服务
            </p>
          </div>

          <div className='grid gap-8 lg:grid-cols-2'>
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className='animate-in'
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <Card className='card-hover glass-effect group border-0 p-8'>
                    <div className='flex items-start space-x-4'>
                      <div
                        className={`rounded-xl bg-gradient-to-r ${feature.color} p-3 text-white`}
                      >
                        <Icon className='h-6 w-6' />
                      </div>
                      <div className='flex-1'>
                        <h3 className='mb-2 text-xl font-semibold'>
                          {feature.title}
                        </h3>
                        <p className='text-muted-foreground'>
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='py-16 lg:py-24'>
        <div className='mx-auto max-w-7xl px-6 lg:px-8'>
          <div className='fade-in rounded-3xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 p-8 text-center text-white lg:p-16'>
            <h2 className='mb-4 text-3xl font-bold lg:text-4xl'>
              开启您的学术创新之旅
            </h2>
            <p className='mb-8 text-lg opacity-90 lg:text-xl'>
              立即使用 TopicForge，让AI为您生成独特的毕业设计选题
            </p>
            <Button size='lg' variant='secondary' asChild className='min-w-48'>
              <Link href='/generate'>
                <Sparkles className='mr-2 h-5 w-5' />
                免费开始生成
                <ArrowRight className='ml-2 h-5 w-5' />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
