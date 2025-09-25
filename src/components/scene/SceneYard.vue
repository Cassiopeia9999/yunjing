<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, watch, computed } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { getSceneItems as getMockItems, normalizeSceneItems } from '@/mock/sceneMock.js'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route  = useRoute()

/* ---------- Props / Emits ---------- */
const props = defineProps<{
  /** 若不传 items，则组件自动从 mock 读取（字段名按后端定义） */
  items?: any[] | null
  mapTextureUrl?: string
  height?: string
  exposure?: number
  showInfo?: boolean
}>()

const emit = defineEmits<{
  (e: 'select', item: any): void
  (e: 'enter', item: any): void
}>()



// === 复用的临时对象，避免频繁 new ===
const _tmpV2 = new THREE.Vector2();
const _tmpV3a = new THREE.Vector3();
const _tmpV3b = new THREE.Vector3();
const _mat4   = new THREE.Matrix4();
const _quatXDown = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
const _scale1 = new THREE.Vector3(1,1,1);

// === 常量：地面平面（y=0）—— 点击拾取复用
const GROUND_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

// === 画布尺寸缓存（在 forceResize() 时更新；更新信息框/拾取用） ===
let _canvasRect: DOMRect | null = null;


/* ---------- DOM & 状态 ---------- */
const wrapRef   = ref<HTMLDivElement | null>(null)
const selected  = ref<any | null>(null)
const itemsData = ref<any[]>([])

let renderer: THREE.WebGLRenderer
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let controls: OrbitControls
let ro: ResizeObserver

// === 渲染调度：按需渲染一帧 ===
let raf = 0;
function renderOnce() {
  raf = 0;
  controls?.update();
  renderer?.render(scene, camera);
  updateModelPop();
}
function requestRender() {
  if (!raf) raf = requestAnimationFrame(renderOnce);
}


// === 顶部锚点缓存（最小侵入优化） ===
const anchorCache = new WeakMap<THREE.Object3D, THREE.Vector3>();

function buildAnchor(obj: THREE.Object3D) {
  // 只在实例创建后算一次包围盒和顶部点
  const box = new THREE.Box3().setFromObject(obj);
  const c = box.getCenter(new THREE.Vector3());
  const top = new THREE.Vector3(c.x, box.max.y + 10, c.z);
  anchorCache.set(obj, top);
  return top;
}

function getAnchor(obj: THREE.Object3D) {
  return anchorCache.get(obj) ?? buildAnchor(obj);
}

// === 点击坐标显示 ===
type ClickCoord = { px:number; py:number; wx:number; wy:number; wz:number }
const clickCoord = ref<ClickCoord | null>(null)
let coordTimer: number | null = null

function worldXZToPx(wx: number, wz: number){
  // 与 pxToWorldXZ 互逆：px = wx + W/2, py = -wz + H/2
  return { x: wx + world.W/2, y: -wz + world.H/2 }
}
function showClickCoord(p: ClickCoord){
  clickCoord.value = p
  if (coordTimer) { clearTimeout(coordTimer) }
  coordTimer = window.setTimeout(() => (clickCoord.value = null), 3500) // 3.5s自动隐藏
}

/* 世界地面宽高（加载地面贴图后会替换为真实像素） */
const world = { W: 1600, H: 1200 }

/* 拾取 */
const raycaster = new THREE.Raycaster()
const mouseNDC  = new THREE.Vector2()
const clickable = new THREE.Group()

/* 实例索引 & 弹框样式 */
const idToObj = new Map<string | number, THREE.Object3D>()
const modelPopStyle = ref<Record<string,string>>({ display:'none' })

/* 模型全局放大倍率（叠加 model_size） */
const MODEL_SCALE_MULT = 3

/* 资源根路径 */
function pubUrl(rel: string) {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '')
  return `${base}/${rel.replace(/^\/+/, '')}`
}
const MODEL_BASE = 'assets/models/'

/* 模型缓存 */
const modelCache = new Map<string, THREE.Object3D>()

/* 状态颜色（按后端 system_status） */
const statusColor = (s:string|undefined) => {
  const v = (s||'').toLowerCase()
  if (v === 'fault') return 0xef4444
  if (v === 'warning' || v === 'warn') return 0xf59e0b
  if (v === 'normal' || v === 'ok') return 0x10b981
  return 0x60a5fa
}



