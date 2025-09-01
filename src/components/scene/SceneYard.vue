<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, watch, computed } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { getSceneItems as getMockItems } from '@/mock/sceneMock'  // ← mock 数据源

/* ---------- Props / Emits ---------- */
type SceneItem = {
  id: string | number
  name: string
  model: string          // ← 模型名（pump/tank/...）
  x: number              // ← 在地图/贴图上的 x（像素）
  y: number              // ← 在地图/贴图上的 y（像素）
  status?: 'Fault' | 'Warning' | 'Normal'
  size?: number          // ← 相对尺寸（1 为默认）
  rotY?: number          // ← 绕 Y 轴旋转（度）
  scale?: number         // ← 额外缩放倍率
}

const props = defineProps<{
  /** 若不传 items，则组件自动从 mock 读取 */
  items?: SceneItem[] | null
  /** 覆盖地面贴图（不传则默认 /assets/maps/base.png 或网格） */
  mapTextureUrl?: string
  /** 容器高度（如果父容器不给高度，可用它） */
  height?: string
  /** 曝光（整体亮度） */
  exposure?: number
  /** 是否显示内置信息卡 */
  showInfo?: boolean
}>()

const emit = defineEmits<{
  /** 选中某个装置/热点时发出 */
  (e: 'select', item: SceneItem): void
  /** 点击“查看详情” */
  (e: 'enter', item: SceneItem): void
}>()

/* ---------- DOM & 状态 ---------- */
const wrapRef   = ref<HTMLDivElement | null>(null)
const selected  = ref<SceneItem | null>(null)
const itemsData = ref<SceneItem[]>([])

let renderer: THREE.WebGLRenderer
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let controls: OrbitControls
let ro: ResizeObserver
let raf = 0

/* 世界地面宽高（加载地面贴图后会替换为真实像素） */
const world = { W: 1600, H: 900 }

/* 拾取 */
const raycaster = new THREE.Raycaster()
const mouseNDC  = new THREE.Vector2()
const clickable = new THREE.Group()

/* 模型全局放大倍率（再叠加每个 item.size/scale） */
const MODEL_SCALE_MULT = 20

/* 固定的模型根目录 + 模型名映射（可按需补充/替换） */
function pubUrl(rel: string) {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '')
  return `${base}/${rel.replace(/^\/+/, '')}`
}
const MODEL_BASE = 'assets/models/'

/* 模型缓存（按 key） */
const modelCache = new Map<string, THREE.Object3D>()

const statusColor = (s:string|undefined) =>
    s === 'Fault' ? 0xef4444 : s === 'Warning' ? 0xf59e0b : 0x10b981


async function getModelByName(name: string): Promise<THREE.Object3D> {
  // 名称为空 → 占位
  if (!name) return makePlaceholder(0x8888ff, 80)
  // 缓存命中
  if (modelCache.has(name)) return modelCache.get(name)!.clone(true)

  const folder = pubUrl(`${MODEL_BASE}${name}/`)
  const loader = new GLTFLoader()
  loader.setPath(folder)
  loader.setResourcePath(folder)

  // 依次尝试的文件名（满足“模型名=目录名”的约定）
  const candidates = ['scene.gltf', `${name}.gltf`, 'index.gltf']

  for (const file of candidates) {
    try {
      const scene = await new Promise<THREE.Object3D>((resolve, reject) => {
        loader.load(file, g => resolve(g.scene), undefined, reject)
      })
      modelCache.set(name, scene)
      return scene.clone(true)
    } catch {
      // 失败就试下一个
    }
  }

  console.warn('[Model] not found:', name, 'in', folder)
  const ph = makePlaceholder(0x8888ff, 80)
  modelCache.set(name, ph)
  return ph.clone(true)
}

/* ---------- 小工具 ---------- */
function makeGridTexture(size = 1024, step = 64) {
  const cvs = document.createElement('canvas')
  cvs.width = cvs.height = size
  const ctx = cvs.getContext('2d')!
  ctx.fillStyle = '#0b0f14'
  ctx.fillRect(0, 0, size, size)
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'
  for (let x=0; x<=size; x+=step) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,size); ctx.stroke() }
  for (let y=0; y<=size; y+=step) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(size,y); ctx.stroke() }
  const tex = new THREE.CanvasTexture(cvs)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}
function makeSkyTexture(size = 1024, top = '#5FB3FF', bottom = '#AEE3FF') {
  const c = document.createElement('canvas'); c.width = 1; c.height = size
  const g = c.getContext('2d')!
  const grd = g.createLinearGradient(0,0,0,size)
  grd.addColorStop(0, top)
  grd.addColorStop(1, bottom)
  g.fillStyle = grd; g.fillRect(0,0,1,size)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}
