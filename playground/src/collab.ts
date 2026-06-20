import type { YDoc } from 'mce'
import { AbstractProvider } from 'mce'

/**
 * 基于 BroadcastChannel 的传输：同一浏览器多标签页之间同步，零服务端、零网络。
 * 用于本地演示 / 验证协同（开两个标签页带同一个 ?room= 即可看到光标、选框、状态栏头像联动）。
 *
 * 注：这是点对点（无中心服务端）链路，故未 synced 时收到任意消息就再发一次 syncStep1，
 * 让先到 / 后到的标签页都能拉到对端全量状态后收敛。
 */
export class BroadcastChannelProvider extends AbstractProvider {
  private channel: BroadcastChannel

  constructor(ydoc: YDoc, room: string) {
    super(ydoc)
    this.channel = new BroadcastChannel(`mce:collab:${room}`)
    this.channel.onmessage = (e: MessageEvent) => {
      this.receive(e.data as Uint8Array)
      // 尚未拿到对端全量状态：再发一次 step1 催促对端回 step2。对端已 synced 则不会再追加，收敛有界。
      if (!this.synced) {
        this.onOpen()
      }
    }
    // 上线：广播 syncStep1 + 本端 awareness；并把本端已有内容推给已在场的对端
    // （P2P 无服务端转发，对端不会主动回请，故中途换文档/加载内容需主动 push）。
    this.onOpen()
    this.broadcastState()
  }

  protected send(data: Uint8Array): void {
    // 通道已关闭后若仍有尾随广播（极端时序），postMessage 会抛 InvalidStateError，吞掉即可。
    try {
      this.channel.postMessage(data)
    }
    catch {}
  }

  override destroy(): void {
    // 先 super.destroy()：它会经 awareness 广播「离场」，需在 channel 仍打开时发出；之后再关通道。
    super.destroy()
    this.channel.close()
  }
}
