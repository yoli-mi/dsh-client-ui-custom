/**
 * Keyed chat renderer shadowing `conversation.chat.node` for `user` and
 * `steering` cells (priority -1 beats ui-conversation's default renderer).
 * Reads the ui-custom settings scope's `renderUserMarkdown`: on, the bubble
 * text renders through MarkdownText; off, it falls back to the plain-text
 * bubble with /name @name reference chips — visually identical to stock.
 *
 * Self-contained on purpose: the platform purity gate forbids importing
 * another plugin's internals, so the bubble geometry, image gallery wiring,
 * reference chips and the copy/clock actions row are replicated here from
 * ui-conversation's MessageItem (only platform atoms are imported).
 */

import { memo, useState } from 'react'
import type { ReactNode } from 'react'
import type { InjectFace, PropsLocale, PropsRuntime, TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import {
  IconCheckOutline16, IconCopyOutline16, JsonBlock, MarkdownText, MessageText, Tooltip, writeClipboard,
} from '@deepseek-ai/dsh-client-ui-primitives'
import { ImageGallery, type ImageLoader, type MessageImageLabels } from '@deepseek-ai/dsh-client-ui-attachment'
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client'
import type { UserMessageNode } from '@deepseek-ai/dsh-client-runtime/client'
import type { UiCustomSection } from '../../shared.ts'
import css from './MarkdownRender.module.css'

// Type-only: pulls the merged slot/locale maps (the `conversation.chat.node`
// keyed slot and the `conversation` locale namespace) from the platform
// package — erased before bundling, so the purity gate never sees it.
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'

type UserImage = Extract<UserMessageNode['content'][number], { type: 'image' }>

/** Registration-side face: the ui-custom scope behind the toggle. */
export interface MarkdownRenderInjected {
  hooks: {
    mdRender: SettingsScope<UiCustomSection>
  }
}

/** Full props of the shadowed user/steering renderer. */
export type UserMarkdownNodeProps =
  PropsRuntime<'conversation.chat.node', 'user' | 'steering'>
  & PropsLocale<'conversation'>
  & InjectFace<MarkdownRenderInjected>

/** Split a user node's content into text / images / remaining blocks. */
function contentParts(content: readonly unknown[]): {
  text: string
  images: { attachment: UserImage['attachment'] }[]
  rest: unknown[]
} {
  const texts: string[] = []
  const images: { attachment: UserImage['attachment'] }[] = []
  const rest: unknown[] = []
  for (const block of content) {
    const b = block as { type?: string; text?: string; attachment?: unknown }
    if (b.type === 'text' && typeof b.text === 'string') texts.push(b.text)
    else if (b.type === 'image' && b.attachment !== undefined) {
      images.push({ attachment: (b as UserImage).attachment })
    }
    else rest.push(block)
  }
  return { text: texts.join(''), images, rest }
}

/** Image-gallery labels from the `conversation` namespace (see ui-conversation). */
function imageLabels(t: TranslateNS<'conversation'>): MessageImageLabels {
  return {
    image: t('image.label'),
    open: t('image.openOriginal'),
    openNamed: label => t('image.openOriginalLabel', { label }),
    loading: t('image.loading'),
    loadFailed: t('image.loadFailed'),
    lightbox: {
      dialog: t('image.preview'),
      close: t('image.closePreview'),
    },
  }
}

const pad2 = (n: number): string => String(n).padStart(2, '0')

/** Same-day clock `HH:MM`, otherwise `M/D HH:MM` / `Y/M/D HH:MM`. */
function formatClock(time: number, t: TranslateNS<'conversation'>, now: number = Date.now()): string {
  const d = new Date(time)
  const n = new Date(now)
  const clock = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
  if (d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate()) {
    return clock
  }
  const params = { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() }
  const md = d.getFullYear() === n.getFullYear() ? t('clock.md', params) : t('clock.ymd', params)
  return `${md} ${clock}`
}

/** Plain-text projection with /name @name reference chips (stock look). */
function projectUserText(text: string): ReactNode {
  const re = /(^|\s)([/@][\w-]+)(?=\s|$)/g
  const parts: ReactNode[] = []
  let cursor = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    const tokenStart = m.index + (m[1]?.length ?? 0)
    const label = m[2] ?? ''
    if (tokenStart > cursor) parts.push(<MessageText key={cursor} text={text.slice(cursor, tokenStart)} />)
    parts.push(
      <span key={tokenStart} className={css.refChip} data-ref-chip={label.startsWith('@') ? 'subagent' : 'skill'}>
        {label}
      </span>,
    )
    cursor = tokenStart + label.length
  }
  if (parts.length === 0) return <MessageText text={text} />
  if (cursor < text.length) parts.push(<MessageText key={cursor} text={text.slice(cursor)} />)
  return <>{parts}</>
}

/** Copy + clock actions row (user bubble chrome). */
function UserBubbleActions({ text, time, t }: {
  text: string
  time?: number | undefined
  t: TranslateNS<'conversation'>
}) {
  const [copied, setCopied] = useState(false)
  const onCopy = (): void => {
    void writeClipboard(text).then((ok) => {
      if (!ok) return
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1000)
    })
  }
  return (
    <div className={css.actions}>
      {time !== undefined ? <span className={css.timeStart}>{formatClock(time, t)}</span> : null}
      <Tooltip label={copied ? t('copied') : t('copy')} side="bottom">
        <button type="button" className={css.action} data-dsu-motion="press" aria-label={copied ? t('copied') : t('copy')} onClick={onCopy}>
          {copied ? <IconCheckOutline16 /> : <IconCopyOutline16 />}
        </button>
      </Tooltip>
    </div>
  )
}

/** Right-aligned bubble shared by user and steering rows. */
function UserStyleBubble({ content, imageLoader, renderMarkdown, t, actions }: {
  content: readonly unknown[]
  imageLoader: ImageLoader
  /** Whether the text renders through MarkdownText (else plain + chips). */
  renderMarkdown: boolean
  t: TranslateNS<'conversation'>
  actions?: (text: string) => ReactNode
}): ReactNode {
  const { text, images, rest } = contentParts(content)
  const truncated = (total: number): string => t('json.truncated', { total })
  const showBubble = text !== '' || rest.length > 0
  return (
    <div className={css.userRow} data-dsu-motion="node" data-time-hover-root>
      <div className={css.userStack}>
        <ImageGallery images={images} load={imageLoader} align="end" labels={imageLabels(t)} />
        {showBubble && (
          <div className={css.bubble}>
            {renderMarkdown ? <MarkdownText text={text} /> : projectUserText(text)}
            {rest.map((block, i) => (
              <JsonBlock key={i} label={t('message.extraBlock')} payload={block} truncatedLabel={truncated} />
            ))}
          </div>
        )}
      </div>
      {actions?.(text)}
    </div>
  )
}

/** User and admitted-steering keyed Chat renderer (shadow, priority -1). */
export const UserMarkdownNodeView = memo(function UserMarkdownNodeView({
  node, loadImage, t, useMdRender,
}: UserMarkdownNodeProps) {
  const md = useMdRender((value) => value)
  const renderMarkdown = md?.value?.renderUserMarkdown ?? false
  const data = node.data
  return (
    <UserStyleBubble
      content={data.content}
      imageLoader={loadImage}
      renderMarkdown={renderMarkdown}
      t={t}
      actions={(text) => <UserBubbleActions text={text} time={data.time} t={t} />}
    />
  )
})
