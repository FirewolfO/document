<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Collection, Document, Fold, Link, Menu as MenuIcon, Search } from '@element-plus/icons-vue'
import CodeBlock from '@/components/CodeBlock.vue'
import { findSystem } from '@/content/systems'
import type { ApiAudience, EndpointDocument, ExampleLanguage } from '@/types/document'

const route = useRoute()
const router = useRouter()
const searchText = ref('')
const activeEndpointId = ref('')
const exampleTab = ref<ExampleLanguage>('http')
const catalogOpen = ref(false)

const embedded = computed(() => route.query.embedded === '1')
const audience = computed<ApiAudience>(() => route.params.audience === 'inner' ? 'inner' : 'open')
const system = computed(() => findSystem(audience.value, String(route.params.systemId)))
const filteredEndpoints = computed(() => {
  const keyword = searchText.value.trim().toLowerCase()
  if (!keyword) return system.value?.endpoints || []
  return (system.value?.endpoints || []).filter((endpoint) => `${endpoint.title} ${endpoint.path} ${endpoint.summary}`.toLowerCase().includes(keyword))
})
const endpointGroups = computed(() => {
  const groups = new Map<string, EndpointDocument[]>()
  for (const endpoint of filteredEndpoints.value) {
    const entries = groups.get(endpoint.group) || []
    entries.push(endpoint)
    groups.set(endpoint.group, entries)
  }
  return Array.from(groups.entries()).map(([name, endpoints]) => ({ name, endpoints }))
})
const activeEndpoint = computed(() => system.value?.endpoints.find((endpoint) => endpoint.id === activeEndpointId.value))

watch(() => [route.params.audience, route.params.systemId, route.query.endpoint], () => {
  const requested = String(route.query.endpoint || '')
  const endpoints = system.value?.endpoints || []
  activeEndpointId.value = endpoints.some((endpoint) => endpoint.id === requested) ? requested : (endpoints[0]?.id || '')
}, { immediate: true })
watch(activeEndpointId, () => { exampleTab.value = 'http' })

async function selectEndpoint(endpointId: string) {
  activeEndpointId.value = endpointId
  catalogOpen.value = false
  await router.replace({ query: { ...route.query, endpoint: endpointId } })
  document.querySelector('.docs-main')?.scrollTo({ top: 0, behavior: 'smooth' })
}

function methodClass(endpoint: EndpointDocument) {
  return `method-badge method-${endpoint.method.toLowerCase()}`
}
</script>

