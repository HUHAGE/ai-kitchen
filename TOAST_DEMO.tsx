// Toast 使用示例 - 可以复制到任何页面中测试

import React from 'react';
import { useStore } from './store';
import { Button } from './components/ui';

const ToastDemo = () => {
  const { showToast } = useStore();

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold mb-6">Toast 提示系统演示</h1>
      
      <div className="space-y-3">
        <Button 
          onClick={() => showToast('操作成功！', 'success')}
          variant="primary"
        >
          显示成功提示
        </Button>

        <Button 
          onClick={() => showToast('操作失败，请重试', 'error')}
          variant="danger"
        >
          显示错误提示
        </Button>

        <Button 
          onClick={() => showToast('请注意库存不足', 'warning')}
          variant="secondary"
        >
          显示警告提示
        </Button>

        <Button 
          onClick={() => showToast('这是一条普通消息', 'info')}
          variant="ghost"
        >
          显示信息提示
        </Button>

        <Button 
          onClick={() => {
            showToast('第一条消息', 'success');
            setTimeout(() => showToast('第二条消息', 'info'), 500);
            setTimeout(() => showToast('第三条消息', 'warning'), 1000);
          }}
          variant="primary"
        >
          显示多条提示（堆叠效果）
        </Button>

        <Button 
          onClick={() => showToast('这条消息会显示 5 秒', 'info', 5000)}
          variant="secondary"
        >
          显示长时间提示（5秒）
        </Button>
      </div>
    </div>
  );
};

export default ToastDemo;