function pxToWorldXZ(p:{x:number;y:number}, y=0) {
  return new THREE.Vector3(p.x - world.W/2, y, -(p.y - world.H/2))
}
function normalizeScale(root: THREE.Object3D, targetSize=80) {
  const box = new THREE.Box3().setFromObject(root)
  const size = box.getSize(new THREE.Vector3())
  const s = targetSize / Math.max(size.x, size.y, size.z || 1)
  root.scale.multiplyScalar(s)
  box.setFromObject(root)
  const center = box.getCenter(new THREE.Vector3())
  root.position.sub(new THREE.Vector3(center.x, box.min.y, center.z))
}
function makePlaceholder(color=0xff4444, size=80) {
  const g = new THREE.Group()
  const cone = new THREE.Mesh(
      new THREE.ConeGeometry(18,40,18),
      new THREE.MeshBasicMaterial({ color, wireframe:true })
  )
  cone.position.y = 40 * .5 + 20
  const cyl = new THREE.Mesh(
      new THREE.CylinderGeometry(8,8,20,16,1,true),
      new THREE.MeshBasicMaterial({ color, wireframe:true })
  )
  cyl.position.y = 10
  g.add(cyl, cone)
  normalizeScale(g, size)
  return g
}
function placeCameraToSeeGround(margin=1.15) {
  const radius = Math.hypot(world.W/2, world.H/2)
  const fov = THREE.MathUtils.degToRad(camera.fov)
  const dist = radius / Math.tan(fov/2) * margin
  camera.position.set(0, dist*0.6, dist)
  camera.lookAt(0,0,0)
  controls.target.set(0,0,0)
  controls.update()
}

/* ---------- 资源加载 ---------- */
async function loadGroundTexture() {
  try {
    const url = props.mapTextureUrl || pubUrl('assets/maps/base.png')
    const tex = await new THREE.TextureLoader().loadAsync(url)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  } catch {
    return makeGridTexture()
  }
}
async function getItems() {
  return props.items && props.items.length ? props.items : await getMockItems()
}
/* ---------- 初始化 / 销毁 ---------- */
function forceResize() {
  const el = wrapRef.value!
  const rect = el.getBoundingClientRect()
  let w = Math.floor(rect.width)
  let h = Math.floor(rect.height)
  if (w < 2 || h < 2) { w = window.innerWidth; h = window.innerHeight * 0.72 }
  renderer.setSize(w, h, false)
  camera.aspect = w / h
  camera.updateProjectionMatrix()
}

async function buildScene() {
  scene = new THREE.Scene()
  // scene.fog = new THREE.Fog(0xDFE9F6, 4000, 14000)

  camera = new THREE.PerspectiveCamera(55, 1, 0.1, 20000)
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.minDistance = 150
  controls.maxDistance = 8000
  controls.minPolarAngle = THREE.MathUtils.degToRad(10)
  controls.maxPolarAngle = THREE.MathUtils.degToRad(88)

  // 天空
  const sky = new THREE.Mesh(
      new THREE.SphereGeometry(8000, 48, 24),
      new THREE.MeshBasicMaterial({ map: makeSkyTexture(), side: THREE.BackSide })
  )
  scene.add(sky)

  // 光照
  const hemi = new THREE.HemisphereLight(0xEAF6FF, 0xBFDcff, 1.0)
  const amb  = new THREE.AmbientLight(0xffffff, 0.55)
  const dir  = new THREE.DirectionalLight(0xffffff, 1.2)
  dir.position.set(1500, 2200, 1200)
  scene.add(hemi, amb, dir)

  // 地面
  const gtex = await loadGroundTexture()
  const img = gtex.image as HTMLImageElement | HTMLCanvasElement
  if ((img as any)?.width && (img as any)?.height) {
    world.W = (img as any).width
    world.H = (img as any).height
  }
  const EXT = Math.max(world.W, world.H) * 6
  gtex.wrapS = gtex.wrapT = THREE.MirroredRepeatWrapping
  gtex.repeat.set(EXT / world.W, EXT / world.H)
  gtex.anisotropy = renderer.capabilities.getMaxAnisotropy()
  gtex.offset.set(-0.5 * gtex.repeat.x + 0.5, -0.5 * gtex.repeat.y + 0.5)

  const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(EXT, EXT),
      new THREE.MeshLambertMaterial({ map: gtex })
  )
  ground.rotation.x = -Math.PI / 2
  scene.add(ground)

  // 点击容器
  clickable.clear()
  scene.add(clickable)

  // 加载数据 + 实例化
  itemsData.value = await getItems()
  for (const it of itemsData.value) {
    const inst = await getModelByName(it.model)

    const targetSize = (it as any).targetSize ?? 100   // 支持后端可选传入
    const finalSize  = targetSize * MODEL_SCALE_MULT * (it.size ?? 1) * (it.scale ?? 1)

    normalizeScale(inst, finalSize)
    inst.position.copy(pxToWorldXZ({ x: it.x, y: it.y }, 0))
    if (typeof it.rotY === 'number') inst.rotation.y = THREE.MathUtils.degToRad(it.rotY)
    ;(inst as any).__meta = it
    clickable.add(inst)

    const halo = new THREE.Mesh(
        new THREE.CircleGeometry(18, 48),
        new THREE.MeshBasicMaterial({ color: statusColor(it.status), transparent: true, opacity: 0.28 })
    )
    halo.rotation.x = -Math.PI / 2
    halo.position.copy(inst.position).y = 0.02
    scene.add(halo)
  }


  await nextTick()
  forceResize()
  placeCameraToSeeGround(1.15)
}