<template>
  <div v-if="system" :class="['docs-shell', { embedded }]">
    <header v-if="!embedded" class="site-header docs-site-header">
      <router-link class="site-brand" to="/">
        <span class="site-brand-mark"><el-icon><Collection /></el-icon></span>
        <span><strong>开发者文档</strong><small>Developer Guides</small></span>
      </router-link>
      <router-link class="back-link" :to="{ name: 'systems', params: { audience } }"><el-icon><ArrowLeft /></el-icon>{{ audience === 'inner' ? 'Inner' : 'Open' }} 系统</router-link>
    </header>

    <div class="docs-workspace">
      <aside class="docs-sidebar">
        <router-link v-if="embedded" class="embedded-back-link" :to="{ name: 'systems', params: { audience }, query: { embedded: '1' } }">
          <el-icon><ArrowLeft /></el-icon><span>{{ audience === 'inner' ? 'Inner' : 'Open' }} 系统列表</span>
        </router-link>
        <div class="catalog-system">
          <span class="catalog-system-icon"><el-icon><Document /></el-icon></span>
          <div><strong>{{ system.name }}</strong><small>{{ system.version }} · {{ system.endpoints.length }} 个接口</small></div>
        </div>
        <el-input v-model="searchText" :prefix-icon="Search" clearable placeholder="搜索接口" aria-label="搜索接口" />
        <nav class="endpoint-catalog" aria-label="接口目录">
          <section v-for="group in endpointGroups" :key="group.name" class="catalog-group">
            <h2>{{ group.name }}</h2>
            <button v-for="endpoint in group.endpoints" :key="endpoint.id" :class="{ active: activeEndpointId === endpoint.id }" @click="selectEndpoint(endpoint.id)">
              <span :class="methodClass(endpoint)">{{ endpoint.method }}</span><span>{{ endpoint.title }}</span>
            </button>
          </section>
          <el-empty v-if="endpointGroups.length === 0" :image-size="54" description="没有匹配的接口" />
        </nav>
      </aside>

      <el-drawer v-model="catalogOpen" direction="ltr" :with-header="false" size="290px" class="catalog-drawer">
        <aside class="docs-sidebar drawer-catalog">
          <div class="drawer-heading"><strong>接口目录</strong><el-button text :icon="Fold" aria-label="关闭目录" @click="catalogOpen = false" /></div>
          <router-link v-if="embedded" class="embedded-back-link" :to="{ name: 'systems', params: { audience }, query: { embedded: '1' } }">
            <el-icon><ArrowLeft /></el-icon><span>{{ audience === 'inner' ? 'Inner' : 'Open' }} 系统列表</span>
          </router-link>
          <el-input v-model="searchText" :prefix-icon="Search" clearable placeholder="搜索接口" />
          <nav class="endpoint-catalog">
            <section v-for="group in endpointGroups" :key="group.name" class="catalog-group">
              <h2>{{ group.name }}</h2>
              <button v-for="endpoint in group.endpoints" :key="endpoint.id" :class="{ active: activeEndpointId === endpoint.id }" @click="selectEndpoint(endpoint.id)">
                <span :class="methodClass(endpoint)">{{ endpoint.method }}</span><span>{{ endpoint.title }}</span>
              </button>
            </section>
          </nav>
        </aside>
      </el-drawer>

      <main class="docs-main">
        <div class="mobile-docs-bar"><el-button :icon="MenuIcon" @click="catalogOpen = true">接口目录</el-button><span>{{ system.name }}</span></div>
        <article v-if="activeEndpoint" class="endpoint-document">
          <header class="endpoint-heading">
            <div class="endpoint-route"><span :class="methodClass(activeEndpoint)">{{ activeEndpoint.method }}</span><code>{{ activeEndpoint.path }}</code></div>
            <h1>{{ activeEndpoint.title }}</h1>
            <p>{{ activeEndpoint.summary }}</p>
          </header>

          <section class="doc-section">
            <div class="section-title"><span>01</span><h2>注意事项</h2></div>
            <div class="notice-grid"><div v-for="notice in activeEndpoint.notices" :key="notice.label" class="notice-item"><strong>{{ notice.label }}</strong><p>{{ notice.value }}</p></div></div>
            <div class="prerequisites"><strong>前提条件</strong><ul><li v-for="item in activeEndpoint.prerequisites" :key="item">{{ item }}</li></ul></div>
          </section>

          <section class="doc-section">
            <div class="section-title"><span>02</span><h2>请求说明</h2></div>
            <div class="request-summary">
              <div><small>请求方式</small><strong>{{ activeEndpoint.method }}</strong></div>
              <div><small>请求地址</small><code>{{ system.baseUrl }}{{ activeEndpoint.path }}</code></div>
              <div><small>权限要求</small><strong>{{ activeEndpoint.permissionRequirement }}</strong></div>
            </div>
          </section>

          <section class="doc-section">
            <div class="section-title"><span>03</span><h2>请求参数</h2></div>
            <div v-if="activeEndpoint.requestFields.length" class="table-scroll"><table class="docs-table">
              <thead><tr><th>参数</th><th>位置</th><th>类型</th><th>必填</th><th>说明</th><th>示例</th></tr></thead>
              <tbody><tr v-for="field in activeEndpoint.requestFields" :key="`${field.location}-${field.name}`">
                <td><code>{{ field.name }}</code></td><td>{{ field.location }}</td><td>{{ field.type }}</td><td><el-tag :type="field.required ? 'danger' : 'info'" size="small" effect="plain">{{ field.required ? '是' : '否' }}</el-tag></td><td>{{ field.description }}</td><td><code v-if="field.example">{{ field.example }}</code><span v-else>-</span></td>
              </tr></tbody>
            </table></div>
            <div v-else class="empty-definition">该接口没有请求参数</div>
          </section>

          <section class="doc-section">
            <div class="section-title"><span>04</span><h2>响应值</h2></div>
            <div class="table-scroll"><table class="docs-table">
              <thead><tr><th>字段</th><th>类型</th><th>必返</th><th>说明</th><th>示例</th></tr></thead>
              <tbody><tr v-for="field in activeEndpoint.responseFields" :key="field.name">
                <td><code>{{ field.name }}</code></td><td>{{ field.type }}</td><td>{{ field.required ? '是' : '否' }}</td><td>{{ field.description }}</td><td><code v-if="field.example">{{ field.example }}</code><span v-else>-</span></td>
              </tr></tbody>
            </table></div>
          </section>

          <section class="doc-section">
            <div class="section-title"><span>05</span><h2>错误码</h2></div>
            <div v-if="activeEndpoint.errors.length" class="table-scroll"><table class="docs-table error-table">
              <thead><tr><th>HTTP 状态</th><th>错误码</th><th>说明</th><th>处理建议</th></tr></thead>
              <tbody><tr v-for="error in activeEndpoint.errors" :key="`${error.httpStatus}-${error.code}`"><td>{{ error.httpStatus }}</td><td><code>{{ error.code }}</code></td><td>{{ error.description }}</td><td>{{ error.resolution }}</td></tr></tbody>
            </table></div>
            <div v-else class="empty-definition">该接口未定义业务错误码</div>
          </section>

          <section class="doc-section">
            <div class="section-title"><span>06</span><h2>请求示例</h2></div>
            <el-tabs v-model="exampleTab" class="example-tabs">
              <el-tab-pane v-for="(example, key) in activeEndpoint.examples" :key="key" :label="example.label" :name="key"><CodeBlock :code="example.code" :language="example.language" /></el-tab-pane>
            </el-tabs>
          </section>

          <section class="doc-section response-example-section">
            <div class="section-title"><span>07</span><h2>返回示例</h2></div>
            <CodeBlock :code="activeEndpoint.responseExample" language="json" />
          </section>
        </article>
      </main>
    </div>
  </div>

  <el-result v-else icon="warning" title="文档不存在" sub-title="该业务系统尚未注册接口文档">
    <template #extra><el-button type="primary" :icon="Link" @click="$router.push({ name: 'systems', params: { audience } })">返回系统列表</el-button></template>
  </el-result>
</template>