/** 更新信息框屏幕位置 */
function updateModelPop() {
  if (!selected.value || !renderer || !camera) {
    modelPopStyle.value = { display: 'none' }
    return
  }
  const obj = idToObj.get(selected.value.id)
  if (!obj) { modelPopStyle.value = { display:'none' }; return }

  const wp = getAnchor(obj) // 已缓存的顶点
  const v = _tmpV3a.copy(wp).project(camera) // ✅ 复用 Vector3

  if (v.z < -1 || v.z > 1) { modelPopStyle.value = { display:'none' }; return }

  // ✅ 使用缓存的 rect（若为空再读一次）
  const rect = _canvasRect || renderer.domElement.getBoundingClientRect()
  const x = (v.x * 0.5 + 0.5) * rect.width
  const y = (-v.y * 0.5 + 0.5) * rect.height

  const MARGIN = 14, POP_W = 300
  let left = x, translateX = '-50%'
  if (x < MARGIN + POP_W * 0.5) { left = Math.max(MARGIN, x); translateX = '0%' }
  else if (x > rect.width - (MARGIN + POP_W * 0.5)) { left = Math.min(rect.width - MARGIN, x); translateX = '-100%' }

  modelPopStyle.value = { display:'block', left:`${left}px`, top:`${y}px`, transform:`translate(${translateX}, -110%)` }
}



/** 弹窗字段白名单（只显示这些，按顺序渲染；可根据你后端字段自行调整） */
// 仅保留业务关键信息（去掉：system_photo / documents / model_name）
const POP_FIELDS: PopField[] = [
  { key:'system_code',        label:'系统编码' },
  { key:'manufacturer',       label:'制造厂商' },
  { key:'install_date',       label:'安装日期',   fmt: v => fmtDate(v) },
  { key:'confidence_level',   label:'置信度',     fmt: v => fmtPct(v) },
  { key:'remaining_life',     label:'剩余寿命',   fmt: v => fmtNum(v,'天',0) },
  { key:'sailing_speed',      label:'航行速度',   fmt: v => fmtNum(v,'节') }
 ]

const extraFields = computed<[string, any][]>(() => {
  if (!selected.value) return []
  return POP_FIELDS
      .map(f => [f.label ?? f.key, (selected.value as any)[f.key]] as [string, any])
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
})
// 简单格式化工具
function fmtPct(v:any){
  if (v==null || v==='') return ''
  const n = Number(v); if (Number.isNaN(n)) return String(v)
  const d = (Math.abs(n)%1>0) ? 1 : 0
  return `${n.toFixed(d)}%`
}
function fmtNum(v:any, unit='', fixed?:number){
  if (v==null || v==='') return ''
  const n = Number(v); if (Number.isNaN(n)) return unit ? `${v} ${unit}` : String(v)
  const s = (fixed!=null) ? n.toFixed(fixed) : `${n}`
  return unit ? `${s} ${unit}` : s
}
function fmtDate(v:any){
  if (!v) return ''
  const d = new Date(v); if (isNaN(+d)) return String(v)
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), dd = String(d.getDate()).padStart(2,'0')
  return `${y}-${m}-${dd}`
}

function goUnitFromSelected() {
  const sel  = selected.value as any
  const unit = sel?.unit ?? sel

  const uid = unit?.id
  const bid = sel?.parent_site?.value ?? (route.params as any).baseId

  if (!uid || !bid) {
    console.error('[goUnitFromSelected] 缺少必要参数', { uid, bid, sel })
    return
  }

  router.push({
    name: 'ManageSysView',
    params: { baseId: String(bid), unitId: String(uid) }
  })
}


/* ---------- 资源加载 / 工具 ---------- */
async function getModelByName(name?: string): Promise<THREE.Object3D> {
  const model = (name || '').trim()
  if (!model) return makePlaceholder(0x8888ff, 80)
  if (modelCache.has(model)) return modelCache.get(model)!.clone(true)

  const folder = pubUrl(`${MODEL_BASE}${model}/`)
  const loader = new GLTFLoader()
  loader.setPath(folder)
  loader.setResourcePath(folder)

  const candidates = ['scene.gltf', `${model}.gltf`, 'index.gltf']
  for (const file of candidates) {
    try {
      const root = await new Promise<THREE.Object3D>((resolve, reject) => {
        loader.load(file, g => resolve(g.scene), undefined, reject)
      })
      modelCache.set(model, root)
      return root.clone(true)
    } catch { /* try next */ }
  }
  console.warn('[Model] not found:', model, 'in', folder)
  const ph = makePlaceholder(0x8888ff, 80)
  modelCache.set(model, ph)
  return ph.clone(true)
}

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
  grd.addColorStop(0, top); grd.addColorStop(1, bottom)
  g.fillStyle = grd; g.fillRect(0,0,1,size)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}
