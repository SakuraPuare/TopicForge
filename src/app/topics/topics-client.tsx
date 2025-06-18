'use client';

import { useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import {
  SearchableSelect,
  SearchableSelectOption,
} from '../../components/ui/searchable-select';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import {
  SearchIcon,
  FilterIcon,
  BookOpenIcon,
  CalendarIcon,
  BuildingIcon,
  TagIcon,
  RefreshCcwIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LoaderIcon,
  AlertCircle,
} from 'lucide-react';

interface Topic {
  id: string;
  title: string;
  school?: string | null;
  major?: string | null;
  year?: number | null;
  keywords?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface TopicsResponse {
  data: Topic[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

interface TopicsClientProps {
  initialData: TopicsResponse;
  majors: string[];
  years: number[];
  initialSearchParams: {
    search?: string;
    major?: string;
    year?: string;
    page?: string;
  };
}

// 搜索表单组件
function SearchForm({
  majors,
  years,
  onSearch,
  isLoading,
  initialSearchParams,
}: {
  majors: string[];
  years: number[];
  onSearch: (params: Record<string, string>) => void;
  isLoading: boolean;
  initialSearchParams: TopicsClientProps['initialSearchParams'];
}) {
  const [search, setSearch] = useState(initialSearchParams.search || '');
  const [selectedMajor, setSelectedMajor] = useState(
    initialSearchParams.major || 'all'
  );
  const [selectedYear, setSelectedYear] = useState(
    initialSearchParams.year || 'all'
  );

  const filteredMajors = majors.filter(major => major && major.trim() !== '');

  // 构建专业选项数据
  const majorOptions: SearchableSelectOption[] = [
    { value: 'all', label: '全部专业' },
    ...filteredMajors.map(major => ({ value: major, label: major })),
  ];

  // 构建年份选项数据
  const yearOptions: SearchableSelectOption[] = [
    { value: 'all', label: '全部年份' },
    ...years.map(year => ({ value: year.toString(), label: year.toString() })),
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      search: search.trim(),
      major: selectedMajor,
      year: selectedYear,
    });
  };

  const handleReset = () => {
    setSearch('');
    setSelectedMajor('all');
    setSelectedYear('all');
    onSearch({});
  };

  return (
    <Card className='glass-effect border-0'>
      <CardContent className='p-6'>
        <div className='mb-4 flex items-center gap-3'>
          <div className='bg-primary/10 rounded-full p-2'>
            <FilterIcon className='text-primary h-5 w-5' />
          </div>
          <h2 className='text-lg font-semibold'>搜索与筛选</h2>
        </div>

        <form onSubmit={handleSubmit} className='space-y-6'>
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            <div className='space-y-2'>
              <Label htmlFor='search' className='text-sm font-medium'>
                搜索选题
              </Label>
              <div className='relative'>
                <SearchIcon className='text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2' />
                <Input
                  id='search'
                  placeholder='输入关键词搜索...'
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className='h-11 pl-10'
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='major' className='text-sm font-medium'>
                专业领域
              </Label>
              <SearchableSelect
                options={majorOptions}
                value={selectedMajor}
                onValueChange={setSelectedMajor}
                placeholder='选择专业'
                searchPlaceholder='搜索专业...'
                emptyText='未找到相关专业'
                disabled={isLoading}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='year' className='text-sm font-medium'>
                年份
              </Label>
              <SearchableSelect
                options={yearOptions}
                value={selectedYear}
                onValueChange={setSelectedYear}
                placeholder='选择年份'
                searchPlaceholder='搜索年份...'
                emptyText='未找到相关年份'
                disabled={isLoading}
              />
            </div>

            <div className='space-y-2'>
              <Label className='invisible text-sm font-medium'>操作</Label>
              <div className='flex items-center gap-2'>
                <Button
                  type='submit'
                  className='h-11 flex-1'
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <LoaderIcon className='mr-2 h-4 w-4 animate-spin' />
                      搜索中...
                    </>
                  ) : (
                    <>
                      <SearchIcon className='mr-2 h-4 w-4' />
                      搜索
                    </>
                  )}
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  onClick={handleReset}
                  className='h-11'
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <LoaderIcon className='h-4 w-4 animate-spin' />
                  ) : (
                    <RefreshCcwIcon className='h-4 w-4' />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// 分页导航组件
function PaginationNav({
  currentPage,
  totalPages,
  onPageChange,
  isLoading,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className='flex items-center justify-center gap-2'>
      <Button
        variant='outline'
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1 || isLoading}
        className='h-10'
      >
        {isLoading ? (
          <LoaderIcon className='h-4 w-4 animate-spin' />
        ) : (
          <ChevronLeftIcon className='h-4 w-4' />
        )}
        上一页
      </Button>

      <div className='flex items-center gap-1'>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let page: number;
          if (totalPages <= 5) {
            page = i + 1;
          } else if (currentPage <= 3) {
            page = i + 1;
          } else if (currentPage > totalPages - 3) {
            page = totalPages - 4 + i;
          } else {
            page = currentPage - 2 + i;
          }

          return (
            <Button
              key={page}
              variant={page === currentPage ? 'default' : 'outline'}
              onClick={() => onPageChange(page)}
              disabled={isLoading}
              className='h-10 w-10'
            >
              {page}
            </Button>
          );
        })}
      </div>

      <Button
        variant='outline'
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages || isLoading}
        className='h-10'
      >
        下一页
        {isLoading ? (
          <LoaderIcon className='h-4 w-4 animate-spin' />
        ) : (
          <ChevronRightIcon className='h-4 w-4' />
        )}
      </Button>
    </div>
  );
}

