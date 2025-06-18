'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  SearchableSelect,
  SearchableSelectOption,
} from '../../components/ui/searchable-select';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription } from '../../components/ui/alert';
import {
  LoaderIcon,
  SparklesIcon,
  Settings,
  Zap,
  AlertCircle,
} from 'lucide-react';

interface GenerateClientProps {
  majors: string[];
  years: number[];
}

// 算法选项配置
const algorithmOptions = [
  {
    value: 'markov',
    icon: Zap,
    label: '马尔科夫链',
    description: '基于统计学习的生成算法，创新性较强',
  },
  {
    value: 'template',
    icon: Settings,
    label: '模板生成',
    description: '基于模板的生成算法，规范性较好',
  },
  {
    value: 'hybrid',
    icon: SparklesIcon,
    label: '混合算法',
    description: '结合多种算法，平衡创新性和规范性',
  },
] as const;

// 数量选项
const countOptions = [
  { value: 3, label: '3 个' },
  { value: 5, label: '5 个' },
  { value: 10, label: '10 个' },
  { value: 15, label: '15 个' },
] as const;

export default function GenerateClient({ majors, years }: GenerateClientProps) {
  const router = useRouter();

  // 表单状态
  const [selectedMajor, setSelectedMajor] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [algorithm, setAlgorithm] = useState<string>('markov');
  const [count, setCount] = useState<number>(5);

  // UI状态
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const filteredMajors = majors.filter(major => major && major.trim() !== '');

  // 构建专业选项数据
  const majorOptions: SearchableSelectOption[] = [
    { value: 'all', label: '不限专业' },
    ...filteredMajors.map(major => ({ value: major, label: major })),
  ];

  // 构建年份选项数据
  const yearOptions: SearchableSelectOption[] = [
    { value: 'all', label: '不限年份' },
    ...years.map(year => ({ value: year.toString(), label: year.toString() })),
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          major: selectedMajor === 'all' ? undefined : selectedMajor,
          year: selectedYear === 'all' ? undefined : selectedYear,
          algorithm,
          count,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || '生成失败，请重试');
        return;
      }

      // 成功后跳转到结果页面
      router.push(`/generate/result/${result.sessionId}`);
    } catch (error) {
      console.error('生成请求失败:', error);
      setError('网络错误，请检查网络连接后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedMajor('all');
    setSelectedYear('all');
    setAlgorithm('markov');
    setCount(5);
    setError('');
  };

  return (
    <div className='mx-auto max-w-4xl space-y-6'>
      {/* 错误提示 */}
      {error && (
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 主表单卡片 */}
      <Card className='glass-effect card-hover border-0'>
        <CardContent className='p-8'>
          <div className='mb-6 flex items-center gap-3'>
            <div className='bg-primary/10 rounded-full p-2'>
              <Settings className='text-primary h-5 w-5' />
            </div>
            <h2 className='text-xl font-semibold'>生成配置</h2>
          </div>

          <form onSubmit={handleSubmit} className='space-y-8'>
            {/* 参数配置网格 */}
            <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-4'>
              {/* 专业选择 */}
              <div className='space-y-3'>
                <Label htmlFor='major' className='text-sm font-medium'>
                  专业领域
                </Label>
                <SearchableSelect
                  options={majorOptions}
                  value={selectedMajor}
                  onValueChange={setSelectedMajor}
                  placeholder='选择专业（可选）'
                  searchPlaceholder='搜索专业...'
                  emptyText='未找到相关专业'
                  disabled={isLoading}
                />
              </div>

              {/* 年份选择 */}
              <div className='space-y-3'>
                <Label htmlFor='year' className='text-sm font-medium'>
                  参考年份
                </Label>
                <SearchableSelect
                  options={yearOptions}
                  value={selectedYear}
                  onValueChange={setSelectedYear}
                  placeholder='选择年份（可选）'
                  searchPlaceholder='搜索年份...'
                  emptyText='未找到相关年份'
                  disabled={isLoading}
                />
              </div>

              {/* 算法选择 */}
              <div className='space-y-3'>
                <Label htmlFor='algorithm' className='text-sm font-medium'>
                  生成算法
                </Label>
                <Select
                  value={algorithm}
                  onValueChange={setAlgorithm}
                  disabled={isLoading}
                >
                  <SelectTrigger className='h-11'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {algorithmOptions.map(option => {
                      const Icon = option.icon;
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <div className='flex items-center gap-2'>
                            <Icon className='h-4 w-4' />
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* 数量选择 */}
              <div className='space-y-3'>
                <Label htmlFor='count' className='text-sm font-medium'>
                  生成数量
                </Label>
                <Select
                  value={count.toString()}
                  onValueChange={value => setCount(parseInt(value))}
                  disabled={isLoading}
                >
                  <SelectTrigger className='h-11'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {countOptions.map(option => (
                      <SelectItem
                        key={option.value}
                        value={option.value.toString()}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 算法说明 */}
            {algorithm && (
              <div className='bg-muted/50 rounded-lg p-4'>
                <div className='mb-2 flex items-center gap-2'>
                  {(() => {
                    const option = algorithmOptions.find(
                      opt => opt.value === algorithm
                    );
                    if (!option) return null;
                    const Icon = option.icon;
                    return (
                      <>
                        <Icon className='text-primary h-4 w-4' />
                        <span className='text-sm font-medium'>
                          {option.label}
                        </span>
                      </>
                    );
                  })()}
                </div>
                <p className='text-muted-foreground text-sm'>
                  {
                    algorithmOptions.find(opt => opt.value === algorithm)
                      ?.description
                  }
                </p>
              </div>
            )}

            {/* 操作按钮 */}
            <div className='flex justify-center gap-4 pt-4'>
              <Button
                type='submit'
                disabled={isLoading}
                size='lg'
                className='h-12 min-w-48 text-base'
              >
                {isLoading ? (
                  <>
                    <LoaderIcon className='mr-2 h-5 w-5 animate-spin' />
                    AI 正在生成中...
                  </>
                ) : (
                  <>
                    <SparklesIcon className='mr-2 h-5 w-5' />
                    开始生成选题
                  </>
                )}
              </Button>

              <Button
                type='button'
                variant='outline'
                onClick={handleReset}
                disabled={isLoading}
                size='lg'
                className='h-12'
              >
                重置
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 提示信息 */}
      <div className='text-center'>
        <div className='bg-primary/10 text-primary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm'>
          <SparklesIcon className='h-4 w-4' />
          <span>AI 将根据您的选择生成个性化的毕业设计选题</span>
        </div>
      </div>
    </div>
  );
}
