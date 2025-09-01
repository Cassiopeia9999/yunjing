<template>
  <div
      class="rounded-xl p-4 transition-all"
      :class="[
      bordered ? 'border' : 'border border-transparent',
      hoverable ? 'hover:-translate-y-0.5 hover:shadow-lg' : '',
      toneClass.border,
      toneClass.bg
    ]"
      :style="inlineStyle"
  >
    <!-- 标签（可被 slot:label 覆盖） -->
    <div class="text-sm font-medium mb-1" :class="labelClass">
      <slot name="label">
        {{ label }}
        <span v-if="sublabel" class="opacity-80">（{{ sublabel }}）</span>
      </slot>
    </div>

    <!-- 数值（可被 slot:value 覆盖） -->
    <div
        class="font-bold leading-tight break-all"
        :class="[large ? 'text-4xl lg:text-5xl' : 'text-3xl lg:text-4xl', toneClass.text]"
    >
      <slot name="value">
        {{ formatValue(value) }}
        <span v-if="unit" class="ml-1 text-base lg:text-lg align-baseline opacity-90">{{ unit }}</span>
      </slot>
    </div>

    <!-- 底部补充（可选） -->
    <div v-if="$slots.footer" class="mt-2 text-xs opacity-80">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

/**
 * Props
 * - tone: 预置主题（indigo/emerald/rose/amber/sky/violet/cyan/lime）
 * - color: 自定义主色（#22d3ee / rgb(...) / hsl(...)），传了它将覆盖 tone 的配色
 */
const props = defineProps({
  label: { type: String, default: '' },
  sublabel: { type: String, default: '' },
  value: { type: [Number, String], default: null },
  unit: { type: String, default: '' },

  tone: { type: String, default: 'indigo' },
  color: { type: String, default: '' },        // 自定义主色（可空）

  large: { type: Boolean, default: false },
  hoverable: { type: Boolean, default: true },
  bordered: { type: Boolean, default: true },

  valueFormatter: { type: Function, default: null }
})

/** 预置主题色（暗/亮主题都 ok） */
const toneMap = {
  indigo: {
    border: 'border-indigo-200 dark:border-indigo-900',
    bg:     'bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/40 dark:to-neutral-900',
    text:   'text-indigo-600 dark:text-indigo-300',
    label:  'text-neutral-800 dark:text-neutral-100',
  },
  emerald: {
    border: 'border-emerald-200 dark:border-emerald-900',
    bg:     'bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/40 dark:to-neutral-900',
    text:   'text-emerald-600 dark:text-emerald-300',
    label:  'text-neutral-800 dark:text-neutral-100',
  },
  rose: {
    border: 'border-rose-200 dark:border-rose-900',
    bg:     'bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/40 dark:to-neutral-900',
    text:   'text-rose-600 dark:text-rose-300',
    label:  'text-neutral-800 dark:text-neutral-100',
  },
  amber: {
    border: 'border-amber-200 dark:border-amber-900',
    bg:     'bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/40 dark:to-neutral-900',
    text:   'text-amber-600 dark:text-amber-300',
    label:  'text-neutral-800 dark:text-neutral-100',
  },
  sky: {
    border: 'border-sky-200 dark:border-sky-900',
    bg:     'bg-gradient-to-br from-sky-50 to-white dark:from-sky-950/40 dark:to-neutral-900',
    text:   'text-sky-600 dark:text-sky-300',
    label:  'text-neutral-800 dark:text-neutral-100',
  },
  violet: {
    border: 'border-violet-200 dark:border-violet-900',
    bg:     'bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/40 dark:to-neutral-900',
    text:   'text-violet-600 dark:text-violet-300',
    label:  'text-neutral-800 dark:text-neutral-100',
  },
  cyan: {
    border: 'border-cyan-200 dark:border-cyan-900',
    bg:     'bg-gradient-to-br from-cyan-50 to-white dark:from-cyan-950/40 dark:to-neutral-900',
    text:   'text-cyan-600 dark:text-cyan-300',
    label:  'text-neutral-800 dark:text-neutral-100',
  },
  lime: {
    border: 'border-lime-200 dark:border-lime-900',
    bg:     'bg-gradient-to-br from-lime-50 to-white dark:from-lime-950/40 dark:to-neutral-900',
    text:   'text-lime-700 dark:text-lime-300',
    label:  'text-neutral-800 dark:text-neutral-100',
  },
}

const toneClass = computed(() => toneMap[props.tone] || toneMap.indigo)
const labelClass = computed(() => toneClass.value.label)

/** 自定义主色：用 CSS 变量覆盖边框/渐变/文字色（不依赖 Tailwind 预设） */
const inlineStyle = computed(() => {
  if (!props.color) return {}
  const c = props.color
  return {
    /* 渐变背景主色稍作偏移：浅一点用于 from，透明用于 to */
    '--kpi-main': c,
    background: `linear-gradient(135deg, color-mix(in srgb, var(--kpi-main) 12%, white) 0%, rgba(255,255,255,.92) 100%)`,
    borderColor: `color-mix(in srgb, var(--kpi-main) 35%, transparent)`,
    color: 'inherit'
  }
})

function formatValue(v) {
  if (props.valueFormatter) return props.valueFormatter(v)
  if (v == null || v === '') return '—'
  return typeof v === 'number' ? v.toLocaleString() : String(v)
}
</script>
