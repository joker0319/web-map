import { ref } from 'vue';

export function useLoading() {
  const isLoading = ref(false);
  const loadingText = ref('加载中...');
  
  const startLoading = (text = '加载中...') => {
    isLoading.value = true;
    loadingText.value = text;
  };
  
  const endLoading = () => {
    isLoading.value = false;
  };
  
  return {
    isLoading,
    loadingText,
    startLoading,
    endLoading
  };
} 