<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, watch, computed } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { getSceneItems as getMockItems } from '@/mock/sceneMock.js'  // ← mock 数据源

/* ---------- Props / Emits ---------- */
type SceneItem = {
  id: string | number
  name: string
  model: string
  x: number              // 像素 X（贴图上）
  y: number              // 像素 Y（贴图上）
  z?: number             // ★ 高度（世界单位；默认为 0）
  status?: 'Fault' | 'Warning' | 'Normal'
  size?: number
  rotY?: number
  scale?: number
  [key: string]: any
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
const world = { W: 1600, H: 1200 }

/* 拾取 */
const raycaster = new THREE.Raycaster()
const mouseNDC  = new THREE.Vector2()
const clickable = new THREE.Group()



/* ★ 新增：模型实例索引 & 弹框样式 */
const idToObj = new Map<string | number, THREE.Object3D>()
const modelPopStyle = ref<Record<string,string>>({ display:'none' })


/* 模型全局放大倍率（再叠加每个 item.size/scale） */
const MODEL_SCALE_MULT = 3

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




/** 取对象的“顶部锚点”世界坐标：包围盒顶部再上抬 10 */
function getAnchorWorldPosition(obj: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(obj)
  const center = box.getCenter(new THREE.Vector3())
  return new THREE.Vector3(center.x, box.max.y + 10, center.z)
}

/** 更新信息框屏幕位置（选中对象存在时计算） */
function updateModelPop() {
  if (!selected.value || !renderer || !camera) {
    modelPopStyle.value = { display: 'none' }
    return
  }
  const obj = idToObj.get(selected.value.id)
  if (!obj) { modelPopStyle.value = { display:'none' }; return }

  const world = getAnchorWorldPosition(obj)
  const v = world.clone().project(camera)

  // 在屏幕外或背面就隐藏
  if (v.z < -1 || v.z > 1) { modelPopStyle.value = { display:'none' }; return }

  const rect = renderer.domElement.getBoundingClientRect()
  const x = (v.x * 0.5 + 0.5) * rect.width
  const y = (-v.y * 0.5 + 0.5) * rect.height

  modelPopStyle.value = {
    display: 'block',
    left: `${x}px`,
    top: `${y}px`,
    transform: 'translate(-50%, -110%)', // 居中并在上方一点
  }
}

/** 额外字段（自动展示） */
const HIDE_FIELDS = new Set(['id','name','model','x','y','z','status','size','rotY','scale'])
const extraFields = computed<[string, any][]>(() => {
  if (!selected.value) return []
  const entries = Object.entries(selected.value as Record<string, any>)
  return entries.filter(([k]) => !HIDE_FIELDS.has(k))
})


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
    const url = props.mapTextureUrl || pubUrl('assets/maps/map-2.jpg')
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
  // ★ 期望的重复次数（横向×纵向），这里是“只扩展 4 次”
  const REP_X = 4
  const REP_Y = 4

// 地面实际大小 = 原图大小 × 重复次数（保持比例，不拉伸）
  const PLANE_W = world.W * REP_X
  const PLANE_H = world.H * REP_Y

// 镜像重复，重复次数固定为 4×4，并把中央一块对齐到世界原点
  gtex.wrapS = gtex.wrapT = THREE.MirroredRepeatWrapping
  gtex.repeat.set(REP_X, REP_Y)
  gtex.anisotropy = renderer.capabilities.getMaxAnisotropy()
  gtex.offset.set(-0.5 * REP_X + 0.5, -0.5 * REP_Y + 0.5)

// 平面几何用“精确宽高”，不会无限扩展
  const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(PLANE_W, PLANE_H),
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
    inst.position.copy(pxToWorldXZ({ x: it.x, y: it.y }, it.z ?? 0))
    if (typeof it.rotY === 'number') inst.rotation.y = THREE.MathUtils.degToRad(it.rotY)
    ;(inst as any).__meta = it
    clickable.add(inst)
    idToObj.set(it.id, inst) // ★ 登记：选中后根据 id 找到实例

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

  renderer.domElement.style.touchAction = 'none' // 防止移动端触摸滚动干扰

  renderer.domElement.addEventListener('pointerdown', onPointerDown, { capture: true })
  renderer.domElement.addEventListener('pointerup', (e: PointerEvent) => {
    if (!downPos) return
    const dx = e.clientX - downPos.x
    const dy = e.clientY - downPos.y
    downPos = null
    if (Math.hypot(dx, dy) <= DRAG_EPS) {
      handlePick(e)  // 只有“几乎没拖拽”才认定为点击
    }
  }, { capture: true })

  // 事件
  ro = new ResizeObserver(() => forceResize())
  ro.observe(wrapRef.value!)

  // 渲染循环
  const loop = () => {
    controls.update()
    renderer.render(scene, camera)
    updateModelPop() // ★ 每帧更新，让弹框跟随
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
  idToObj.clear()              // ★
  modelPopStyle.value = {display:'none'}  // ★
}

/* ---------- 交互 ---------- */
function onPointerDown(e: PointerEvent) {
  downPos = { x: e.clientX, y: e.clientY }
}



let downPos: {x:number;y:number} | null = null
const DRAG_EPS = 5  // 判定为点击的最大拖拽距离（像素）

function handlePick(e: PointerEvent | MouseEvent) {
  const rect = renderer.domElement.getBoundingClientRect()
  const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
  const y = -((e.clientY - rect.top)  / rect.height) * 2 + 1
  mouseNDC.set(x, y)

  camera.updateMatrixWorld()
  raycaster.setFromCamera(mouseNDC, camera)
  const hits = raycaster.intersectObjects(clickable.children, true)

  if (hits.length) {
    console.log('hits', hits.length)
    let obj: THREE.Object3D | null = hits[0].object
    while (obj && !(obj as any).__meta) obj = obj.parent
    if (obj) {
      const meta = (obj as any).__meta as SceneItem
      selected.value = meta
      emit('select', meta)
      updateModelPop()
    }
  } else {
    console.log('not hits', hits.length)
    // ★ 点空白：关闭弹框与选中态
    selected.value = null
    modelPopStyle.value = { display: 'none' }
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
    <!-- ★ 模型处的信息框（跟随 3D 位置） -->
    <div v-if="selected" class="model-pop" :style="modelPopStyle">
      <div class="mp-head">
        <span class="mp-name" :title="selected.name">{{ selected.name }}</span>
        <span class="mp-badge" :class="selected.status?.toLowerCase() || 'normal'">
      {{ selected.status || 'Normal' }}
    </span>
        <span class="mp-close" @click="selected=null">×</span>
      </div>
      <div class="mp-body">
        <div class="mp-row"><label>坐标</label><span>{{ selected.x }}, {{ selected.y }}, z={{ selected.z ?? 0 }}</span></div>
        <div class="mp-row"><label>型号</label><span>{{ selected.model }}</span></div>
        <!-- 自动展示 mock 里的额外字段 -->
        <div class="mp-row" v-for="[k,v] in extraFields" :key="k">
          <label>{{ k }}</label><span>{{ Array.isArray(v) ? v.join(', ') : (typeof v==='object' ? JSON.stringify(v) : v) }}</span>
        </div>

        <div class="mp-actions">
          <el-button size="small" type="primary" @click="$emit('enter', selected!)">查看详情</el-button>
        </div>
      </div>
      <div class="mp-arrow"></div>
    </div>

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

.model-pop{
  position:absolute;
  z-index: 10;
  min-width: 240px;
  max-width: 320px;
  background: rgba(17,20,26,.94);
  color:#e6e6e6;
  border:1px solid rgba(255,255,255,.12);
  border-radius:10px;
  box-shadow: 0 8px 24px rgba(0,0,0,.35);
  backdrop-filter: blur(6px);
  padding: 10px 10px 12px 10px;
  /* 关键：不拦截底下画布的点击 */
  pointer-events: none;
}
.model-pop .mp-close,
.model-pop .mp-actions { pointer-events: auto; } /* 这些区域照常可点 */

</style>