function pxToWorldXZ(p:{x:number;y:number}, y=0) {
  return new THREE.Vector3(p.x - world.W/2, y, -(p.y - world.H/2))
}
function normalizeScale(root: THREE.Object3D, targetSize = 80) {
  const box = new THREE.Box3().setFromObject(root)
  const size = box.getSize(new THREE.Vector3())
  const s = targetSize / Math.max(size.x, size.y, size.z || 1)
  root.scale.multiplyScalar(s)
  box.setFromObject(root)
  const center = box.getCenter(new THREE.Vector3())
  root.position.sub(new THREE.Vector3(center.x, box.min.y, center.z))
}
function makePlaceholder(color = 0xff4444, size = 80) {
  const g = new THREE.Group()
  const cone = new THREE.Mesh(
      new THREE.ConeGeometry(18, 40, 18),
      new THREE.MeshBasicMaterial({ color, wireframe: true })
  )
  cone.position.y = 40 * 0.5 + 20
  const cyl = new THREE.Mesh(
      new THREE.CylinderGeometry(8, 8, 20, 16, 1, true),
      new THREE.MeshBasicMaterial({ color, wireframe: true })
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
// === 新增：让相机针对单个模型“最合适视野” ===
function fitCameraToObject(obj: THREE.Object3D, margin = 1.6) {
  const box = new THREE.Box3().setFromObject(obj)
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())

  // 同时满足垂直/水平 FOV
  const vFOV = THREE.MathUtils.degToRad(camera.fov)
  const hFOV = 2 * Math.atan(Math.tan(vFOV / 2) * camera.aspect)
  const distV = (size.y / 2) / Math.tan(vFOV / 2)
  const distH = (size.x / 2) / Math.tan(hFOV / 2)
  const dist  = Math.max(distV, distH) * margin + size.z * 0.5

  // 以一个轻微俯视方向看向目标
  const dir = new THREE.Vector3(1, 0.55, 1).normalize()
  camera.position.copy(center.clone().add(dir.multiplyScalar(dist)))
  controls.target.copy(center)
  controls.update()
}

// === 新增：选择一个要对准的模型（优先告警/故障） ===
function pickFocusObject(): THREE.Object3D | null {
  const firstAbn = itemsData.value.find(i => (i.system_status || '').toLowerCase() !== 'normal')
  const chosen   = firstAbn || itemsData.value[0]
  return chosen ? (idToObj.get(chosen.id) || null) : null
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
  const raw = (props.items && props.items.length) ? props.items : await getMockItems()
  // 允许 mock 或后端字段做一次归一化，产出后端风格字段
  return normalizeSceneItems ? normalizeSceneItems(raw) : raw
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

  // ✅ 缓存画布 rect
  _canvasRect = renderer.domElement.getBoundingClientRect()

  requestRender();
}


async function buildScene() {
  // 预建一次圆环几何与材质
  const haloGeo = new THREE.CircleGeometry(18, 48);

  scene = new THREE.Scene()
  scene.background = makeSkyTexture(); // ✅ 用背景纹理替代天空网格

  camera = new THREE.PerspectiveCamera(55, 1, 0.1, 20000)
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.minDistance = 150
  controls.maxDistance = 8000
  controls.minPolarAngle = THREE.MathUtils.degToRad(10)
  controls.maxPolarAngle = THREE.MathUtils.degToRad(88)

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
  const REP_X = 2, REP_Y = 2
  const PLANE_W = world.W * REP_X
  const PLANE_H = world.H * REP_Y

  gtex.wrapS = gtex.wrapT = THREE.MirroredRepeatWrapping
  gtex.repeat.set(REP_X, REP_Y)
  gtex.anisotropy = renderer.capabilities.getMaxAnisotropy()
  gtex.offset.set(-0.5 * REP_X + 0.5, -0.5 * REP_Y + 0.5)

  const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(PLANE_W, PLANE_H),
      new THREE.MeshLambertMaterial({ map: gtex })
  )
  ground.rotation.x = -Math.PI / 2
  scene.add(ground)

  // 点击容器
  clickable.clear()
  scene.add(clickable)

  // 数据
  itemsData.value = await getItems()

  // ✅ 1 个 InstancedMesh 承载所有 halo（减少 N 次 draw call）
  const haloMat = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0.28,
    depthWrite: false, // 避免写深度造成后续遮挡
    vertexColors: true // 每实例单独颜色
  });
  const halos = new THREE.InstancedMesh(haloGeo, haloMat, itemsData.value.length);
  halos.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  halos.renderOrder = -1;
  if ((halos as any).instanceColor === null) {
    // three r150+ 默认才有 instanceColor；如未开启可用 setColorAt 仍生效
  }
  scene.add(halos);

  const _pos = _tmpV3b; // 复用
  const _color = new THREE.Color();

  let idx = 0;
  for (const it of itemsData.value) {
    const inst = await getModelByName(it.model_name)

    const targetSize = (typeof it.model_size === 'number') ? it.model_size : 100
    const finalSize  = targetSize * MODEL_SCALE_MULT

    normalizeScale(inst, finalSize)
    inst.position.copy(pxToWorldXZ({ x: it.x, y: it.y }, it.z ?? 0))
    if (typeof it.rot_y === 'number') inst.rotation.y = THREE.MathUtils.degToRad(it.rot_y)
    ;(inst as any).__meta = it
    clickable.add(inst)
    idToObj.set(it.id, inst)

    // ✅ 锚点缓存（信息框定位用）
    buildAnchor(inst)

    // ✅ 写入 halo 的实例矩阵 + 颜色
    _pos.copy(inst.position).setY(0.02)
    _mat4.compose(_pos, _quatXDown, _scale1)
    halos.setMatrixAt(idx, _mat4)
    _color.set(statusColor(it.system_status))
    halos.setColorAt(idx, _color)
    idx++
  }
  halos.instanceMatrix.needsUpdate = true
  if (halos.instanceColor) halos.instanceColor.needsUpdate = true

  await nextTick()
  forceResize()
  const focus = pickFocusObject()
  if (focus) {
    fitCameraToObject(focus, 1.8)
  } else {
    placeCameraToSeeGround(1.1)
  }
  requestRender();
}


