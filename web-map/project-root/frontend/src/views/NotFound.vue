<template>
  <div class="not-found-container flex flex-col items-center justify-center min-h-screen bg-gray-100">
    <a-result
      status="404"
      title="404"
      sub-title="抱歉，你访问的页面不存在"
    >
      <template #extra>
        <a-button type="primary" @click="backToHome">
          返回首页
        </a-button>
      </template>
    </a-result>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

const backToHome = () => {
  router.push('/');
};
</script>

<style scoped>
.not-found-container {
  padding: 40px 0;
}
</style> 