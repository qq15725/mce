import type { Batch2DEffect } from 'modern-canvas'

// 工作流连线的三种流动预设（对标参考动效 1/2/3）。引擎只内置 flowStreak，其余样式由本包提供，
// 经 `engine.flowEffect = <Batch2DEffect>` 注入（占用同一 flow 槽、按名替换 + 重编译）。
// 都复用引擎给的通道：vUv.x(路径像素弧长) + vUv.y(横向 0..1) + uTime(秒) + vParam(速度)。
//
// vUv.x 有两套语义，由效果的 uvNormalized 决定（引擎在批打包阶段按当前激活效果动态处理）：
// - 箭头 / 生长线 uvNormalized:true → 每条线 0..1，严格一线一个 / 走满整条。
// - 虚线 / 流光 缺省 → 路径像素弧长，段长固定物理尺寸、与线长无关。
// 两套都是平滑量，不用 fwidth(vUv.x)（沿路径的屏幕导数在曲线三角化上逐面片跳变，会切成三角碎片）；
// 横向 fwidth(vUv.y)(线宽像素)稳定，仅用于 core 裁剪 / 抗锯齿。

const UNIFORMS = 'uniform vec3 uFlowColor;\nuniform float uFlowPeriod;'
const PURPLE = new Float32Array([0.502, 0.502, 0.973])

/**
 * 动效1：实心三角箭头沿路径行进，尖端朝流动方向，**突出于线宽**。
 * uvNormalized → uv.x 为「每条线 0..1」，uFlowPeriod=1 时严格一条线一个箭头（不论线长）。
 * 需宿主加宽几何(widthBoost)：描边本体只画在中间细 core(=细轨道)，箭头三角铺满整个加宽带(=超出细线)。
 * 箭头尺寸**只与线宽相关、与线长无关**：横向宽 = 加宽带(几何决定)；纵向长 = ARROW_LEN×(线宽/线长)，
 * 其中「线宽/线长」由引擎经 vFlowMeta 提供（每条线常量，非 fwidth 沿路径导数，故不产生三角碎片）——
 * 归一化空间下 LEN×线长 = ARROW_LEN×线宽，即固定物理长度。
 */
const arrowFrag = `if (vParam > 0.5) {
  float speed = (vParam - 128.0) / 32.0;
  float dir = speed < 0.0 ? -1.0 : 1.0;
  float w = 1.0 / max(fwidth(vUv.y), 1e-6);
  float px = abs(vUv.y - 0.5) * w;
  float core = clamp(w * 0.14 - px + 0.5, 0.0, 1.0);
  vec4 outc = color * core;
  float LEN = clamp(1.1 * vFlowMeta, 0.02, 0.6);  // 箭头长≈1.1×线宽 → 高/底≈1.1 等腰三角（对标参考播放键比例）
  float b = fract((uTime * speed - vUv.x / uFlowPeriod) * dir);
  float s = b > 0.5 ? b - 1.0 : b;
  float t = clamp(s / LEN, 0.0, 1.0);
  float yy = abs(vUv.y - 0.5) * 2.0;
  float inArrow = step(0.0, s) * step(s, LEN) * (1.0 - smoothstep(t - 0.14, t, yy));
  outc.rgb = mix(outc.rgb, uFlowColor, inArrow);
  outc.a = max(outc.a, inArrow * color.a);
  color = outc;
}`
// WebGL1 无 core 裁剪：整宽画箭头。
const arrowFragGl1 = `if (vParam > 0.5) {
  float speed = (vParam - 128.0) / 32.0;
  float dir = speed < 0.0 ? -1.0 : 1.0;
  float LEN = clamp(1.1 * vFlowMeta, 0.02, 0.6);
  float b = fract((uTime * speed - vUv.x / uFlowPeriod) * dir);
  float s = b > 0.5 ? b - 1.0 : b;
  float t = clamp(s / LEN, 0.0, 1.0);
  float yy = abs(vUv.y - 0.5) * 2.0;
  float inArrow = step(0.0, s) * step(s, LEN) * (1.0 - smoothstep(t - 0.14, t, yy));
  color.rgb = mix(color.rgb, uFlowColor, inArrow);
}`
export const flowArrowEffect: Batch2DEffect = {
  name: 'flowStreak', // 占用引擎的 flow 槽，registerEffect 一调即替换
  uvNormalized: true, // uv.x 归一化到每条线 0..1 → 一线一个
  uniformDecls: UNIFORMS,
  uniformDefaults: { uFlowColor: PURPLE, uFlowPeriod: 1 },
  fragment: arrowFrag,
  fragmentGl1: arrowFragGl1,
}

/** 动效2：贪吃蛇式生长线——每周期内从段首生长到段尾，再淡出，循环。周期≥线长时即整线生长。 */
const growFrag = `if (vParam > 0.5) {
  float speed = (vParam - 128.0) / 32.0;
  float xu = fract(vUv.x / uFlowPeriod);
  float cyc = fract(uTime * abs(speed) * 0.5);
  float prog = smoothstep(0.0, 0.7, cyc);       // 前 70% 生长到满
  float fade = 1.0 - smoothstep(0.8, 1.0, cyc);  // 末 20% 高亮淡回轨道色(不动 alpha，无白闪)
  float lit = step(xu, prog) * fade;
  color.rgb = mix(color.rgb, uFlowColor, lit);
}`
export const flowGrowEffect: Batch2DEffect = {
  name: 'flowStreak',
  uvNormalized: true, // uv.x 归一化 → uFlowPeriod=1 即整条线一段：走满整条再淡出（真·生长线）。
  uniformDecls: UNIFORMS,
  uniformDefaults: { uFlowColor: PURPLE, uFlowPeriod: 1 },
  fragment: growFrag,
  fragmentGl1: growFrag,
}

/** 动效3：数据流虚线——沿路径行进的短虚线（marching ants）。 */
// 虚线单元固定 = uFlowPeriod 路径像素：长线更多、短线更少，但每段大小一致；实/空 = 40% / 60%。
const dashFrag = `if (vParam > 0.5) {
  float speed = (vParam - 128.0) / 32.0;
  float dir = speed < 0.0 ? -1.0 : 1.0;
  float u = fract((vUv.x / uFlowPeriod - uTime * speed) * dir);
  float dash = 1.0 - smoothstep(0.4, 0.46, u);
  color.rgb = mix(color.rgb, uFlowColor, dash);
}`
export const flowDashEffect: Batch2DEffect = {
  name: 'flowStreak',
  // uFlowPeriod = 虚线单元长度（路径像素）。
  uniformDecls: UNIFORMS,
  uniformDefaults: { uFlowColor: new Float32Array([0.827, 0.620, 0.973]), uFlowPeriod: 120 },
  fragment: dashFrag,
  fragmentGl1: dashFrag,
}
