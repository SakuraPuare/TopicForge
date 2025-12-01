import axios, { AxiosInstance } from 'axios';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import prisma from './db';

// 超星系统API响应接口
interface ChaoxingApiResponse {
  code: number;
  data: {
    totalRecords: string;
    totalPages: string;
    curPage: string;
    results: Array<{
      id: string;
      documentType: string;
      fields: Array<{
        flag: string;
        srcKey: string;
        value: string;
        key: string;
        subs?: Array<{
          value: string;
          searchValue: string;
        }>;
      }>;
    }>;
    sorts: Array<{
      name: string;
      value: string;
    }>;
  };
  message: string;
  status: number;
}

// 学术文献数据接口
interface AcademicPaper {
  id: string;
  title: string;
  author?: string;
  studentId?: string;
  major?: string;
  department?: string;
  university?: string;
  year?: string;
  documentType?: string;
}

// 爬虫配置接口
export interface CrawlConfig {
  baseUrl?: string;
  wfwfid?: string;
  searchId?: string;
  params?: string;
  maxPages?: number;
  pageSize?: number;
  delay?: number;
  sorts?: string;
  concurrency?: number; // 并发数
  batchSize?: number; // 批量保存大小
  retryAttempts?: number; // 重试次数
  adaptiveDelay?: boolean; // 自适应延迟
}

export interface CrawlResult {
  success: boolean;
  data: AcademicPaper[];
  errors: string[];
  totalRecords: number;
  totalPages: number;
}

class ChaoxingCrawler {
  private client: AxiosInstance;
  private config: Required<CrawlConfig>;
  private requestCount: number = 0;
  private lastRequestTime: number = 0;

  constructor(config: CrawlConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || 'https://4mdx2w4w.mh.chaoxing.com',
      wfwfid: config.wfwfid || '22869',
      searchId: config.searchId || '130eff2766e46311ee28ad902b6110be4898',
      params: config.params || '',
      maxPages: config.maxPages || 50,
      pageSize: config.pageSize || 10,
      delay: config.delay || 500,
      sorts: config.sorts || 'down___left_time',
      concurrency: config.concurrency || 3,
      batchSize: config.batchSize || 50,
      retryAttempts: config.retryAttempts || 3,
      adaptiveDelay: config.adaptiveDelay || true,
    };