async function init() {
  if (!wrapRef.value) return
  renderer = new THREE.WebGLRenderer({ antialias:true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = props.exposure ?? 1.35
  renderer.setClearColor(0xDFE9F6, 1)
  wrapRef.value.appendChild(renderer.domElement)

  await buildScene()

  // 事件
  renderer.domElement.addEventListener('pointerdown', onPointerDown)
  ro = new ResizeObserver(() => forceResize())
  ro.observe(wrapRef.value!)

  // 渲染循环
  const loop = () => {
    controls.update()
    renderer.render(scene, camera)
    raf = requestAnimationFrame(loop)
  }
  loop()
}

function dispose() {
  renderer?.domElement?.removeEventListener('pointerdown', onPointerDown)
  ro?.disconnect()
  cancelAnimationFrame(raf)
  controls?.dispose()
  renderer?.dispose?.()
}

/* ---------- 交互 ---------- */
function onPointerDown(e: PointerEvent) {
  const rect = renderer.domElement.getBoundingClientRect()
  mouseNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
  mouseNDC.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1
  raycaster.setFromCamera(mouseNDC, camera)
  const hits = raycaster.intersectObjects(clickable.children, true)
  if (hits.length) {
    let obj: THREE.Object3D | null = hits[0].object
    while (obj && !(obj as any).__meta) obj = obj.parent
    if (obj) {
      const meta = (obj as any).__meta as SceneItem
      selected.value = meta
      emit('select', meta)
    }
  }
}

/* ---------- 生命周期 / 监听 ---------- */
onMounted(init)
onBeforeUnmount(dispose)

watch(() => props.items, async () => {
  // 外部 items 变化时重建（轻量处理：重新 buildScene）
  if (!renderer) return
  // 清理上一次
  cancelAnimationFrame(raf)
  scene?.clear()
  await buildScene()
  const loop = () => { controls.update(); renderer.render(scene, camera); raf = requestAnimationFrame(loop) }
  loop()
})

const rootStyle = computed(() => ({
  height: props.height || '92vh'
}))
</script>

<template>
  <div class="scene-root" :style="rootStyle">
    <div ref="wrapRef" class="abs-fill"></div>

    <div v-if="showInfo !== false && selected" class="info-card">
      <div class="title">
        <div class="name" :title="selected?.name">{{ selected?.name }}</div>
        <span class="badge">
          <i class="dot"
             :style="{ background: selected?.status==='Fault'?'#EF4444':selected?.status==='Warning'?'#F59E0B':'#10B981' }"></i>
          {{ selected?.status || 'Normal' }}
        </span>
      </div>
      <div class="sub">位置：{{ selected?.x }}, {{ selected?.y }}</div>
      <div class="actions">
        <el-button size="small" type="primary" @click="$emit('enter', selected!)">查看详情</el-button>
        <el-button size="small" @click="selected=null">关闭</el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scene-root{
  position: relative;
  width: 100%;
  min-height: 520px;
  border-radius: 10px;
  overflow: hidden;
}
.abs-fill{ position:absolute; inset:0; }
.info-card{
  position: absolute;
  right: 12px; bottom: 12px;
  width: 280px;
  padding: 12px;
  border-radius: 10px;
  background: rgba(17, 20, 26, .88);
  color: #ddd;
  border: 1px solid rgba(255,255,255,.12);
  backdrop-filter: blur(6px);
  font-size: 12px;
}
.info-card .title{ display:flex; align-items:center; justify-content:space-between; gap:8px; }
.info-card .name{ font-weight: 600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.info-card .badge{ display:inline-flex; align-items:center; gap:6px; padding:2px 8px; border-radius:999px; font-size:11px; background:#0002; color:#fff; }
.info-card .dot{ width:8px; height:8px; border-radius:999px; display:inline-block; }
.info-card .sub{ opacity:.75; margin-top:6px; }
.info-card .actions{ margin-top:10px; display:flex; gap:8px; }
:deep(canvas){ display:block; width:100%; height:100%; outline:none; }
</style>
