'use client';

import { Button } from '../../../../components/ui/button';
import { CopyIcon } from 'lucide-react';

interface CopyButtonProps {
  text: string;
}

export default function CopyButton({ text }: CopyButtonProps) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      // 可以添加复制成功的提示
    } catch (error) {
      console.error('复制失败:', error);
      // 可以添加复制失败的提示
    }
  };

  return (
    <Button variant='ghost' size='sm' onClick={handleCopy}>
      <CopyIcon className='h-4 w-4' />
    </Button>
  );
}
