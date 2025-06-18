import Link from 'next/link';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent } from '../../../../components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='mx-auto max-w-4xl'>
        <Card>
          <CardContent className='py-12'>
            <div className='text-center'>
              <AlertCircle className='text-muted-foreground mx-auto h-12 w-12' />
              <h3 className='mt-4 text-lg font-medium'>生成结果不存在</h3>
              <p className='text-muted-foreground mt-2'>
                该生成会话可能已过期或不存在，请返回生成页面重新生成选题
              </p>
              <Link href='/generate' className='mt-4 inline-block'>
                <Button>返回生成页面</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