// 选题卡片组件
function TopicCard({ topic }: { topic: Topic }) {
  const formatDate = (dateString: Date) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const parseKeywords = (keywords?: string | null): string[] => {
    if (!keywords) return [];
    try {
      const parsed = JSON.parse(keywords);
      return Array.isArray(parsed) ? parsed : [keywords];
    } catch {
      return [keywords];
    }
  };

  return (
    <Card className='glass-effect card-hover border-0'>
      <CardContent className='p-6'>
        <div className='space-y-4'>
          <div className='flex items-start justify-between'>
            <h3 className='pr-4 text-lg font-semibold leading-relaxed'>
              {topic.title}
            </h3>
            <div className='text-muted-foreground flex items-center gap-2 text-sm'>
              <CalendarIcon className='h-4 w-4' />
              <span>{formatDate(topic.createdAt)}</span>
            </div>
          </div>

          <div className='flex flex-wrap items-center gap-4 text-sm'>
            {topic.major && (
              <div className='flex items-center gap-1'>
                <BookOpenIcon className='text-primary h-4 w-4' />
                <span className='font-medium'>{topic.major}</span>
              </div>
            )}

            {topic.school && (
              <div className='flex items-center gap-1'>
                <BuildingIcon className='text-muted-foreground h-4 w-4' />
                <span>{topic.school}</span>
              </div>
            )}

            {topic.year && (
              <div className='flex items-center gap-1'>
                <CalendarIcon className='text-muted-foreground h-4 w-4' />
                <span>{topic.year}</span>
              </div>
            )}
          </div>

          {topic.keywords && parseKeywords(topic.keywords).length > 0 && (
            <div className='flex items-center gap-2'>
              <TagIcon className='text-muted-foreground h-4 w-4' />
              <div className='flex flex-wrap gap-1'>
                {parseKeywords(topic.keywords)
                  .slice(0, 5)
                  .map((keyword, idx) => (
                    <Badge key={idx} variant='secondary' className='text-xs'>
                      {keyword}
                    </Badge>
                  ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function TopicsClient({
  initialData,
  majors,
  years,
  initialSearchParams,
}: TopicsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 状态管理
  const [data, setData] = useState<TopicsResponse>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // 搜索函数
  const searchTopics = useCallback(
    async (params: Record<string, string> = {}, page: number = 1) => {
      setIsLoading(true);
      setError('');

      try {
        const searchParams = new URLSearchParams();

        // 添加搜索参数
        Object.entries(params).forEach(([key, value]) => {
          if (value && value !== 'all') {
            searchParams.set(key, value);
          }
        });

        // 添加分页参数
        if (page > 1) {
          searchParams.set('page', page.toString());
        }

        // 更新URL
        const queryString = searchParams.toString();
        const newUrl = queryString ? `/topics?${queryString}` : '/topics';
        router.push(newUrl, { scroll: false });

        // 调用API
        const response = await fetch(`/api/topics?${searchParams.toString()}`);
        const result = await response.json();

        if (!result.success) {
          setError(result.error || '搜索失败，请重试');
          return;
        }

        setData(result);
      } catch (error) {
        console.error('搜索失败:', error);
        setError('网络错误，请检查网络连接后重试');
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  // 处理页面变化
  const handlePageChange = useCallback(
    (page: number) => {
      const params: Record<string, string> = {};

      // 从当前searchParams获取查询条件
      searchParams.forEach((value, key) => {
        if (key !== 'page') {
          params[key] = value;
        }
      });

      searchTopics(params, page);
    },
    [searchParams, searchTopics]
  );

  // 处理搜索
  const handleSearch = useCallback(
    (params: Record<string, string>) => {
      searchTopics(params, 1);
    },
    [searchTopics]
  );

  return (
    <div className='mx-auto max-w-6xl space-y-8'>
      {/* 错误提示 */}
      {error && (
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 搜索和筛选器 */}
      <SearchForm
        majors={majors}
        years={years}
        onSearch={handleSearch}
        isLoading={isLoading}
        initialSearchParams={initialSearchParams}
      />

      {/* 搜索结果统计 */}
      <div className='flex items-center justify-between'>
        <div className='text-muted-foreground flex items-center gap-2 text-sm'>
          <BookOpenIcon className='h-4 w-4' />
          <span>共找到 {data.pagination.total} 个选题</span>
        </div>
        <div className='text-muted-foreground text-sm'>
          第 {data.pagination.page} 页，共 {data.pagination.totalPages} 页
        </div>
      </div>

      {/* 选题列表 */}
      <div className='grid gap-6'>
        {data.data.map(topic => (
          <TopicCard key={topic.id} topic={topic} />
        ))}
      </div>

      {/* 分页 */}
      <PaginationNav
        currentPage={data.pagination.page}
        totalPages={data.pagination.totalPages}
        onPageChange={handlePageChange}
        isLoading={isLoading}
      />
    </div>
  );
}
