<script setup lang="ts">
import { ArrowRight, Collection, Key, Setting } from '@element-plus/icons-vue'
import { systems } from '@/content/systems'
</script>

<template>
  <div class="systems-page">
    <header class="site-header">
      <router-link class="site-brand" to="/">
        <span class="site-brand-mark"><el-icon><Collection /></el-icon></span>
        <span><strong>开发者文档</strong><small>Developer Guides</small></span>
      </router-link>
      <span class="site-header-meta">接口与接入指南</span>
    </header>
    <main class="systems-main">
      <section class="systems-heading">
        <span class="section-kicker">业务系统</span>
        <h1>选择接口文档</h1>
        <p>按业务域维护的服务端接口、参数约束、响应协议与多语言 SDK 接入示例。</p>
      </section>
      <section class="system-list" aria-label="业务系统列表">
        <router-link v-for="system in systems" :key="system.id" class="system-card" :to="`/systems/${system.id}`">
          <div class="system-icon"><el-icon><Key /></el-icon></div>
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
