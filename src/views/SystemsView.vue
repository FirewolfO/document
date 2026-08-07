<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowRight, Collection, Connection, Key, Setting } from '@element-plus/icons-vue'
import { systemsForAudience } from '@/content/systems'
import type { ApiAudience } from '@/types/document'

const route = useRoute()
const audience = computed<ApiAudience>(() => route.params.audience === 'inner' ? 'inner' : 'open')
const embedded = computed(() => route.query.embedded === '1')
const systems = computed(() => systemsForAudience(audience.value))
const audienceName = computed(() => audience.value === 'inner' ? 'Inner 内部接口' : 'Open 开放接口')
const audienceDescription = computed(() => audience.value === 'inner'
  ? '仅供受信任内部服务通过 Gateway 服务凭据调用的接口。'
  : '面向云用户、浏览器应用和业务接入方开放的接口。')
</script>

<template>
  <div :class="['systems-page', { embedded }]">
    <header v-if="!embedded" class="site-header">
      <router-link class="site-brand" to="/">
        <span class="site-brand-mark"><el-icon><Collection /></el-icon></span>
        <span><strong>开发者文档</strong><small>Developer Guides</small></span>
      </router-link>
      <router-link class="back-link" to="/">选择接口类型</router-link>
    </header>
    <main class="systems-main">
      <section class="systems-heading">
        <span class="section-kicker">{{ audienceName }}</span>
        <h1>选择业务系统</h1>
        <p>{{ audienceDescription }}</p>
      </section>
      <section class="system-list" aria-label="业务系统列表">
        <router-link
          v-for="system in systems"
          :key="system.id"
          class="system-card"
          :to="{ name: 'system-docs', params: { audience, systemId: system.id }, query: embedded ? { embedded: '1' } : {} }"
        >
          <div class="system-icon"><el-icon><component :is="audience === 'inner' ? Connection : Key" /></el-icon></div>
          <div class="system-card-copy">
            <div class="system-card-title"><h2>{{ system.name }}</h2><el-tag size="small" effect="plain">{{ system.version }}</el-tag></div>
            <p>{{ system.description }}</p>
            <div class="system-card-meta">
              <span><el-icon><Setting /></el-icon>{{ system.endpoints.length }} 个接口</span>
              <span class="system-enter">查看文档 <el-icon><ArrowRight /></el-icon></span>
            </div>
          </div>
        </router-link>
      </section>
    </main>
  </div>
</template>
