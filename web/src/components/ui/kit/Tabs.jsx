import { createContext, use, useId, useRef, useState } from 'react'
import clsx from 'clsx'
import { useSlidingIndicator } from './hooks.js'
import './tabs.css'

const TabsContext = createContext(null)
const useTabs = () => use(TabsContext)

// Arrow / Home / End move through the enabled items of a roving-tabindex group and select the one that receives focus.
function onGroupKeyDown(event, itemSelector, horizontalOnly = false) {
  const items = [...event.currentTarget.querySelectorAll(itemSelector)].filter((item) => !item.disabled)
  const index = items.indexOf(document.activeElement)
  if (index < 0) return
  const forward = event.key === 'ArrowRight' || (!horizontalOnly && event.key === 'ArrowDown')
  const backward = event.key === 'ArrowLeft' || (!horizontalOnly && event.key === 'ArrowUp')
  let target = null
  if (forward) target = items[(index + 1) % items.length]
  else if (backward) target = items[(index - 1 + items.length) % items.length]
  else if (event.key === 'Home') target = items[0]
  else if (event.key === 'End') target = items[items.length - 1]
  if (!target) return
  event.preventDefault()
  target.focus()
  target.click()
}

/**
 * Tabs: `<Tabs defaultValue="a"><TabList label="…"><Tab value="a">A</Tab>…</TabList><TabPanel value="a">…</TabPanel></Tabs>`.
 * Roving tabindex, automatic activation on arrow keys / Home / End, and a spring-sliding indicator.
 */
export function Tabs({ value: valueProp, defaultValue, onValueChange, className, children }) {
  const baseId = useId()
  const [internal, setInternal] = useState(defaultValue)
  const value = valueProp ?? internal
  const select = (next) => {
    if (valueProp === undefined) setInternal(next)
    onValueChange?.(next)
  }
  return (
    <TabsContext value={{ baseId, value, select }}>
      <div className={clsx('ui-tabs', className)}>{children}</div>
    </TabsContext>
  )
}

export function TabList({ label, className, children }) {
  const { value } = useTabs()
  const listRef = useRef(null)
  const barRef = useRef(null)
  useSlidingIndicator(listRef, barRef, value)
  return (
    <div ref={listRef} role="tablist" aria-label={label} className={clsx('ui-seg', className)} onKeyDown={(event) => onGroupKeyDown(event, '[role="tab"]', true)}>
      <span ref={barRef} className="ui-seg__indicator" aria-hidden="true" />
      {children}
    </div>
  )
}

export function Tab({ value: tabValue, icon: Icon, disabled = false, children }) {
  const { baseId, value, select } = useTabs()
  const active = value === tabValue
  return (
    <button
      type="button"
      role="tab"
      id={`${baseId}-tab-${tabValue}`}
      aria-selected={active}
      aria-controls={`${baseId}-panel-${tabValue}`}
      tabIndex={active ? 0 : -1}
      data-active={active}
      disabled={disabled}
      className="ui-seg__item"
      onClick={() => select(tabValue)}
    >
      {Icon ? <Icon className="ui-seg__icon" aria-hidden="true" /> : null}
      {children}
    </button>
  )
}

export function TabPanel({ value: tabValue, className, children }) {
  const { baseId, value } = useTabs()
  const active = value === tabValue
  return (
    <div role="tabpanel" id={`${baseId}-panel-${tabValue}`} aria-labelledby={`${baseId}-tab-${tabValue}`} tabIndex={0} hidden={!active} className={clsx('ui-tabs__panel', className)}>
      {children}
    </div>
  )
}

/**
 * Single-choice segmented control (a radio group): `options` is `[{ value, label, icon? }]`.
 * Same sliding indicator and keyboard model as Tabs.
 */
export function SegmentedControl({ options, value, onChange, label, size = 'md', className }) {
  const listRef = useRef(null)
  const barRef = useRef(null)
  useSlidingIndicator(listRef, barRef, value)
  return (
    <div ref={listRef} role="radiogroup" aria-label={label} className={clsx('ui-seg', `ui-seg--${size}`, className)} onKeyDown={(event) => onGroupKeyDown(event, '[role="radio"]')}>
      <span ref={barRef} className="ui-seg__indicator" aria-hidden="true" />
      {options.map(({ value: optionValue, label: optionLabel, icon: Icon, disabled }) => {
        const active = optionValue === value
        return (
          <button
            key={optionValue}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            data-active={active}
            disabled={disabled}
            className="ui-seg__item"
            onClick={() => onChange?.(optionValue)}
          >
            {Icon ? <Icon className="ui-seg__icon" aria-hidden="true" /> : null}
            {optionLabel}
          </button>
        )
      })}
    </div>
  )
}
