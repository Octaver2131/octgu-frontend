import { PageContainer } from '@ant-design/pro-components';
import { Card, Input, DatePicker, Table, Button, Modal, message, Tooltip } from 'antd';
import type { DatePickerProps } from 'antd';
import type { TableProps } from 'antd';
import React, { useEffect, useState } from 'react';
import moment from 'moment';
import { addItemUsingPost, deleteItemUsingPost, updateItemUsingPost, listItemByPageUsingGet } from '@/services/backend/itemController';

const Item: React.FC = () => {
  // 控制添加弹窗显示的状态
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  // 控制编辑弹窗显示的状态
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);

  // 当前编辑的记录
  const [currentEditRecord, setCurrentEditRecord] = React.useState<DataType | null>(null);

  // 表单数据状态
  const [formData, setFormData] = React.useState<Partial<DataType>>({
    name: '',
    ip: '',
    category: '',
    quantity: 0,
    price: 0,
    date: '',
    description: ''
  });

  // 表格数据状态
  const [data, setData] = useState<DataType[]>([]);

  // 搜索关键词状态
  const [searchText, setSearchText] = useState<string>('');

  // 选定的日期状态
  const [selectedDate, setSelectedDate] = useState<string>('');

  // 加载数据
  const loadData = async () => {
    try {
      // 自适应获取所有分页数据
      let allItems: any[] = [];
      let current = 1;
      const pageSize = 10; // 使用默认分页大小
      let hasMore = true;

      // 循环获取所有分页数据
      while (hasMore) {
        const res = await listItemByPageUsingGet({
          current,
          pageSize
        });

        if (res.data?.records) {
          // 将当前页数据添加到总数据中
          allItems = [...allItems, ...res.data.records];

          // 检查是否还有更多数据
          // 如果当前页数据少于pageSize，说明已经是最后一页
          if (res.data.records.length < pageSize) {
            hasMore = false;
          } else {
            // 还有更多数据，继续下一页
            current++;
          }
        } else {
          // 如果没有数据返回，停止循环
          hasMore = false;
        }
      }

      // 处理所有数据并设置到状态中
      // 调试：打印原始数据结构
      console.log('原始数据:', allItems);

      const items = allItems.map(item => ({
        key: String(item.id),
        name: item.itemName || '',
        ip: item.itemIp || '',
        category: item.itemCategory || '',
        quantity: item.purchaseNumber || 0,
        price: item.unitPrice || 0,
        totalPrice: item.totalPrice || 0,
        date: item.purchaseTime ? moment(item.purchaseTime).format('YYYY-MM-DD') : '',
        description: item.description || ''
      }));

      // 调试：打印处理后的数据结构
      console.log('处理后的数据:', items);
      setData(items);
    } catch (error) {
      message.error('获取数据失败');
    }
  };

  // 导出CSV功能
  // 导出数据为CSV格式
  const exportToCSV = () => {
    // 定义CSV表头
    const headers = ['名字', '描述', 'IP', '种类', '数量', '单价', '总价', '日期'];

    // 将数据转换为CSV格式
    const csvContent = [
      headers.join(','),
      ...filteredData.map(item => [
        item.name,
        item.description || '',
        item.ip,
        item.category,
        item.quantity,
        item.price,
        item.totalPrice,
        item.date
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // 创建下载链接
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `items_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 组件挂载时加载数据
  useEffect(() => {
    loadData();
  }, []);

  // 根据搜索关键词和选定日期过滤数据
  const filteredData = data.filter(item => {
    // 搜索过滤条件
    const matchesSearch =
      (item.name && item.name.toLowerCase().includes(searchText.toLowerCase())) ||
      (item.ip && item.ip.toLowerCase().includes(searchText.toLowerCase())) ||
      (item.category && item.category.toLowerCase().includes(searchText.toLowerCase()));

    // 日期过滤条件 - 比较年月部分
    const matchesDate = selectedDate ? item.date.startsWith(selectedDate) : true;

    // 同时满足搜索和日期条件
    return matchesSearch && matchesDate;
  });

  // 打开弹窗
  const handleOpen = () => {
    // 重置表单数据
    setFormData({
      name: '',
      ip: '',
      category: '',
      quantity: 0,
      price: 0,
      date: '',
      description: ''
    });
    setIsModalOpen(true);
  };

  // 处理表单字段变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'price' ? Number(value) : value
    }));
  };

  // 处理日期选择
  const handleDateChange: DatePickerProps['onChange'] = (date, dateString) => {
    // 日期选择器返回的 dateString 格式为 "YYYY-MM-DD"
    setFormData(prev => ({
      ...prev,
      date: dateString
    }));
  };

  // 关闭弹窗（确认）
  const handleOk = async () => {
    // 验证表单
    if (!formData.name || !formData.ip || !formData.category || !formData.date) {
      message.error('请填写完整信息');
      return;
    }

    try {
      // 创建新数据项
      const res = await addItemUsingPost({
        itemName: formData.name,
        itemIp: formData.ip,
        itemCategory: formData.category,
        purchaseNumber: formData.quantity,
        unitPrice: formData.price,
        totalPrice: (formData.quantity || 0) * (formData.price || 0),
        purchaseTime: formData.date ? new Date(formData.date).toISOString() : undefined,
        description: formData.description
      });

      if (res.code === 0) {
        message.success('添加成功');
        setIsModalOpen(false);
        loadData(); // 重新加载数据
      } else {
        message.error(res.message || '添加失败');
      }
    } catch (error) {
      message.error('添加失败');
    }
  };

  // 关闭弹窗（取消）
  const handleCancel = () => {
    setIsModalOpen(false);
  };

  // 处理删除按钮点击
  const handleDelete = (record: DataType) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除项目 ${record.name} 吗？`,
      okText: '确定',
      cancelText: '取消',
      centered: true,
      onOk: async () => {
        try {
          const res = await deleteItemUsingPost({ id: record.key });
          if (res.code === 0) {
            message.success('删除成功');
            loadData(); // 重新加载数据
          } else {
            message.error(res.message || '删除失败');
          }
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  // 处理编辑按钮点击
  const handleEdit = (record: DataType) => {
    setCurrentEditRecord(record);
    setFormData({
      name: record.name,
      ip: record.ip,
      category: record.category,
      quantity: record.quantity,
      price: record.price,
      date: record.date,
      description: record.description || ''
    });
    setIsEditModalOpen(true);
  };

  // 编辑弹窗确认
  const handleEditOk = async () => {
    // 验证表单
    if (!formData.name || !formData.ip || !formData.category || !formData.date) {
      message.error('请填写完整信息');
      return;
    }

    try {
      // 更新数据
      const res = await updateItemUsingPost({
        id: Number(currentEditRecord?.key),
        itemName: formData.name,
        itemIp: formData.ip,
        itemCategory: formData.category,
        purchaseNumber: formData.quantity,
        unitPrice: formData.price,
        totalPrice: (formData.quantity || 0) * (formData.price || 0),
        purchaseTime: formData.date ? new Date(formData.date).toISOString() : undefined,
        description: formData.description
      });

      if (res.code === 0) {
        message.success('更新成功');
        setIsEditModalOpen(false);
        setCurrentEditRecord(null);
        loadData(); // 重新加载数据
      } else {
        message.error(res.message || '更新失败');
      }
    } catch (error) {
      message.error('更新失败');
    }
  };

  // 编辑弹窗取消
  const handleEditCancel = () => {
    setIsEditModalOpen(false);
    setCurrentEditRecord(null);
  };

  // 搜索处理函数
  const onSearch = (value: string) => {
    setSearchText(value);
  };

  const onChange: DatePickerProps['onChange'] = (date, dateString) => {
    // 月份选择器返回的 dateString 格式为 "YYYY-MM"
    setSelectedDate(dateString || '');
  };

  const { Search } = Input;

  interface DataType {
    key: string;
    name: string;
    ip: string;
    category: string;
    quantity: number;
    price: number;
    totalPrice: number;
    date: string;
    description: string;
  }

  const columns: TableProps<DataType>['columns'] = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Tooltip title={record.description || '暂无描述'}>
          <a>{text}</a>
        </Tooltip>
      ),
    },
    {
      title: 'IP',
      dataIndex: 'ip',
      key: 'ip',
    },
    {
      title: '种类',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: '单价',
      dataIndex: 'price',
      key: 'price',
      render: (price) => `¥${price.toFixed(2)}`,
    },
    // {
    //   title: '总价',
    //   dataIndex: 'totalPrice',
    //   key: 'totalPrice',
    //   render: (totalPrice) => `¥${totalPrice.toFixed(2)}`,
    // },
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      sorter: (a, b) => moment(a.date, 'YYYY-MM-DD').valueOf() - moment(b.date, 'YYYY-MM-DD').valueOf(),
      sortDirections: ['ascend', 'descend'],
    },
    {
      title: '操作',
       key: 'action',
       width: 150,
       render: (_, record) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button type="primary" onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="default" onClick={() => handleDelete(record)}>删除</Button>
        </div>
      ),
    },
  ];

  return (
    <PageContainer>
      <Card
        style={{
          borderRadius: 8,
          height: '720px',
        }}
      >
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Search placeholder="输入搜索内容" onSearch={onSearch} style={{ width: 300, marginRight: 16 }} />
            <DatePicker onChange={onChange} picker="month" />
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <Button type="default" onClick={exportToCSV} style={{ marginRight: 16 }}>导出</Button>
            <Button type="primary" onClick={handleOpen}>添加</Button>
          </div>
        </div>


        <Table<DataType> columns={columns} dataSource={filteredData} pagination={{ pageSize: 8, position: ['bottomCenter'], showSizeChanger: false }} />

        {/* 添加项目的弹窗 */}
        <Modal
        title="添加谷子"
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        width={400}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>名字</label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="输入谷子名称"
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>IP</label>
            <Input
              name="ip"
              value={formData.ip}
              onChange={handleInputChange}
              placeholder="输入谷子IP"
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>种类</label>
            <Input
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              placeholder="输入谷子种类"
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>数量</label>
            <Input
              name="quantity"
              type="number"
              value={formData.quantity}
              onChange={handleInputChange}
              placeholder="输入谷子数量"
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>单价</label>
            <Input
              name="price"
              type="number"
              value={formData.price}
              onChange={handleInputChange}
              placeholder="输入谷子单价"
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>日期</label>
            <DatePicker
              onChange={handleDateChange}
              value={formData.date ? moment(formData.date) : null}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>描述</label>
            <Input.TextArea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="输入谷子描述"
              style={{ width: '100%' }}
              rows={4}
            />
          </div>
        </div>
      </Modal>

      {/* 编辑弹窗 */}
      <Modal
        title="编辑谷子"
        open={isEditModalOpen}
        onOk={handleEditOk}
        onCancel={handleEditCancel}
        width={400}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>名称</label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="输入谷子名称"
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>IP</label>
            <Input
              name="ip"
              value={formData.ip}
              onChange={handleInputChange}
              placeholder="输入谷子IP"
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>种类</label>
            <Input
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              placeholder="输入谷子种类"
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>数量</label>
            <Input
              name="quantity"
              type="number"
              value={formData.quantity}
              onChange={handleInputChange}
              placeholder="输入谷子数量"
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>单价</label>
            <Input
              name="price"
              type="number"
              value={formData.price}
              onChange={handleInputChange}
              placeholder="输入谷子单价"
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>日期</label>
            <DatePicker
              onChange={handleDateChange}
              value={formData.date ? moment(formData.date) : null}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>描述</label>
            <Input.TextArea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="输入谷子描述"
              style={{ width: '100%' }}
              rows={4}
            />
          </div>
        </div>
      </Modal>
      </Card>
    </PageContainer>
  );
};
export default Item;