async function init() {
  if (!wrapRef.value) return
  renderer = new THREE.WebGLRenderer({ antialias:true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75)) // 或 1.5
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = props.exposure ?? 1.35
  renderer.setClearColor(0xDFE9F6, 1)
  wrapRef.value.appendChild(renderer.domElement)

  await buildScene()

  renderer.domElement.style.touchAction = 'none'

  renderer.domElement.addEventListener('pointerdown', onPointerDown, { capture: true })
  renderer.domElement.addEventListener('pointerup', (e: PointerEvent) => {
    if (!downPos) return
    const dx = e.clientX - downPos.x
    const dy = e.clientY - downPos.y
    downPos = null
    if (Math.hypot(dx, dy) <= DRAG_EPS) handlePick(e)
  }, { capture: true })

  ro = new ResizeObserver(() => forceResize())
  ro.observe(wrapRef.value!)

  // 让 OrbitControls 在交互/阻尼时驱动渲染
  controls.addEventListener('change', requestRender);

// 首帧
  requestRender();

}

function dispose() {
  try {
    renderer?.domElement?.removeEventListener('pointerdown', onPointerDown)
    controls?.removeEventListener?.('change', requestRender)
    ro?.disconnect()
    cancelAnimationFrame(raf)

    if (scene) disposeScene(scene)   // ✅ 释放几何/材质
    scene?.clear()

    controls?.dispose()
    renderer?.dispose?.()
  } finally {
    idToObj.clear()
    modelPopStyle.value = {display:'none'}
    if (coordTimer) { clearTimeout(coordTimer); coordTimer = null }
  }
}


/* ---------- 交互 ---------- */
function onPointerDown(e: PointerEvent) { downPos = { x: e.clientX, y: e.clientY } }
let downPos: {x:number;y:number} | null = null
const DRAG_EPS = 5

