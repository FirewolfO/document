<script setup lang="ts">
import { ArrowRight, Collection, Connection, Promotion } from '@element-plus/icons-vue'
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
        <span class="section-kicker">接口受众</span>
        <h1>选择接口类型</h1>
        <p>Open 与 Inner 接口独立维护、独立展示，调用凭据和访问边界互不混用。</p>
      </section>
      <section class="system-list audience-list" aria-label="接口类型列表">
        <router-link class="system-card audience-card" to="/open">
          <div class="system-icon"><el-icon><Promotion /></el-icon></div>
          <div class="system-card-copy">
            <div class="system-card-title"><h2>Open 开放接口</h2><el-tag size="small" effect="plain">OPEN</el-tag></div>
            <p>面向云用户、浏览器应用和业务接入方，通过 Gateway Open 入口访问。</p>
            <div class="system-card-meta"><span>开放调用</span><span class="system-enter">查看系统 <el-icon><ArrowRight /></el-icon></span></div>
          </div>
        </router-link>
        <router-link class="system-card audience-card" to="/inner">
          <div class="system-icon inner-icon"><el-icon><Connection /></el-icon></div>
          <div class="system-card-copy">
            <div class="system-card-title"><h2>Inner 内部接口</h2><el-tag size="small" type="warning" effect="plain">INNER</el-tag></div>
            <p>仅供已授权内部服务使用 Gateway 服务 AK/SK 调用，不对终端用户开放。</p>
            <div class="system-card-meta"><span>服务间调用</span><span class="system-enter">查看系统 <el-icon><ArrowRight /></el-icon></span></div>
          </div>
        </router-link>
      </section>
    </main>
  </div>
</template>
