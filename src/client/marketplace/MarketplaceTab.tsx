/** The 插件市场 tab: catalog cards with GitHub links and one-click install. */

import { useEffect, useState } from 'react'
import { IconChevronDownOutline14, Menu } from '@deepseek-ai/dsh-client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime, TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import type { MarketplaceInjected } from './controller.ts'
import type { MarketplaceEntry } from './manifest.ts'
import css from './MarketplaceTab.module.css'

/** Props the renderer binds for the tab. */
export type MarketplaceTabProps =
  PropsRuntime<'settings.plugins.tab'>
  & PropsLocale<'marketplace'>
  & InjectFace<MarketplaceInjected>

/** Selectable discovery counts. */
const DISCOVER_LIMITS = [10, 20, 30, 50] as const

/**
 * Render the marketplace tab content.
 * @param props - composed slot props + injected controller face.
 * @returns the tab element tree.
 */
export function MarketplaceTab({ t, useMarketplace, install, refresh, setDiscoverSort, setDiscoverLimit }: MarketplaceTabProps) {
  const state = useMarketplace((value) => value)
  const translator = t as TranslateNS<'marketplace'>
  const [flash, setFlash] = useState<string | null>(null)
  const [sortOpen, setSortOpen] = useState(false)
  const [limitOpen, setLimitOpen] = useState(false)

  // Flash the "copied" badge for a couple of seconds.
  useEffect(() => {
    if (state.copiedId === null) return
    setFlash(state.copiedId)
    const timer = setTimeout(() => setFlash(null), 2500)
    return () => clearTimeout(timer)
  }, [state.copiedId])

  return (
    <div className={css.section}>
      <h2 className={css.heading}>{translator('title')}</h2>
      <p className={css.intro}>{translator('intro')}</p>
      <div className={css.toolbar}>
        <span className={css.source}>
          {translator('source')}：{translator(state.source === 'remote' ? 'source.remote' : 'source.bundled')}
          {state.discoveredTotal !== null && ` · ${translator('total')}：${state.discoveredTotal}`}
        </span>
        <div className={css.toolbarRight}>
          <Menu
            open={sortOpen}
            onClose={() => { setSortOpen(false) }}
            items={[
              { id: 'stars', label: translator('sort.stars') },
              { id: 'date', label: translator('sort.date') },
            ]}
            selectedId={state.sort}
            onSelect={(id) => {
              setSortOpen(false)
              if (id === 'stars' || id === 'date') setDiscoverSort(id)
            }}
            align="end"
            portal
            anchor={(
              <button type="button" className={css.selector} aria-haspopup="menu" aria-expanded={sortOpen} onClick={() => { setSortOpen((value) => !value) }}>
                {translator(state.sort === 'date' ? 'sort.date' : 'sort.stars')}
                <IconChevronDownOutline14 className={css.chevron} />
              </button>
            )}
          />
          <Menu
            open={limitOpen}
            onClose={() => { setLimitOpen(false) }}
            items={DISCOVER_LIMITS.map((count) => ({ id: String(count), label: String(count) }))}
            selectedId={String(state.limit)}
            onSelect={(id) => {
              setLimitOpen(false)
              const count = Number(id)
              if (Number.isFinite(count)) setDiscoverLimit(count)
            }}
            align="end"
            portal
            anchor={(
              <button type="button" className={css.selector} aria-haspopup="menu" aria-expanded={limitOpen} onClick={() => { setLimitOpen((value) => !value) }}>
                {String(state.limit)}
                <IconChevronDownOutline14 className={css.chevron} />
              </button>
            )}
          />
          <button type="button" className={css.refresh} onClick={refresh} disabled={state.refreshing}>
            {state.refreshing ? translator('refreshing') : translator('refresh')}
          </button>
        </div>
      </div>

      {state.error !== null && (
        <div className={css.error} role="alert">
          <p className={css.errorTitle}>{translator('error')}</p>
          <p className={css.errorHint}>{translator('errorHint')}</p>
          {state.error.attempts.length > 0 && (
            <ul className={css.errorList}>
              {state.error.attempts.map((attempt) => (
                <li key={attempt.url} className={css.errorItem}>
                  <span className={css.errorUrl}>{attempt.url}</span>
                  <span className={css.errorCode}>
                    {translator(
                      attempt.failure.code === 'network'
                        ? 'errorNetwork'
                        : attempt.failure.code === 'http'
                          ? 'errorHttp'
                          : 'errorInvalid',
                    )}
                    {attempt.failure.code === 'http' && 'status' in attempt.failure
                      ? ` (${attempt.failure.status})`
                      : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className={css.list}>
        {state.entries.length === 0 ? (
          <p className={css.intro}>{translator('empty')}</p>
        ) : state.entries.map((entry) => (
          <MarketplaceCard
            key={entry.id}
            entry={entry}
            installed={state.installed.has(entry.package)}
            copied={flash === entry.id}
            t={translator}
            onInstall={install}
          />
        ))}
      </div>
    </div>
  )
}

/** One marketplace card. */
function MarketplaceCard({
  entry, installed, copied, t, onInstall,
}: {
  entry: MarketplaceEntry
  installed: boolean
  copied: boolean
  t: TranslateNS<'marketplace'>
  onInstall: (entry: MarketplaceEntry) => void
}) {
  return (
    <div className={css.card}>
      <div className={css.body}>
        <div className={css.nameRow}>
          <span className={css.name}>{entry.name}</span>
          {installed && <span className={css.badge}>{t('installed')}</span>}
        </div>
        <span className={css.pkg}>{entry.package}</span>
        <p className={css.description}>{entry.description}</p>
        {copied && <p className={`${css.hint} ${css.copied}`}>{t('copied')}</p>}
        {!installed && <p className={css.hint}>{t('installHint')}</p>}
      </div>
      <div className={css.actions}>
        {entry.repoUrl !== '' && (
          <a className={css.github} href={entry.repoUrl} target="_blank" rel="noreferrer">
            {t('openOnGitHub')}
          </a>
        )}
        <button
          type="button"
          className={installed ? `${css.install} ${css.installInstalled}` : css.install}
          disabled={installed}
          onClick={() => onInstall(entry)}
        >
          {copied ? t('copied') : installed ? t('installed') : t('install')}
        </button>
      </div>
    </div>
  )
}
