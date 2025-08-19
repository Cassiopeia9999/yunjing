<!-- src/views/manage/BaseScenarioView.vue -->
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

/* -------------------- DOM & 状态 -------------------- */
const wrapRef   = ref<HTMLDivElement | null>(null)
const selected  = ref<any | null>(null)

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

/* 模型整体放大倍率 */
const MODEL_SCALE_MULT = 20

/* -------------------- 小工具 -------------------- */
function pubUrl(rel: string) {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '')
  return `${base}/${rel.replace(/^\/+/, '')}`
}
const statusColor = (s:string) => (s === 'Fault' ? 0xef4444 : s === 'Warning' ? 0xf59e0b : 0x10b981)

/** 生成网格纹理（地面兜底） */
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
/** 天空渐变纹理 */
// 替换原 makeSkyTexture
function makeSkyTexture(size = 1024, top = '#79B8FF', bottom = '#DFE9F6') {
  const c = document.createElement('canvas'); c.width = 1; c.height = size
  const g = c.getContext('2d')!
  const grd = g.createLinearGradient(0,0,0,size)
  // 上深下浅，更接近日间天空
  grd.addColorStop(0, top)      // 顶部
  grd.addColorStop(1, bottom)   // 地平线
  g.fillStyle = grd; g.fillRect(0,0,1,size)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** 像素(左上) -> 世界(XZ)，Y 为高度 */
function pxToWorldXZ(p:{x:number;y:number}, y=0) {
  return new THREE.Vector3(p.x - world.W/2, y, -(p.y - world.H/2))
}
/** 归一化模型尺寸到 targetSize，并让底面在 y=0 */
function normalizeScale(root: THREE.Object3D, targetSize=80) {
  const box = new THREE.Box3().setFromObject(root)
  const size = box.getSize(new THREE.Vector3())
  const s = targetSize / Math.max(size.x, size.y, size.z || 1)
  root.scale.multiplyScalar(s)
  box.setFromObject(root)
  const center = box.getCenter(new THREE.Vector3())
  root.position.sub(new THREE.Vector3(center.x, box.min.y, center.z))
}
/** 占位模型（线框） */
function makeDebugPlaceholder(color=0xff4444, size=80) {
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
/** 初始相机摆位：看到整个地面 */
function placeCameraToSeeGround(margin=1.15) {
  const radius = Math.hypot(world.W/2, world.H/2)
  const fov = THREE.MathUtils.degToRad(camera.fov)
  const dist = radius / Math.tan(fov/2) * margin
  camera.position.set(0, dist*0.6, dist)
  camera.lookAt(0,0,0)
  controls.target.set(0,0,0)
  controls.update()
}

/* -------------------- 加载资源 -------------------- */
async function safeLoadGroundTexture() {
  try {
    const tex = await new THREE.TextureLoader().loadAsync(pubUrl('assets/maps/base.png'))
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  } catch {
    return makeGridTexture()
  }
}
async function loadHotspots() {
  try {
    const res = await fetch(pubUrl('assets/scene/hotspots.json'), { cache:'no-cache' })
    if (!res.ok) throw new Error()
    return await res.json()
  } catch {
    return [
      { id:'u-101', name:'装置-1', x: 980, y: 530, status:'Normal',  size: 80 },
      { id:'u-102', name:'装置-2', x: 740, y: 600, status:'Warning', size: 90 },
      { id:'u-103', name:'装置-3', x: 460, y: 560, status:'Fault',   size: 100 },
    ]
  }
}
async function tryLoadGLTF(): Promise<THREE.Object3D|null> {
  const folder = pubUrl('assets/models/submarine/')
  const loader = new GLTFLoader()
  loader.setPath(folder)
  loader.setResourcePath(folder)
  return await new Promise(resolve=>{
    loader.load('scene.gltf', g=>resolve(g.scene), undefined, err=>{
      console.warn('[GLTF] load fail:', err); resolve(null)
    })
  })
}

/* -------------------- 初始化 -------------------- */
function forceResize() {
  const el = wrapRef.value!
  const rect = el.getBoundingClientRect()
  let w = Math.floor(rect.width)
  let h = Math.floor(rect.height)
  // 容器刚挂载时可能还是 0，兜底为窗口尺寸
  if (w < 2 || h < 2) { w = window.innerWidth; h = window.innerHeight * 0.72 }
  renderer.setSize(w, h, false)
  camera.aspect = w / h
  camera.updateProjectionMatrix()
}

async function init() {
  if (!wrapRef.value) return

  renderer = new THREE.WebGLRenderer({ antialias:true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.35     // ↑ 提升整体亮度
  renderer.setClearColor(0xDFE9F6, 1)     // 与天空地平线色一致，避免黑边


  wrapRef.value.appendChild(renderer.domElement)

  scene = new THREE.Scene()
  scene.fog = new THREE.Fog(0xDFE9F6, 4000, 14000)   // 颜色更浅，距离更远

  camera = new THREE.PerspectiveCamera(55, 1, 0.1, 20000)
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.minDistance = 150
  controls.maxDistance = 8000
  controls.minPolarAngle = THREE.MathUtils.degToRad(10)
  controls.maxPolarAngle = THREE.MathUtils.degToRad(88)

  // 天空球（保持 BackSide）
  const sky = new THREE.Mesh(
      new THREE.SphereGeometry(8000, 48, 24),
      new THREE.MeshBasicMaterial({ map: makeSkyTexture(), side: THREE.BackSide })
  )
  scene.add(sky)

// 更明亮的环境光组合
  const hemi = new THREE.HemisphereLight(0xEAF6FF, 0xBFDcff, 1.0) // 天空/地面色 + 强度
  const amb  = new THREE.AmbientLight(0xffffff, 0.55)             // 提升环境底亮度
  const dir  = new THREE.DirectionalLight(0xffffff, 1.2)          // 主光更亮
  dir.position.set(1500, 2200, 1200)
  scene.add(hemi, amb, dir)


  // 地面贴图（或网格）
  // 地面贴图（或网格）
  const gtex = await safeLoadGroundTexture()
  const img = gtex.image as HTMLImageElement | HTMLCanvasElement
  if (img && (img as any).width && (img as any).height) {
    world.W = (img as any).width
    world.H = (img as any).height
  }

// --- 关键：做大范围 + 平铺 ---
  const EXT = Math.max(world.W, world.H) * 6; // 地面总宽高（越大越远）
  gtex.wrapS = gtex.wrapT = THREE.MirroredRepeatWrapping   // 或 RepeatWrapping
  gtex.repeat.set(EXT / world.W, EXT / world.H)            // 平铺次数
  gtex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy())

// 让平铺中心与原点对齐（使“中央一块”大致位于场景中心）
  gtex.offset.set(-0.5 * gtex.repeat.x + 0.5, -0.5 * gtex.repeat.y + 0.5)

  const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(EXT, EXT),
      new THREE.MeshLambertMaterial({ map: gtex })
  )
  ground.rotation.x = -Math.PI / 2
  scene.add(ground)


  // 调试辅助：网格/坐标轴（需要时可注释）
  scene.add(new THREE.GridHelper(Math.max(world.W, world.H), 40, 0x3a5a9a, 0x1f2f48))
  const axes = new THREE.AxesHelper(200)
  axes.position.y = 1
  scene.add(axes)

  // 点击对象容器
  scene.add(clickable)

  // 模型
  let baseModel = await tryLoadGLTF()
  if (!baseModel) baseModel = makeDebugPlaceholder(0xff4444, 80)
  baseModel.traverse(obj=>{
    if ((obj as any).isMesh) {
      const m = obj as THREE.Mesh
      m.castShadow = false
      m.receiveShadow = false
    }
  })

  // 热点
  const hotspots = await loadHotspots()
  for (const h of hotspots) {
    const inst = baseModel.clone(true)
    normalizeScale(inst, (h.size ?? 80) * MODEL_SCALE_MULT)
    inst.position.copy(pxToWorldXZ({ x:h.x, y:h.y }, 0))
    ;(inst as any).__meta = { ...h }
    clickable.add(inst)

    const halo = new THREE.Mesh(
        new THREE.CircleGeometry(18, 48),
        new THREE.MeshBasicMaterial({ color: statusColor(h.status), transparent:true, opacity:0.28 })
    )
    halo.rotation.x = -Math.PI / 2
    halo.position.copy(inst.position).y = 0.02
    scene.add(halo)
  }

  // 尺寸自适应（含兜底）
  ro = new ResizeObserver(() => forceResize())
  ro.observe(wrapRef.value)
  await nextTick()
  forceResize()
  placeCameraToSeeGround(1.15)

  // 点击拾取
  renderer.domElement.addEventListener('pointerdown', onPointerDown)

  // 渲染循环
  const loop = () => {
    controls.update()
    renderer.render(scene, camera)
    raf = requestAnimationFrame(loop)
  }
  loop()
}

/* -------------------- 拾取 -------------------- */
function onPointerDown(e: PointerEvent) {
  const rect = renderer.domElement.getBoundingClientRect()
  mouseNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
  mouseNDC.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1
  raycaster.setFromCamera(mouseNDC, camera)
  const hits = raycaster.intersectObjects(clickable.children, true)
  if (hits.length) {
    let obj: THREE.Object3D | null = hits[0].object
    while (obj && !(obj as any).__meta) obj = obj.parent
    if (obj) selected.value = (obj as any).__meta
  }
}

/* -------------------- 生命周期 -------------------- */
onMounted(init)
onBeforeUnmount(() => {
  renderer?.domElement?.removeEventListener('pointerdown', onPointerDown)
  ro?.disconnect()
  cancelAnimationFrame(raf)
  controls?.dispose()
  renderer?.dispose?.()
})
</script>

<template>
  <!-- 关键：给一个明确高度；否则父级没高度的话，h-full 会是 0 -->
  <div class="scene-wrap">
    <div ref="wrapRef" class="abs-fill"></div>

    <div v-if="selected"
         class="info-card">
      <div class="title">
        <div class="name">{{ selected.name }}</div>
        <span class="badge"
              :style="{ background:'#0001', color:'#fff' }">
          <i class="dot"
             :style="{ background: selected.status==='Fault'?'#EF4444':selected.status==='Warning'?'#F59E0B':'#10B981' }"></i>
          {{ selected.status }}
        </span>
      </div>
      <div class="sub">坐标：{{ selected.x }}, {{ selected.y }}</div>
      <div class="actions">
        <el-button size="small" type="primary">查看详情</el-button>
        <el-button size="small" @click="selected=null">关闭</el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scene-wrap{
  position: relative;
  width: 100%;
  height: 92vh;          /* ★ 给定高度 */
  min-height: 520px;     /* ★ 兜底最小高度 */
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px;
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
.info-card .badge{ display:inline-flex; align-items:center; gap:6px; padding:2px 8px; border-radius:999px; font-size:11px; }
.info-card .dot{ width:8px; height:8px; border-radius:999px; display:inline-block; }
.info-card .sub{ opacity:.75; margin-top:6px; }
.info-card .actions{ margin-top:10px; display:flex; gap:8px; }
:deep(canvas){ display:block; width:100%; height:100%; outline:none; }
</style>
