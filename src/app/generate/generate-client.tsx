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
  X,
  Plus,
} from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';

interface GenerateClientProps {
  majors: string[];
  years: number[];
  schools: string[];
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

export default function GenerateClient({
  majors,
  years,
  schools,
}: GenerateClientProps) {
  const router = useRouter();

  // 表单状态
  const [selectedMajor, setSelectedMajor] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedSchools, setSelectedSchools] = useState<string[]>([]);
  const [preferredKeywords, setPreferredKeywords] = useState<string[]>([]);
  const [requiredKeywords, setRequiredKeywords] = useState<string[]>([]);
  const [excludedKeywords, setExcludedKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState<string>('');
  const [keywordType, setKeywordType] = useState<
    'preferred' | 'required' | 'excluded'
  >('preferred');
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

  // 构建学校选项数据
  const schoolOptions: SearchableSelectOption[] = schools
    .filter(school => school && school.trim() !== '')
    .map(school => ({ value: school, label: school }));

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
          schools: selectedSchools.length > 0 ? selectedSchools : undefined,
          keywords:
            preferredKeywords.length > 0 ? preferredKeywords : undefined,
          requiredKeywords:
            requiredKeywords.length > 0 ? requiredKeywords : undefined,
          excludedKeywords:
            excludedKeywords.length > 0 ? excludedKeywords : undefined,
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
    setSelectedSchools([]);
    setPreferredKeywords([]);
    setRequiredKeywords([]);
    setExcludedKeywords([]);
    setKeywordInput('');
    setAlgorithm('markov');
    setCount(5);
    setError('');
  };

  const handleAddKeyword = () => {
    if (!keywordInput.trim()) return;

    const keyword = keywordInput.trim();
    switch (keywordType) {
      case 'preferred':
        if (!preferredKeywords.includes(keyword)) {
          setPreferredKeywords([...preferredKeywords, keyword]);
        }
        break;
      case 'required':
        if (!requiredKeywords.includes(keyword)) {
          setRequiredKeywords([...requiredKeywords, keyword]);
        }
        break;
      case 'excluded':
        if (!excludedKeywords.includes(keyword)) {
          setExcludedKeywords([...excludedKeywords, keyword]);
        }
        break;
    }
    setKeywordInput('');
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

              {/* 学校选择 */}
              <div className='space-y-3 sm:col-span-2 lg:col-span-4'>
                <Label htmlFor='schools' className='text-sm font-medium'>
                  学校筛选（可选，可多选）
                </Label>
                <div className='flex flex-wrap gap-2'>
                  {selectedSchools.map(school => (
                    <Badge
                      key={school}
                      variant='secondary'
                      className='cursor-pointer px-3 py-1'
                      onClick={() => {
                        if (!isLoading) {
                          setSelectedSchools(prev =>
                            prev.filter(s => s !== school)
                          );
                        }
                      }}
                    >
                      {school}
                      <span className='ml-2'>×</span>
                    </Badge>
                  ))}
                  <SearchableSelect
                    options={schoolOptions.filter(
                      opt => !selectedSchools.includes(opt.value)
                    )}
                    value=''
                    onValueChange={value => {
                      if (value && !selectedSchools.includes(value)) {
                        setSelectedSchools(prev => [...prev, value]);
                      }
                    }}
                    placeholder='添加学校...'
                    searchPlaceholder='搜索学校...'
                    emptyText='未找到相关学校'
                    disabled={isLoading}
                  />
                </div>
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

            {/* 关键词约束 */}
            <div className='space-y-4'>
              <Label className='text-sm font-medium'>关键词约束（可选）</Label>

              {/* 关键词输入 */}
              <div className='flex gap-2'>
                <Select
                  value={keywordType}
                  onValueChange={(
                    value: 'preferred' | 'required' | 'excluded'
                  ) => setKeywordType(value)}
                  disabled={isLoading}
                >
                  <SelectTrigger className='w-32'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='preferred'>偏好</SelectItem>
                    <SelectItem value='required'>必须</SelectItem>
                    <SelectItem value='excluded'>排除</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={keywordInput}
                  onChange={e => setKeywordInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddKeyword();
                    }
                  }}
                  placeholder='输入关键词后按回车'
                  disabled={isLoading}
                  className='flex-1'
                />
                <Button
                  type='button'
                  onClick={handleAddKeyword}
                  disabled={isLoading || !keywordInput.trim()}
                  size='sm'
                >
                  <Plus className='h-4 w-4' />
                </Button>
              </div>

              {/* 显示已添加的关键词 */}
              {(preferredKeywords.length > 0 ||
                requiredKeywords.length > 0 ||
                excludedKeywords.length > 0) && (
                <div className='space-y-2'>
                  {preferredKeywords.length > 0 && (
                    <div>
                      <Label className='text-muted-foreground mb-1 block text-xs'>
                        偏好关键词：
                      </Label>
                      <div className='flex flex-wrap gap-2'>
                        {preferredKeywords.map(keyword => (
                          <Badge
                            key={keyword}
                            variant='secondary'
                            className='cursor-pointer'
                            onClick={() => {
                              if (!isLoading) {
                                setPreferredKeywords(prev =>
                                  prev.filter(k => k !== keyword)
                                );
                              }
                            }}
                          >
                            {keyword}
                            <X className='ml-1 h-3 w-3' />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {requiredKeywords.length > 0 && (
                    <div>
                      <Label className='text-muted-foreground mb-1 block text-xs'>
                        必须包含：
                      </Label>
                      <div className='flex flex-wrap gap-2'>
                        {requiredKeywords.map(keyword => (
                          <Badge
                            key={keyword}
                            variant='default'
                            className='cursor-pointer'
                            onClick={() => {
                              if (!isLoading) {
                                setRequiredKeywords(prev =>
                                  prev.filter(k => k !== keyword)
                                );
                              }
                            }}
                          >
                            {keyword}
                            <X className='ml-1 h-3 w-3' />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {excludedKeywords.length > 0 && (
                    <div>
                      <Label className='text-muted-foreground mb-1 block text-xs'>
                        必须排除：
                      </Label>
                      <div className='flex flex-wrap gap-2'>
                        {excludedKeywords.map(keyword => (
                          <Badge
                            key={keyword}
                            variant='destructive'
                            className='cursor-pointer'
                            onClick={() => {
                              if (!isLoading) {
                                setExcludedKeywords(prev =>
                                  prev.filter(k => k !== keyword)
                                );
                              }
                            }}
                          >
                            {keyword}
                            <X className='ml-1 h-3 w-3' />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
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