    this.client = axios.create({
      timeout: 30000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/json, text/plain, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Content-Type': 'application/json;charset=utf-8',
        Referer: 'https://4mdx2w4w.mh.chaoxing.com/',
        Origin: 'https://4mdx2w4w.mh.chaoxing.com',
      },
    });
  }

  async crawlPage(
    page: number = 1,
    retryCount: number = 0
  ): Promise<CrawlResult> {
    const result: CrawlResult = {
      success: false,
      data: [],
      errors: [],
      totalRecords: 0,
      totalPages: 0,
    };

    try {
      // 智能延迟控制
      await this.applyAdaptiveDelay();

      console.log(
        `正在爬取第 ${page} 页... (尝试 ${retryCount + 1}/${this.config.retryAttempts})`
      );

      const url = `${this.config.baseUrl}/app/universal-search/search-list`;
      const requestData = {
        page: page,
        pageSize: this.config.pageSize,
        wfwfid: this.config.wfwfid,
        sorts: { value: this.config.sorts },
      };

      // 添加URL参数
      const params = new URLSearchParams({
        wfwfid: this.config.wfwfid,
        searchId: this.config.searchId,
        params: this.config.params,
      });

      const response = await this.client.post<ChaoxingApiResponse>(
        `${url}?${params.toString()}`,
        requestData
      );

      this.requestCount++;
      this.lastRequestTime = Date.now();

      if (response.data.code !== 1) {
        throw new Error(`API返回错误: ${response.data.message}`);
      }

      const apiData = response.data.data;
      result.totalRecords = parseInt(apiData.totalRecords);
      result.totalPages = parseInt(apiData.totalPages);

      // 解析文献数据
      result.data = this.parseAcademicPapers(apiData.results);
      result.success = true;

      console.log(`第 ${page} 页爬取完成，获得 ${result.data.length} 条数据`);
    } catch (error) {
      console.error(`爬取第 ${page} 页失败 (尝试 ${retryCount + 1}):`, error);

      // 重试机制
      if (retryCount < this.config.retryAttempts - 1) {
        const retryDelay = Math.min(
          this.config.delay * Math.pow(2, retryCount),
          5000
        );
        console.log(`${retryDelay}ms 后重试第 ${page} 页...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return await this.crawlPage(page, retryCount + 1);
      }

      const errorMsg = `爬取第 ${page} 页失败: ${error}`;
      result.errors.push(errorMsg);
    }

    return result;
  }

  // 智能延迟控制
  private async applyAdaptiveDelay(): Promise<void> {
    if (!this.config.adaptiveDelay) {
      if (this.config.delay > 0) {
        await new Promise(resolve => setTimeout(resolve, this.config.delay));
      }
      return;
    }

    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    // 根据请求频率动态调整延迟
    let dynamicDelay = this.config.delay;

    if (this.requestCount > 0) {
      // 每10个请求增加延迟
      const delayMultiplier = Math.floor(this.requestCount / 10) * 0.1 + 1;
      dynamicDelay = Math.min(this.config.delay * delayMultiplier, 2000);
    }

    // 确保请求间隔不小于最小延迟
    const minInterval = Math.max(dynamicDelay, 200);
    if (timeSinceLastRequest < minInterval) {
      await new Promise(resolve =>
        setTimeout(resolve, minInterval - timeSinceLastRequest)
      );
    }
  }

  private parseAcademicPapers(
    results: ChaoxingApiResponse['data']['results']
  ): AcademicPaper[] {
    return results.map(item => {
      const paper: AcademicPaper = {
        id: item.id,
        title: '',
        documentType: item.documentType,
      };

      // 解析字段数据
      item.fields.forEach(field => {
        switch (field.key) {
          case '题名':
            paper.title = this.cleanText(field.value);
            break;
          case '作者':
            if (field.subs && field.subs.length > 0) {
              paper.author = field.subs[0].value;
            } else {
              paper.author = field.value;
            }
            break;
          case '学号':
            paper.studentId = field.value;
            break;
          case '专业':
            paper.major = field.value;
            break;
          case '院系':
            if (field.subs && field.subs.length > 0) {
              paper.department = field.subs[0].value;
            } else {
              paper.department = field.value;
            }
            break;
          case '学位授予单位':
            paper.university = field.value;
            break;
          case '年份':
            paper.year = field.value;
            break;
        }
      });

      return paper;
    });
  }

  private cleanText(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
  }

  async crawlAllPages(
    maxPages?: number,
    autoRetryFailedPages: boolean = true
  ): Promise<{
    totalProcessed: number;
    totalSaved: number;
    totalDuplicates: number;
    errors: string[];
    completedPages: number;
    failedPages: number[];
  }> {
    const result = {
      totalProcessed: 0,
      totalSaved: 0,
      totalDuplicates: 0,
      errors: [] as string[],
      completedPages: 0,
      failedPages: [] as number[],
    };

    try {
      // 先爬取第一页获取总页数
      const firstPageResult = await this.crawlPage(1);
      if (!firstPageResult.success) {
        result.errors.push(...firstPageResult.errors);
        return result;
      }

      const totalPages = Math.min(
        firstPageResult.totalPages,
        maxPages || this.config.maxPages
      );

      console.log(
        `开始并发爬取，总共 ${totalPages} 页，总记录数: ${firstPageResult.totalRecords}，并发数: ${this.config.concurrency}`
      );

      // 收集所有数据进行批量保存
      let allData: AcademicPaper[] = [...firstPageResult.data];

      // 并发爬取剩余页面
      const pageGroups = this.createPageGroups(
        2,
        totalPages,
        this.config.concurrency
      );

      for (let groupIndex = 0; groupIndex < pageGroups.length; groupIndex++) {
        const pageGroup = pageGroups[groupIndex];
        console.log(
          `正在爬取第 ${groupIndex + 1}/${pageGroups.length} 组页面: [${pageGroup.join(', ')}]`
        );

        // 并发爬取当前组的页面
        const groupPromises = pageGroup.map(page => this.crawlPage(page));
        const groupResults = await Promise.allSettled(groupPromises);

        // 处理结果
        groupResults.forEach((promiseResult, index) => {
          const page = pageGroup[index];

          if (promiseResult.status === 'fulfilled') {
            const pageResult = promiseResult.value;
            if (pageResult.success) {
              allData.push(...pageResult.data);
              result.totalProcessed += pageResult.data.length;
              result.completedPages++;
            } else {
              result.errors.push(...pageResult.errors);
              result.failedPages.push(page);
            }
          } else {
            const errorMsg = `第 ${page} 页爬取Promise失败: ${promiseResult.reason}`;
            console.error(errorMsg);
            result.errors.push(errorMsg);
            result.failedPages.push(page);
          }
        });

        // 自动重试失败的页面
        if (autoRetryFailedPages && result.failedPages.length > 0) {
          console.log(
            `检测到 ${result.failedPages.length} 个失败页面，正在重试...`
          );
          const retryPages = [...result.failedPages];
          result.failedPages = []; // 清空失败页面列表

          for (const page of retryPages) {
            console.log(`重试第 ${page} 页...`);
            const retryResult = await this.crawlPage(page);

            if (retryResult.success) {
              allData.push(...retryResult.data);
              result.totalProcessed += retryResult.data.length;
              result.completedPages++;
              console.log(`第 ${page} 页重试成功`);
            } else {
              result.errors.push(
                `第 ${page} 页重试失败: ${retryResult.errors.join(', ')}`
              );
              result.failedPages.push(page);
            }
          }
        }

        // 每组完成后批量保存数据
        if (
          allData.length >= this.config.batchSize ||
          groupIndex === pageGroups.length - 1
        ) {
          const batchStats = await this.batchSaveToPrisma(allData);
          result.totalSaved += batchStats.saved;
          result.totalDuplicates += batchStats.duplicates;

          console.log(
            `已完成 ${Math.min((groupIndex + 1) * this.config.concurrency + 1, totalPages)}/${totalPages} 页，批量保存 ${batchStats.saved} 条新数据`
          );

          allData = []; // 清空已保存的数据
        }

        // 组间延迟
        if (groupIndex < pageGroups.length - 1) {
          await new Promise(resolve => setTimeout(resolve, this.config.delay));
        }
      }

      console.log(`\n爬取完成! 统计信息:`);
      console.log(`- 总处理数据: ${result.totalProcessed} 条`);
      console.log(`- 新保存数据: ${result.totalSaved} 条`);
      console.log(`- 重复数据: ${result.totalDuplicates} 条`);
      console.log(`- 成功页面: ${result.completedPages} 页`);
      console.log(`- 失败页面: ${result.failedPages.length} 页`);
      console.log(`- 错误数量: ${result.errors.length} 个`);

      if (result.failedPages.length > 0) {
        console.log(`失败页面列表: [${result.failedPages.join(', ')}]`);
      }
    } catch (error) {
      const errorMsg = `批量爬取失败: ${error}`;
      console.error(errorMsg);
      result.errors.push(errorMsg);
    }

    return result;
  }

  // 创建页面分组用于并发爬取
  private createPageGroups(
    startPage: number,
    endPage: number,
    concurrency: number
  ): number[][] {
    const groups: number[][] = [];
    const pages = Array.from(
      { length: endPage - startPage + 1 },
      (_, i) => startPage + i
    );

    for (let i = 0; i < pages.length; i += concurrency) {
      groups.push(pages.slice(i, i + concurrency));
    }

    return groups;
  }

  async saveToPrisma(data: AcademicPaper[]): Promise<{
    saved: number;
    duplicates: number;
  }> {
    let saved = 0;
    let duplicates = 0;

    for (const paper of data) {
      try {
        if (!paper.title || paper.title.length < 5) {
          continue; // 跳过无效标题
        }

        // 检查是否已存在（使用组合字段：title + school + major + year）
        const existing = await prisma.graduationTopic.findFirst({
          where: {
            title: paper.title,
            school: paper.university || null,
            major: paper.major || null,
            year: paper.year ? parseInt(paper.year) : null,
          },
        });

        if (existing) {
          duplicates++;
          continue;
        }

        // 保存新记录
        await prisma.graduationTopic.create({
          data: {
            title: paper.title,
            school: paper.university,
            major: paper.major,
            year: paper.year ? parseInt(paper.year) : null,
            keywords: JSON.stringify({
              author: paper.author,
              department: paper.department,
              studentId: paper.studentId,
              documentType: paper.documentType,
            }),
          },
        });

        saved++;
      } catch (error) {
        console.error(`保存数据失败: ${paper.title}`, error);
      }
    }

    return { saved, duplicates };
  }

  // 批量保存到数据库 - 性能优化版本
  async batchSaveToPrisma(data: AcademicPaper[]): Promise<{
    saved: number;
    duplicates: number;
  }> {
    let saved = 0;
    let duplicates = 0;

    if (data.length === 0) {
      return { saved, duplicates };
    }

    try {
      // 过滤有效数据
      const validPapers = data.filter(
        paper => paper.title && paper.title.length >= 5
      );

      if (validPapers.length === 0) {
        return { saved, duplicates };
      }

      // 批量检查重复数据（使用组合字段：title + school + major + year）
      // 先获取所有可能的title，然后查询这些title的所有记录以提高效率
      const uniqueTitles = [...new Set(validPapers.map(paper => paper.title))];

      const existingRecords = await prisma.graduationTopic.findMany({
        where: {
          title: {
            in: uniqueTitles,
          },
        },
        select: {
          title: true,
          school: true,
          major: true,
          year: true,
        },
      });

      // 创建已存在记录的标识集合（使用组合键）
      const existingKeySet = new Set(
        existingRecords.map(
          (item: {
            title: string;
            school: string | null;
            major: string | null;
            year: number | null;
          }) =>
            `${item.title}|${item.school ?? ''}|${item.major ?? ''}|${item.year ?? ''}`
        )
      );

      // 筛选出新数据（使用相同的组合键格式）
      const newPapers = validPapers.filter(paper => {
        const key = `${paper.title}|${paper.university ?? ''}|${paper.major ?? ''}|${paper.year ? parseInt(paper.year) : ''}`;
        if (existingKeySet.has(key)) {
          duplicates++;
          return false;
        }
        return true;
      });

      // 批量插入新数据
      if (newPapers.length > 0) {
        const createData = newPapers.map(paper => ({
          title: paper.title,
          school: paper.university,
          major: paper.major,
          year: paper.year ? parseInt(paper.year) : null,
          keywords: JSON.stringify({
            author: paper.author,
            department: paper.department,
            studentId: paper.studentId,
            documentType: paper.documentType,
          }),
        }));

        const batchSize = 50; // 数据库批量插入大小
        for (let i = 0; i < createData.length; i += batchSize) {
          const batch = createData.slice(i, i + batchSize);
          try {
            await prisma.graduationTopic.createMany({
              data: batch,
            });
            saved += batch.length;
          } catch (error) {
            // 检查是否是唯一约束错误
            if (
              error instanceof PrismaClientKnownRequestError &&
              error.code === 'P2002'
            ) {
              // 批量保存时遇到唯一约束错误，回退到单条保存以处理重复
              console.log(
                `批量保存第 ${Math.floor(i / batchSize) + 1} 批数据遇到重复，切换到单条保存模式`
              );
            } else {
              console.error(
                `批量保存第 ${Math.floor(i / batchSize) + 1} 批数据失败:`,
                error
              );
            }
            // 如果批量保存失败，回退到单条保存
            for (const item of batch) {
              try {
                await prisma.graduationTopic.create({ data: item });
                saved++;
              } catch (singleError) {
                // 检查是否是唯一约束错误（P2002）
                if (
                  singleError instanceof PrismaClientKnownRequestError &&
                  singleError.code === 'P2002'
                ) {
                  // 唯一约束冲突，说明数据已存在，计入重复
                  duplicates++;
                } else {
                  // 其他错误才记录日志
                  console.error(`单条保存失败: ${item.title}`, singleError);
                }
              }
            }
          }
        }
      }

      console.log(`批量保存完成: 新增 ${saved} 条，重复 ${duplicates} 条`);
    } catch (error) {
      console.error('批量保存过程出错:', error);
      // 回退到原来的单条保存方式
      return await this.saveToPrisma(data);
    }

    return { saved, duplicates };
  }

  // 按年份爬取
  async crawlByYear(
    year: string,
    maxPages?: number
  ): Promise<{
    totalProcessed: number;
    totalSaved: number;
    totalDuplicates: number;
    errors: string[];
  }> {
    console.log(`开始爬取 ${year} 年的数据...`);

    // 这里可以扩展为支持按年份筛选的API参数
    return await this.crawlAllPages(maxPages);
  }

  // 按专业爬取
  async crawlByMajor(
    major: string,
    maxPages?: number
  ): Promise<{
    totalProcessed: number;
    totalSaved: number;
    totalDuplicates: number;
    errors: string[];
  }> {
    console.log(`开始爬取 ${major} 专业的数据...`);

    // 这里可以扩展为支持按专业筛选的API参数
    return await this.crawlAllPages(maxPages);
  }

  // 无限爬取直到完成所有页面
  async crawlUntilComplete(
    startPage: number = 1,
    maxRetries: number = 5
  ): Promise<{
    totalProcessed: number;
    totalSaved: number;
    totalDuplicates: number;
    errors: string[];
    completedPages: number;
    finalFailedPages: number[];
  }> {
    console.log('🚀 开始无限爬取模式，将爬取所有可用页面...');

    let currentPage = startPage;
    let consecutiveEmptyPages = 0;
    const totalResult = {
      totalProcessed: 0,
      totalSaved: 0,
      totalDuplicates: 0,
      errors: [] as string[],
      completedPages: 0,
      finalFailedPages: [] as number[],
    };

    while (consecutiveEmptyPages < 3) {
      // 连续3页为空时停止
      console.log(`\n📖 开始爬取第 ${currentPage} 页...`);

      let pageSuccess = false;
      let retryCount = 0;

      while (!pageSuccess && retryCount < maxRetries) {
        try {
          const pageResult = await this.crawlPage(currentPage);

          if (pageResult.success) {
            if (pageResult.data.length === 0) {
              consecutiveEmptyPages++;
              console.log(
                `⚠️  第 ${currentPage} 页无数据，连续空页数: ${consecutiveEmptyPages}`
              );
            } else {
              consecutiveEmptyPages = 0; // 重置连续空页计数

              // 保存数据
              const saveResult = await this.batchSaveToPrisma(pageResult.data);

              totalResult.totalProcessed += pageResult.data.length;
              totalResult.totalSaved += saveResult.saved;
              totalResult.totalDuplicates += saveResult.duplicates;
              totalResult.completedPages++;

              console.log(
                `✅ 第 ${currentPage} 页完成: ${pageResult.data.length} 条数据，新增 ${saveResult.saved} 条`
              );
            }
            pageSuccess = true;
          } else {
            retryCount++;
            console.log(
              `❌ 第 ${currentPage} 页失败 (重试 ${retryCount}/${maxRetries}): ${pageResult.errors.join(', ')}`
            );

            if (retryCount < maxRetries) {
              const retryDelay = Math.min(
                this.config.delay * Math.pow(2, retryCount),
                10000
              );
              console.log(`⏳ ${retryDelay}ms 后重试...`);
              await new Promise(resolve => setTimeout(resolve, retryDelay));
            } else {
              totalResult.errors.push(
                `第 ${currentPage} 页最终失败: ${pageResult.errors.join(', ')}`
              );
              totalResult.finalFailedPages.push(currentPage);
            }
          }
        } catch (error) {
          retryCount++;
          console.log(
            `💥 第 ${currentPage} 页异常 (重试 ${retryCount}/${maxRetries}): ${error}`
          );

          if (retryCount < maxRetries) {
            const retryDelay = Math.min(
              this.config.delay * Math.pow(2, retryCount),
              10000
            );
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          } else {
            totalResult.errors.push(`第 ${currentPage} 页异常失败: ${error}`);
            totalResult.finalFailedPages.push(currentPage);
          }
        }
      }

      currentPage++;

      // 每爬取10页显示一次统计
      if (currentPage % 10 === 0) {
        console.log(`\n📊 进度统计 (已处理 ${currentPage} 页):`);
        console.log(`   - 成功页面: ${totalResult.completedPages}`);
        console.log(`   - 处理数据: ${totalResult.totalProcessed} 条`);
        console.log(`   - 新增数据: ${totalResult.totalSaved} 条`);
        console.log(`   - 失败页面: ${totalResult.finalFailedPages.length}`);
      }
    }

    console.log(`\n🎉 无限爬取完成! 最终统计:`);
    console.log(`- 爬取页面: ${currentPage - 1} 页`);
    console.log(`- 成功页面: ${totalResult.completedPages} 页`);
    console.log(`- 失败页面: ${totalResult.finalFailedPages.length} 页`);
    console.log(`- 总处理数据: ${totalResult.totalProcessed} 条`);
    console.log(`- 新保存数据: ${totalResult.totalSaved} 条`);
    console.log(`- 重复数据: ${totalResult.totalDuplicates} 条`);
    console.log(`- 错误数量: ${totalResult.errors.length} 个`);

    if (totalResult.finalFailedPages.length > 0) {
      console.log(
        `⚠️  最终失败页面: [${totalResult.finalFailedPages.join(', ')}]`
      );
    }

    return totalResult;
  }
}

// 导出爬虫类和相关接口
export { ChaoxingCrawler, type AcademicPaper };

// 创建默认实例
export const chaoxingCrawler = new ChaoxingCrawler();

// 默认导出
export default ChaoxingCrawler;
