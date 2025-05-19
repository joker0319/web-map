import { Notification } from '@arco-design/web-vue';

interface NotificationOptions {
  title: string;
  content: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
}

export function useNotification() {
  const showNotification = (options: NotificationOptions) => {
    const { title, content, type = 'info', duration = 3000 } = options;
    
    Notification[type]({
      title,
      content,
      duration,
      closable: true
    });
  };
  
  return {
    showNotification
  };
} 