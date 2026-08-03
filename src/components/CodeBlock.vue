<script setup lang="ts">
import { ref } from 'vue'
import { CopyDocument, Select } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const props = defineProps<{ code: string; language?: string }>()
const copied = ref(false)

async function copyCode() {
  try {
    await navigator.clipboard.writeText(props.code)
    copied.value = true
    ElMessage.success('代码已复制')
    window.setTimeout(() => { copied.value = false }, 1600)
  } catch {
    ElMessage.error('复制失败，请手动选择代码')
  }
}
</script>

<template>
  <div class="code-block">
    <div class="code-toolbar">
      <span>{{ language || 'text' }}</span>
      <el-tooltip content="复制代码">
        <el-button text :icon="copied ? Select : CopyDocument" aria-label="复制代码" @click="copyCode">{{ copied ? '已复制' : '复制' }}</el-button>
      </el-tooltip>
    </div>
    <pre><code>{{ code }}</code></pre>
  </div>
</template>
