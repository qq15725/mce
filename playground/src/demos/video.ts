import type { Editor } from 'mce'
import { fitAndPlay } from './shared'

export async function loadVideoDemo(editor: Editor): Promise<void> {
  editor.setDoc([
    {
      is: 'Video2D',
      id: 'video-demo',
      src: '/example.mp4',
      style: { left: 0, top: 0, width: 480, height: 270 },
      meta: { inCanvasIs: 'Video2D' },
    },
  ] as any)
  // 视频纹理异步加载，加载完成前 getTimeRange 取不到时长，endTime 会是 0，
  // 导致播放 RAF 不推进时间，所以等视频就绪后再重算时间轴长度。
  const video: any = editor.root.value.findOne((n: any) => n.id === 'video-demo')
  await video?.waitLoad?.()
  await editor.recomputeTimelineEndTime()
  fitAndPlay(editor, 100)
}