function handlePick(e: PointerEvent | MouseEvent) {
  const rect = _canvasRect || renderer.domElement.getBoundingClientRect()
  const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
  const y = -((e.clientY - rect.top)  / rect.height) * 2 + 1
  mouseNDC.set(x, y)

  camera.updateMatrixWorld()
  raycaster.setFromCamera(mouseNDC, camera)

  // A) 与地面平面交点（使用全局常量 GROUND_PLANE + 复用向量）
  const hitPoint = _tmpV3a
  if (raycaster.ray.intersectPlane(GROUND_PLANE, hitPoint)) {
    const { x: wx, y: wy, z: wz } = hitPoint
    const { x: px, y: py } = worldXZToPx(wx, wz)
    showClickCoord({ px, py, wx, wy, wz })
  }

  // B) 原有 picking
  const hits = raycaster.intersectObjects(clickable.children, true)
  if (hits.length) {
    let obj: THREE.Object3D | null = hits[0].object
    while (obj && !(obj as any).__meta) obj = obj.parent
    if (obj) {
      const meta = (obj as any).__meta
      selected.value = meta
      emit('select', meta)
      updateModelPop()
    }
  } else {
    selected.value = null
    modelPopStyle.value = { display: 'none' }
  }

  requestRender();
}



/* ---------- 视角保存（localStorage） ---------- */
type ViewMark = {
  id: string
  name: string
  pos: [number, number, number]
  target: [number, number, number]
  fov: number
}
const LS_KEY = 'SY_VIEW_PRESETS'
const viewPresets = ref<ViewMark[]>([])

function loadPresets(){
  try {
    const raw = localStorage.getItem(LS_KEY)
    viewPresets.value = raw ? JSON.parse(raw) : []
  } catch { viewPresets.value = [] }
}
function persistPresets(){
  localStorage.setItem(LS_KEY, JSON.stringify(viewPresets.value))
}
function snapshotCamera(): ViewMark {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
    name: `视角${viewPresets.value.length + 1}`,
    pos: [camera.position.x, camera.position.y, camera.position.z],
    target: [controls.target.x, controls.target.y, controls.target.z],
    fov: camera.fov
  }
}
function saveCurrentView(){
  if (!camera || !controls) return
  const snap = snapshotCamera()
  viewPresets.value.push(snap)
  persistPresets()
}
function gotoView(v: ViewMark){
  if (!camera || !controls) return
  const fromPos = camera.position.clone()
  const toPos   = new THREE.Vector3(...v.pos)
  const fromTar = controls.target.clone()
  const toTar   = new THREE.Vector3(...v.target)

  const steps = 24
  let i = 0
  const animate = () => {
    i++
    const k = i / steps
    camera.position.lerpVectors(fromPos, toPos, k)
    controls.target.lerpVectors(fromTar, toTar, k)
    camera.fov = v.fov
    camera.updateProjectionMatrix()
    controls.update()
    if (i < steps) requestAnimationFrame(animate)
  }
  animate()
}
function removeView(id: string){
  const idx = viewPresets.value.findIndex(v => v.id === id)
  if (idx >= 0) { viewPresets.value.splice(idx, 1); persistPresets() }
}
function clearAllViews(){
  viewPresets.value = []
  persistPresets()
}

/* ---------- 生命周期 / 监听 ---------- */
onMounted(async () => {
  loadPresets()
  await init()
})
onBeforeUnmount(dispose)

watch(() => props.items, async () => {
  if (!renderer) return
  cancelAnimationFrame(raf)

  if (scene) disposeScene(scene) // ✅ 重建前释放
  scene?.clear()

  await buildScene()
  requestRender();
})

function disposeScene(root: THREE.Object3D) {
  root.traverse((obj: any) => {
    if (obj.isMesh || obj.isPoints || obj.isLine) {
      // 几何
      obj.geometry?.dispose?.()
      // 材质（可能是数组）
      const m = obj.material
      if (Array.isArray(m)) m.forEach(mm => mm?.dispose?.())
      else m?.dispose?.()
    }
  })
}

const rootStyle = computed(() => ({ height: props.height || '92vh' }))

/* ---------- 暴露给模板的视角方法/状态 ---------- */
defineExpose({
  saveCurrentView, gotoView, removeView, clearAllViews, viewPresets
})
</script>


