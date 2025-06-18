'use client';

import { useState, useEffect } from 'react';

interface MajorInfo {
  major: string;
  count: number;
  sampleCount: number;
  hasModel: boolean;
}

interface GenerationResult {
  topics: string[];
  stats: {
    totalGenerated: number;
    validTopics: number;
    averageQuality: number;
    generationTime: number;
  };
  algorithm: string;
  majorInfo?: {
    major: string;
    sampleCount: number;
    hasSpecificModel: boolean;
  };
}

export default function Home() {
  const [majors, setMajors] = useState<MajorInfo[]>([]);
  const [selectedMajor, setSelectedMajor] = useState<string>('');
  const [algorithm, setAlgorithm] = useState<'markov' | 'template' | 'hybrid'>(
    'markov'
  );
  const [count, setCount] = useState<number>(5);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationResult, setGenerationResult] =
    useState<GenerationResult | null>(null);
  const [error, setError] = useState<string>('');

  // 加载可用专业
  useEffect(() => {
    fetchMajors();
  }, []);

  const fetchMajors = async () => {
    try {
      const response = await fetch('/api/majors');
      if (response.ok) {
        const data = await response.json();
        setMajors(data);
      }
    } catch (error) {
      console.error('获取专业列表失败:', error);
    }
  };

  const generateTopics = async () => {
    if (!selectedMajor) {
      setError('请选择一个专业');
      return;
    }

    setIsGenerating(true);
    setError('');
    setGenerationResult(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          major: selectedMajor,
          algorithm,
          count,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setGenerationResult(result);
      } else {
        const errorData = await response.json();
        setError(errorData.error || '生成失败');
      }
    } catch (error) {
      setError('网络请求失败');
      console.error('生成题目失败:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='mx-auto max-w-4xl p-6'>
        <h1 className='mb-8 text-center text-3xl font-bold text-gray-800'>
          毕业设计题目生成器
        </h1>

        <div className='mb-6 rounded-lg bg-white p-6 shadow-md'>
          <h2 className='mb-4 text-xl font-semibold text-gray-700'>生成参数</h2>

          {/* 专业选择 */}
          <div className='mb-4'>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              选择专业
            </label>
            <select
              value={selectedMajor}
              onChange={e => setSelectedMajor(e.target.value)}
              className='w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value=''>请选择专业</option>
              {majors.map(major => (
                <option key={major.major} value={major.major}>
                  {major.major} ({major.sampleCount} 个样本,{' '}
                  {major.hasModel ? '有模型' : '无模型'})
                </option>
              ))}
            </select>
          </div>

          {/* 算法选择 */}
          <div className='mb-4'>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              生成算法
            </label>
            <div className='flex space-x-4'>
              {(['markov', 'template', 'hybrid'] as const).map(alg => (
                <label key={alg} className='flex items-center'>
                  <input
                    type='radio'
                    name='algorithm'
                    value={alg}
                    checked={algorithm === alg}
                    onChange={e =>
                      setAlgorithm(e.target.value as typeof algorithm)
                    }
                    className='mr-2'
                  />
                  <span className='text-sm'>
                    {alg === 'markov' && '马尔科夫链'}
                    {alg === 'template' && '模板生成'}
                    {alg === 'hybrid' && '混合算法'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* 生成数量 */}
          <div className='mb-4'>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              生成数量
            </label>
            <input
              type='number'
              min='1'
              max='20'
              value={count}
              onChange={e => setCount(parseInt(e.target.value) || 5)}
              className='w-24 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>

          {/* 生成按钮 */}
          <button
            onClick={generateTopics}
            disabled={isGenerating || !selectedMajor}
            className='w-full rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400'
          >
            {isGenerating ? '生成中...' : '生成题目'}
          </button>

          {/* 错误信息 */}
          {error && (
            <div className='mt-4 rounded border border-red-400 bg-red-100 p-3 text-red-700'>
              {error}
            </div>
          )}
        </div>

        {/* 生成结果 */}
        {generationResult && (
          <div className='rounded-lg bg-white p-6 shadow-md'>
            <h2 className='mb-4 text-xl font-semibold text-gray-700'>
              生成结果
            </h2>

            {/* 统计信息 */}
            <div className='mb-4 rounded-md bg-gray-100 p-4'>
              <div className='grid grid-cols-2 gap-4 text-sm md:grid-cols-4'>
                <div>
                  <span className='font-medium'>生成数量:</span>{' '}
                  {generationResult.stats.totalGenerated}
                </div>
                <div>
                  <span className='font-medium'>有效题目:</span>{' '}
                  {generationResult.stats.validTopics}
                </div>
                <div>
                  <span className='font-medium'>平均质量:</span>{' '}
                  {generationResult.stats.averageQuality.toFixed(2)}
                </div>
                <div>
                  <span className='font-medium'>生成时间:</span>{' '}
                  {generationResult.stats.generationTime}ms
                </div>
              </div>

              {generationResult.majorInfo && (
                <div className='mt-2 text-sm text-gray-600'>
                  专业: {generationResult.majorInfo.major} | 样本数:{' '}
                  {generationResult.majorInfo.sampleCount} | 专业模型:{' '}
                  {generationResult.majorInfo.hasSpecificModel ? '是' : '否'}
                </div>
              )}
            </div>

            {/* 生成的题目 */}
            <div>
              <h3 className='mb-3 font-medium text-gray-700'>生成的题目:</h3>
              <ol className='space-y-2'>
                {generationResult.topics.map((topic, index) => (
                  <li
                    key={index}
                    className='rounded-r border-l-4 border-blue-400 bg-blue-50 p-3'
                  >
                    <span className='font-medium text-blue-800'>
                      {index + 1}.
                    </span>
                    <span className='ml-2 text-gray-800'>{topic}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
