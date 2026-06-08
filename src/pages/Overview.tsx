import { PageContainer } from '@ant-design/pro-components';
import { Card, DatePicker } from 'antd';
import React, { useState, useEffect } from 'react';
import { Line } from '@ant-design/charts';
import { getStatisticsUsingGet, getMonthlyStatisticsUsingGet } from '@/services/backend/itemController';
import dayjs from 'dayjs';

// 图表配置
const config = {
  title: {
    visible: true,
    text: '产品销售趋势',
  },
  description: {
    visible: true,
    text: '展示每月产品销售总额的变化趋势',
  },
  xField: '月份',
  yField: '支出',
  padding: { top: 'auto', right: 'auto', bottom: 0, left: 'auto' },
  forceFit: true,
  xAxis: {
    type: 'category',
    tickCount: 12,
    title: {
      visible: true,
      text: '月份',
    },
  },
  yAxis: {
    type: 'value',
    title: {
      visible: true,
      text: '销售总额 (¥)',
    },
  },
  // 使用默认tooltip配置
  tooltip: {},
  legend: {
    visible: true,
    position: 'top-right',
  },
};

const Overview: React.FC = () => {
  // 定义年份状态，默认为当前年份，使用dayjs对象
  const [year, setYear] = useState<dayjs.Dayjs | null>(dayjs());
  // 定义统计数据状态
  const [statistics, setStatistics] = useState<Record<string, any>>({});
  // 定义图表数据状态
  const [chartData, setChartData] = useState([]);
  // 定义本年支出状态（根据月度数据计算）
  const [currentYearExpense, setCurrentYearExpense] = useState<number>(0);

  // 处理年份变化
  const handleYearChange = (date: dayjs.Dayjs | null) => {
    setYear(date);
    setCurrentYearExpense(0); // 切换年份时重置支出
  };

  // 获取统计数据
  useEffect(() => {
    getStatisticsUsingGet().then((res) => {
      if (res.data) {
        setStatistics(res.data);
      }
    });
  }, []);

  // 获取每月统计数据并计算本年支出
  useEffect(() => {
    // 从year状态中提取年份，如果没有选择年份则使用当前年份
    const selectedYear = year ? year.year() : dayjs().year();
    
    getMonthlyStatisticsUsingGet({ year: selectedYear }).then((res) => {
      if (res.data) {
        // 将后端返回的数据转换为图表所需格式
        const formattedData = res.data.map((item: any) => ({
          '月份': item.month,
          '支出': item.expense
        }));
        
        // 更新图表数据
        setChartData(formattedData);
        
        // 计算本年支出（月度数据总和）
        const totalExpense = formattedData.reduce((sum, item) => sum + (item['支出'] || 0), 0);
        setCurrentYearExpense(totalExpense);
      }
    });
  }, [year]);

  // 格式化金额显示
  const formatCurrency = (value: number | string | undefined) => {
    if (value === undefined) return '¥0.00';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return `¥${num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <PageContainer>
      <Card
        style={{
          borderRadius: 8,
          height: '720px',
        }}
      >
        {/* 数据概览区 */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
          <div style={{ flex: 1, padding: 16, backgroundColor: '#f0f2f5', borderRadius: 8 }}>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>全部支出</div>
            <div style={{ fontSize: 24, fontWeight: 'bold' }}>{formatCurrency(statistics.totalExpense)}</div>
          </div>
          <div style={{ flex: 1, padding: 16, backgroundColor: '#f0f2f5', borderRadius: 8 }}>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>本年支出</div>
            <div style={{ fontSize: 24, fontWeight: 'bold' }}>{formatCurrency(currentYearExpense)}</div>
          </div>
          <div style={{ flex: 1, padding: 16, backgroundColor: '#f0f2f5', borderRadius: 8 }}>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>最喜欢的IP</div>
            <div style={{ fontSize: 24, fontWeight: 'bold' }}>{statistics.favoriteIp || '暂无数据'}</div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>数量: {statistics.favoriteIpCount?.toLocaleString()}件</div>
          </div>
        </div>

        {/* 顶部筛选区 */}
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div></div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: 8 }}>选择年份:</span>
              <DatePicker picker="year" onChange={handleYearChange} value={year} />
            </div>
          </div>
        </div>

        {/* 图表区域 */}
        <div style={{ height: '480px', marginTop: '20px' }}>
          <Line {...{ ...config, data: chartData }} />
        </div>
      </Card>
    </PageContainer>
  );
};

export default Overview;