<template>
  <div class="scene-root" :style="rootStyle">
    <div ref="wrapRef" class="abs-fill"></div>

    <!-- 模型处的信息框（跟随 3D 位置） -->
    <div v-if="selected" class="model-pop" :style="modelPopStyle">
      <div class="mp-inner">
        <div class="mp-head">
          <div class="mp-title">
            <span class="mp-dot" :class="(selected.system_status?.toLowerCase() || 'normal')"></span>
            <span class="mp-name" :title="selected.system_name">{{ selected.system_name }}</span>
          </div>
          <span class="mp-close" @click="selected=null" title="关闭">×</span>
        </div>

        <div class="mp-sub">
          <span class="mp-badge" :class="selected.system_status?.toLowerCase() || 'normal'">
            {{ selected.system_status || 'Normal' }}
          </span>
          <span class="mp-type" title="位置">{{ selected.x }}, {{ selected.y }}, z={{ selected.z ?? 0 }}</span>
        </div>
        <div class="mp-body">
          <div class="kv">
             <div class="k">剩余寿命</div>
            <div class="v mono">{{ selected.remaining_life || '无数据' }}</div>
          </div>
          <!-- 自动附加字段 -->
          <div class="kv" v-for="[k,v] in extraFields" :key="k">
            <div class="k">{{ k }}</div>
            <div class="v">
              {{ Array.isArray(v) ? v.join(', ') : (typeof v==='object' ? JSON.stringify(v) : v) }}
            </div>
          </div>
        </div>

        <div class="mp-actions">
          <el-button size="small" type="primary" @click="goUnitFromSelected()">查看详情</el-button>
        </div>
      </div>
      <div class="mp-arrow"></div>
    </div>

    <div v-if="showInfo !== false && selected" class="info-card">
      <div class="title">
        <div class="name" :title="selected?.system_name">{{ selected?.system_name }}</div>
        <span class="badge">
          <i class="dot"
             :style="{ background:
               (selected?.system_status?.toLowerCase()==='fault')   ? '#EF4444' :
               (selected?.system_status?.toLowerCase()==='warning') ? '#F59E0B' :
               (selected?.system_status?.toLowerCase()==='normal')  ? '#10B981' : '#60A5FA' }"></i>
          {{ selected?.system_status || 'Normal' }}
        </span>
      </div>
      <div class="sub">位置：{{ selected?.x }}, {{ selected?.y }}</div>
      <div class="actions">
        <el-button size="small" type="primary" @click="$emit('enter', selected!)">查看详情</el-button>
        <el-button size="small" @click="selected=null">关闭</el-button>
      </div>
    </div>
  </div>

<!--  <div class="click-coord" v-if="clickCoord">-->
<!--    <div class="cc-inner">-->
<!--      地图坐标：{{ Math.round(clickCoord.px) }}, {{ Math.round(clickCoord.py) }}-->
<!--      <span class="sep">|</span>-->
<!--      世界：x={{ clickCoord.wx.toFixed(1) }}, y={{ clickCoord.wy.toFixed(1) }}, z={{ clickCoord.wz.toFixed(1) }}-->
<!--    </div>-->
<!--  </div>-->

  <teleport to="body">
    <div class="sy-viewbar">
      <div class="click-coord" v-if="clickCoord">
        <div class="cc-inner">
          地图：{{ Math.round(clickCoord.px) }}, {{ Math.round(clickCoord.py) }}
          <span class="sep">|</span>
          世界：x={{ clickCoord.wx.toFixed(1) }}, y={{ clickCoord.wy.toFixed(1) }}, z={{ clickCoord.wz.toFixed(1) }}
        </div>
      </div>

      <button class="sy-btn" @click="saveCurrentView">保存视角</button>
      <button class="sy-btn ghost" @click="clearAllViews" title="清空所有">清空</button>

      <div class="sy-chip"
           v-for="v in viewPresets"
           :key="v.id"
           @click="gotoView(v)"
           :title="`相机: ${v.pos.join(', ')} → 目标: ${v.target.join(', ')}`">
        {{ v.name }}
        <span class="x" @click.stop="removeView(v.id)">×</span>
      </div>
    </div>
  </teleport>

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
  position: absolute;
  z-index: 10;
  min-width: 260px;
  max-width: 320px;
  pointer-events: none;           /* 不拦截画布拖拽 */
  transform-origin: 50% 100%;
  animation: mp-appear .16s ease-out;
}

@keyframes mp-appear {
  from { transform: translate(-50%, -110%) scale(.98); opacity: 0; }
  to   { transform: translate(-50%, -110%) scale(1);   opacity: 1; }
}

/* 玻璃质感容器 */
.mp-inner{
  pointer-events: auto;           /* 内部可交互 */
  backdrop-filter: blur(10px) saturate(1.1);
  background: linear-gradient(180deg, rgba(20,24,30,.90), rgba(16,20,26,.86));
  border: 1px solid rgba(255,255,255,.16);
  border-radius: 12px;
  box-shadow:
      0 12px 24px rgba(0,0,0,.35),
      inset 0 0 0 1px rgba(255,255,255,.06);
  color: #e8eaed;
  padding: 12px 12px 48px 12px;   /* 预留底部按钮区高度 */
  position: relative;
}

/* 霓虹描边（可选） */
.mp-inner::before{
  content:'';
  position:absolute; inset:0; border-radius:12px; pointer-events:none;
  background: radial-gradient(140% 60% at 10% -10%, rgba(99,102,241,.22), transparent 55%) ,
  radial-gradient(120% 60% at 110% -20%, rgba(56,189,248,.20), transparent 50%);
  mask: linear-gradient(#000,#000) content-box, linear-gradient(#000,#000);
  -webkit-mask: linear-gradient(#000,#000) content-box, linear-gradient(#000,#000);
  padding:1px; border:1px solid transparent;
  opacity:.9;
}

/* 顶部 */
.mp-head{
  display:flex; align-items:center; justify-content:space-between; gap:10px;
}
.mp-title{ display:flex; align-items:center; gap:8px; min-width:0; }
.mp-dot{
  width:9px; height:9px; border-radius:50%;
  box-shadow: 0 0 10px currentColor;
}
.mp-dot.normal{  color:#10B981; background:#10B981; }
.mp-dot.warning{ color:#F59E0B; background:#F59E0B; }
.mp-dot.fault{   color:#EF4444; background:#EF4444; }

.mp-name{
  font-weight: 600;
  font-size: 14px;
  letter-spacing:.2px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  max-width: 220px;
}
.mp-close{
  pointer-events:auto;
  width: 26px; height: 26px; line-height: 26px;
  text-align:center; border-radius:8px; cursor:pointer;
  color:#c7cbd1; background: rgba(255,255,255,.04);
  border:1px solid rgba(255,255,255,.08);
  transition: all .15s ease;
}
.mp-close:hover{ background: rgba(255,255,255,.08); color:#fff; }

/* 副标题区：状态 + 型号 */
.mp-sub{
  margin-top:6px; display:flex; align-items:center; gap:8px; flex-wrap:wrap;
  font-size:12px; opacity:.92;
}
.mp-badge{
  display:inline-flex; align-items:center; gap:6px;
  padding:2px 8px; border-radius:999px; border:1px solid transparent;
  line-height: 18px;
  background:#0003; color:#e6e6e6;
}
.mp-badge.normal{  border-color: #19c08f44; background:#19c08f14; color:#bff6e4; }
.mp-badge.warning{ border-color: #f59e0b44; background:#f59e0b16; color:#ffe8bd; }
.mp-badge.fault{   border-color: #ef444444; background:#ef444416; color:#ffc5c5; }

.mp-type{
  padding:2px 8px; border-radius:6px;
  background: rgba(255,255,255,.05);
  border: 1px dashed rgba(255,255,255,.12);
  color:#cfd6dd;
}

/* 主体字段：一行一项 */
.mp-body{
  margin-top:10px;
  display:flex; flex-direction:column; gap:8px;
  font-size:10px;
}
.kv{
  display:grid; grid-template-columns: 88px 1fr; gap:5px 6px;
  align-items:start;
  background: linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02));
  border:1px solid rgba(255,255,255,.08);
  padding: 4px 6px;
  border-radius: 6px;
}
.k{
  opacity:.72; color:#cfd3da; font-weight:500; letter-spacing:.2px;
}
.v{ color:#e9edf3; word-break:break-all; }
.v.mono{ font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace; }

/* 底部固定按钮区 */
.mp-actions{
  position:absolute; left:0; right:0; bottom:0;
  padding:10px 12px;
  border-top:1px solid rgba(255,255,255,.10);
  background: linear-gradient(180deg, transparent, rgba(0,0,0,.18));
  display:flex; justify-content:flex-end; gap:8px;
  pointer-events:auto;
}

/* 箭头 */
.mp-arrow{
  position:absolute; left:50%; top:0;
  transform: translate(-50%, -3px);
  width: 0; height: 0; pointer-events:none;
  border-left: 10px solid transparent;
  border-right:10px solid transparent;
  border-bottom:12px solid rgba(20,24,30,.92);
  filter: drop-shadow(0 -2px 2px rgba(0,0,0,.15));
}

/* ==== 弹出框优化覆盖：半透明 + 大边距 + 字号增一号 ==== */
.scene-root{
  /* 统一的可调变量 */
  --mp-font-size: 14px;         /* 原来 12px → 14px */
  --mp-title-size: 16px;        /* 原来 14px → 16px */
  --mp-pad: 16px;               /* 内边距更大 */
  --mp-actions-h: 56px;         /* 底部按钮区高度 */
  --mp-alpha-top: 0.78;         /* 半透明强度（上） */
  --mp-alpha-bottom: 0.68;      /* 半透明强度（下） */
}

/* 面板尺寸略放大 */
.model-pop{
  min-width: 280px;
  max-width: 360px;
}

/* 玻璃体：半透明 + 大边距 + 大字号 */
.mp-inner{
  font-size: var(--mp-font-size);
  padding: var(--mp-pad) var(--mp-pad) calc(var(--mp-actions-h) + 12px) var(--mp-pad);
  border-radius: 14px;
  background:
      linear-gradient(180deg,
      rgba(20,24,30,var(--mp-alpha-top)),
      rgba(16,20,26,var(--mp-alpha-bottom)));
  border: 1px solid rgba(255,255,255,.16);
  backdrop-filter: blur(12px) saturate(1.08);
}

/* 霓虹描边稍弱一点，避免喧宾夺主 */
.mp-inner::before{ opacity:.75; }

/* 标题字号 +1 */
.mp-name{ font-size: var(--mp-title-size); }

/* 关闭按钮稍大一点，触控更友好 */
.mp-close{ width: 28px; height: 28px; line-height: 28px; }

/* 信息区间距与字号同步放大 */
.mp-body{ gap: 10px; font-size: var(--mp-font-size); }

/* 键值行：更大的留白与圆角 */


/* 底部按钮区：跟随更大的内边距 */
.mp-actions{
  padding: 12px var(--mp-pad);
  height: var(--mp-actions-h);
}

/* 箭头颜色与半透明一致 */
.mp-arrow{
  border-bottom-color: rgba(20,24,30,var(--mp-alpha-top));
}

/* 视角工具条（Teleport 到 body，上层显示） */
.sy-viewbar{
  position: fixed;
  left: 50%;
  top: 60px;
  transform: translateX(-50%);
  z-index: 10000;               /* 关键：盖过前景面板 */
  display: flex;
  gap: 8px;
  padding: 6px;
  border-radius: 8px;
  background: rgb(176, 202, 216);
  border: 1px solid rgba(0,0,0,.08);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 24px rgba(0,0,0,.12);
  pointer-events: auto;
  color: #1e293b;
}
:global(html.dark) .sy-viewbar{
  background: rgba(255,255,255,.72);
  color:#1e293b;
}
.sy-btn{
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid rgba(0,0,0,.12);
  background: rgba(255,255,255,.9);
  cursor: pointer;
  font-size: 12px;
}
.sy-btn.ghost{ background: transparent; }
.sy-chip{
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(14,165,233,.12);
  border: 1px solid rgba(14,165,233,.28);
  cursor: pointer; user-select: none;
  font-size: 12px; font-weight: 600;
}
.sy-chip .x{
  display:inline-block; margin-left: 2px; padding:0 4px;
  border-radius: 6px; background: rgba(0,0,0,.06);
}
.sy-chip .x:hover{ background: rgba(0,0,0,.12); }
.click-coord{
  position:absolute; top:48px; left:50%; transform:translateX(-30%);
  width: 500px;
  z-index: 20; pointer-events: none;
}
.cc-inner{
  padding:6px 10px; border-radius:4px;
  background: rgba(20,24,30,.72);
  border:1px solid rgba(255,255,255,.2);
  color:#fff; font-size:12px; letter-spacing:.2px;
  -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px);
  box-shadow: 0 6px 14px rgba(0,0,0,.25), inset 0 0 0 1px rgba(255,255,255,.06);
}
.cc-inner .sep{ margin:0 8px; opacity:.8 }

</style>
