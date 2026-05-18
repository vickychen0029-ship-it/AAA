import { useEffect, useMemo, useRef, useState } from 'react'
import { interpretTarot } from '../services/tarotApi.js'

const TAROT_POOL = [
  { key: 'fool', name: '愚者', upright: '新起点、勇敢尝试、保持开放。', reversed: '犹豫不决、冲动冒进、缺少计划。' },
  { key: 'magician', name: '魔术师', upright: '资源整合力强，行动会带来结果。', reversed: '目标分散，执行断续，容易失焦。' },
  { key: 'high-priestess', name: '女祭司', upright: '倾听直觉，先观察再出手。', reversed: '信息不对称，情绪影响判断。' },
  { key: 'empress', name: '皇后', upright: '关系与成长并进，适合长期投入。', reversed: '投入失衡，注意边界和节奏。' },
  { key: 'emperor', name: '皇帝', upright: '建立规则，强化掌控，推进落地。', reversed: '控制过强，协作阻力增加。' },
  { key: 'hierophant', name: '教皇', upright: '遵循体系，借助经验稳步推进。', reversed: '形式先于本质，容易失去弹性。' },
  { key: 'lovers', name: '恋人', upright: '价值观对齐，适合做关键选择。', reversed: '关系拉扯，先厘清真实诉求。' },
  { key: 'chariot', name: '战车', upright: '执行窗口打开，适合加速推进。', reversed: '方向不稳，先定主线再冲刺。' },
  { key: 'strength', name: '力量', upright: '稳定内核，以柔克刚。', reversed: '情绪耗损，先恢复再决策。' },
  { key: 'hermit', name: '隐者', upright: '回到内在，做深度复盘。', reversed: '过度封闭，忽视外部反馈。' },
  { key: 'wheel', name: '命运之轮', upright: '阶段转机，顺势而为。', reversed: '节奏波动，控制风险优先。' },
  { key: 'justice', name: '正义', upright: '事实导向，讲规则讲平衡。', reversed: '决策偏主观，证据不足。' },
  { key: 'hanged-man', name: '倒吊人', upright: '换个视角，暂停是为了更优解。', reversed: '拖延与内耗并存，卡点未破。' },
  { key: 'death', name: '死神', upright: '旧阶段结束，新秩序正在形成。', reversed: '不愿割舍，重复旧问题。' },
  { key: 'temperance', name: '节制', upright: '调和资源，节奏稳定有利。', reversed: '过度用力，失去平衡感。' },
  { key: 'devil', name: '恶魔', upright: '看见执念与束缚，才能脱困。', reversed: '开始松绑，重建主动权。' },
  { key: 'tower', name: '高塔', upright: '突发变化逼你重构底层逻辑。', reversed: '冲击减弱，但隐患仍需处理。' },
  { key: 'star', name: '星星', upright: '希望恢复，愿景开始可执行。', reversed: '信心不足，需要外部支持。' },
  { key: 'moon', name: '月亮', upright: '不确定性上升，先辨真伪。', reversed: '迷雾散去，判断更清晰。' },
  { key: 'sun', name: '太阳', upright: '信心与能量提升，结果可见。', reversed: '期望过高，注意现实约束。' },
  { key: 'judgement', name: '审判', upright: '阶段复盘后迎来关键决定。', reversed: '过去未清，决断被反复拖慢。' },
  { key: 'world', name: '世界', upright: '闭环完成，进入更大舞台。', reversed: '收尾不足，最后一步要补齐。' },
]

const CARD_BACK = '✦'
const POSITIONS = ['过去', '现在', '未来']
const MAJOR_IMG_INDEX = {
  fool: 0,
  magician: 1,
  'high-priestess': 2,
  empress: 3,
  emperor: 4,
  hierophant: 5,
  lovers: 6,
  chariot: 7,
  strength: 8,
  hermit: 9,
  wheel: 10,
  justice: 11,
  'hanged-man': 12,
  death: 13,
  temperance: 14,
  devil: 15,
  tower: 16,
  star: 17,
  moon: 18,
  sun: 19,
  judgement: 20,
  world: 21,
}
const CARD_ART = {
  fool: { symbol: '⛰', title: '旅者', primary: '#4767d8', secondary: '#f4be59' },
  magician: { symbol: '✶', title: '意志', primary: '#5a54d6', secondary: '#d9a24c' },
  'high-priestess': { symbol: '☾', title: '直觉', primary: '#354b8d', secondary: '#9fb7ff' },
  empress: { symbol: '❀', title: '丰饶', primary: '#7a4fb0', secondary: '#f2a9c7' },
  emperor: { symbol: '♜', title: '秩序', primary: '#35528f', secondary: '#d79a54' },
  hierophant: { symbol: '✠', title: '信条', primary: '#49518f', secondary: '#cfc6ad' },
  lovers: { symbol: '♥', title: '联结', primary: '#9a4f7b', secondary: '#f2b49f' },
  chariot: { symbol: '⚑', title: '推进', primary: '#385d96', secondary: '#99baf9' },
  strength: { symbol: '♌', title: '内力', primary: '#8a5a33', secondary: '#f0c76b' },
  hermit: { symbol: '☼', title: '独照', primary: '#3e4a66', secondary: '#d3d8df' },
  wheel: { symbol: '☸', title: '转机', primary: '#4f5fb2', secondary: '#c1a56b' },
  justice: { symbol: '⚖', title: '衡量', primary: '#395186', secondary: '#c9cfd8' },
  'hanged-man': { symbol: '⌇', title: '倒悬', primary: '#446284', secondary: '#8cb8c7' },
  death: { symbol: '☠', title: '蜕变', primary: '#2f3547', secondary: '#9ea8be' },
  temperance: { symbol: '⚗', title: '调和', primary: '#497fa1', secondary: '#aed9e8' },
  devil: { symbol: '♄', title: '束缚', primary: '#41344f', secondary: '#bb7292' },
  tower: { symbol: '⚡', title: '崩解', primary: '#4a3b5f', secondary: '#f0a564' },
  star: { symbol: '✷', title: '希望', primary: '#3c6ca8', secondary: '#a6d6ff' },
  moon: { symbol: '☽', title: '迷雾', primary: '#30476f', secondary: '#9bb2da' },
  sun: { symbol: '☀', title: '显化', primary: '#8f5b2f', secondary: '#f6cd6d' },
  judgement: { symbol: '⟁', title: '召唤', primary: '#4b5f9c', secondary: '#c6d5ff' },
  world: { symbol: '◎', title: '完成', primary: '#39607f', secondary: '#8ad1b9' },
}

function getCardArt(key) {
  return CARD_ART[key] || { symbol: '✦', title: '奥义', primary: '#3f5ea8', secondary: '#d7b983' }
}

function getCardImagePath(cardKey) {
  const index = MAJOR_IMG_INDEX[cardKey]
  if (typeof index !== 'number') return ''
  return `/tarot/rws/m${String(index).padStart(2, '0')}.jpg`
}

function pickCards(seedText, count = 3) {
  const text = String(seedText || 'tarot')
  let hash = 0
  for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) >>> 0
  const deck = [...TAROT_POOL]
  const result = []
  for (let i = 0; i < count; i += 1) {
    const idx = hash % deck.length
    const picked = deck.splice(idx, 1)[0]
    const reversed = ((hash >> (i + 3)) & 1) === 1
    result.push({ ...picked, reversed })
    hash = (hash * 1103515245 + 12345) >>> 0
  }
  return result
}

function cardPosition(index, total, phase, pickOrder = -1) {
  const shiftX = -86
  if (phase === 'focus' && pickOrder >= 0) {
    const xMap = [-150, 0, 150]
    const yMap = [18, 0, 18]
    const rMap = [-5, 0, 5]
    return { x: xMap[pickOrder] + shiftX, y: yMap[pickOrder], rotate: rMap[pickOrder] }
  }
  // selection phase: 5 cards per row, two-row layout when total=10
  const cols = 5
  const row = Math.floor(index / cols)
  const rowStart = row * cols
  const rowSize = Math.min(cols, total - rowStart)
  const colInRow = index - rowStart
  const x = (colInRow - (rowSize - 1) / 2) * 148 + shiftX
  const rowCount = Math.ceil(total / cols)
  const y = (row - (rowCount - 1) / 2) * 138
  return { x, y, rotate: 0 }
}

export default function Tarot() {
  const [question, setQuestion] = useState('')
  const [stage, setStage] = useState('idle') // idle | dealing | spread
  const [deckCards, setDeckCards] = useState([])
  const [revealedMap, setRevealedMap] = useState({})
  const [pickedIndices, setPickedIndices] = useState([])
  const [aiReading, setAiReading] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [aiRequestedKey, setAiRequestedKey] = useState('')
  const [aiRetryNonce, setAiRetryNonce] = useState(0)
  const [spreadSize, setSpreadSize] = useState(10)
  const timerRef = useRef(null)

  const selectedCards = useMemo(
    () => pickedIndices.map((idx) => deckCards[idx]).filter(Boolean),
    [pickedIndices, deckCards],
  )
  const allRevealed = selectedCards.length === 3
  const phase = allRevealed ? 'focus' : 'select'

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const scheduleStage = (nextStage, delay = 0) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setStage(nextStage)
      timerRef.current = null
    }, delay)
  }

  const drawCards = () => {
    const nextDeck = pickCards(question, spreadSize)
    setDeckCards(nextDeck)
    setRevealedMap({})
    setPickedIndices([])
    setAiReading(null)
    setAiError('')
    setAiLoading(false)
    setAiRequestedKey('')
    setAiRetryNonce(0)
    setStage('dealing')
    scheduleStage('spread', 480)
  }

  const revealCard = (idx) => {
    if (stage !== 'spread') return
    setPickedIndices((prev) => {
      if (prev.includes(idx) || prev.length >= 3) return prev
      const next = [...prev, idx]
      setRevealedMap((prevReveal) => ({ ...prevReveal, [idx]: true }))
      return next
    })
  }

  const summary = useMemo(() => {
    if (selectedCards.length < 3) return ''
    const [past, now, future] = selectedCards
    return `过去位「${past.name}」提示你这件事的起因；现在位「${now.name}」说明当前主轴；未来位「${future.name}」给出后续趋势。`
  }, [selectedCards])

  useEffect(() => {
    let cancelled = false
    let watchdog = null
    const run = async () => {
      if (!allRevealed || selectedCards.length !== 3 || aiLoading || aiReading) return
      const requestKey = `${question}|${selectedCards.map((card) => `${card.key}:${card.reversed ? 'R' : 'U'}`).join('|')}`
      if (aiRequestedKey === requestKey) return
      setAiRequestedKey(requestKey)
      setAiLoading(true)
      setAiError('')
      watchdog = setTimeout(() => {
        if (cancelled) return
        setAiLoading(false)
        setAiError('深度解析超时，已切换本地解读。')
      }, 28000)
      try {
        const payload = {
          question: question || '',
          cards: selectedCards.map((card, idx) => ({
            position: POSITIONS[idx],
            key: card.key,
            name: card.name,
            orientation: card.reversed ? '逆位' : '正位',
            base_meaning: card.reversed ? card.reversed : card.upright,
          })),
        }
        const result = await interpretTarot(payload)
        if (!cancelled) setAiReading(result)
      } catch (err) {
        if (!cancelled) {
          const msg = err?.message || ''
          if (/not found|404/i.test(msg)) {
            setAiError('深度解析接口未就绪，已显示本地解读。请等待最新版本部署完成。')
          } else if (/method not allowed|405/i.test(msg.toLowerCase())) {
            setAiError('深度解析服务路由异常，已切换本地解读。')
          } else if (/超时/.test(msg)) {
            setAiError('深度解析超时，已切换本地解读。')
          } else {
            setAiError(msg || '深度解析失败，已显示本地解读。')
          }
        }
      } finally {
        if (watchdog) {
          clearTimeout(watchdog)
          watchdog = null
        }
        if (!cancelled) setAiLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
      if (watchdog) clearTimeout(watchdog)
    }
  }, [allRevealed, selectedCards, question, aiRetryNonce])

  return (
    <div className="page page-wide tarotx-page">
      <div className="page-header">
        <h1>🃏 塔罗占卜</h1>
        <p>输入问题后抽取三张牌，按顺序点击翻开。</p>
      </div>

      <div className="tarotx-layout">
        <aside className="tarotx-control">
          <div className="tarotx-control-title">提问与抽牌</div>
          <div className="tarotx-control-note">请用一句话描述你当下最想确认的问题。</div>
          <div className="input-group">
            <label>你的问题</label>
            <input
              type="text"
              placeholder="例如：我最近是否适合换工作方向？"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label>牌阵模式</label>
            <select value={spreadSize} onChange={(e) => setSpreadSize(Number(e.target.value))}>
              <option value={10}>10张牌阵（推荐）</option>
              <option value={7}>7张牌阵</option>
            </select>
          </div>
          <button className="btn btn-primary btn-block" onClick={drawCards}>
            开始抽牌
          </button>
          <button
            className="btn btn-secondary btn-block"
            onClick={() => {
              if (timerRef.current) clearTimeout(timerRef.current)
              setQuestion('')
              setDeckCards([])
              setRevealedMap({})
              setPickedIndices([])
              setAiReading(null)
              setAiError('')
              setAiLoading(false)
              setAiRequestedKey('')
              setAiRetryNonce(0)
              setStage('idle')
            }}
          >
            重置
          </button>
          <div className="tarotx-tips">
            <div>• 先展开 {spreadSize} 张牌，再选 3 张进行解读</div>
            <div>• 选择顺序对应：过去 / 现在 / 未来</div>
            <div>• 每次提问都会生成新的牌阵</div>
          </div>
        </aside>

        <section className="tarotx-stage-wrap">
          <div className="tarotx-stage-topbar">
            <span className="tarotx-stage-dot" />
            <span className="tarotx-stage-dot" />
            <span className="tarotx-stage-dot" />
            <span className="tarotx-stage-title">命盘感应牌阵</span>
            <span className="tarotx-stage-step">已选 {pickedIndices.length} / 3</span>
          </div>
          <div className="tarotx-question">
            <span className="tarotx-question-label">问题</span>
            <span>{question || '未填写具体问题'}</span>
          </div>
          <div className={`tarotx-stage ${stage === 'dealing' ? 'is-dealing' : ''}`}>
            {stage === 'idle' && (
              <div className="tarotx-empty">
                <div className="tarotx-empty-icon">✧</div>
                <div className="tarotx-empty-title">准备就绪</div>
                <div className="tarotx-empty-sub">在左侧输入问题后点击开始抽牌</div>
              </div>
            )}
            {stage === 'dealing' && <div className="tarotx-dealing-badge">正在洗牌...</div>}

            {stage !== 'idle' &&
              (allRevealed ? pickedIndices : deckCards.map((_, i) => i)).map((idx, visibleIdx, visibleArr) => {
                const card = deckCards[idx]
                if (!card) return null
                const pickOrder = pickedIndices.indexOf(idx)
                const isOpen = !!revealedMap[idx]
                const isLocked = pickedIndices.length >= 3 && pickOrder === -1
                const cardText = card.reversed ? card.reversed : card.upright
                const art = getCardArt(card.key)
                const pos = cardPosition(visibleIdx, visibleArr.length, phase, pickOrder)
                return (
                  <button
                    key={card.key}
                    type="button"
                    onClick={() => revealCard(idx)}
                    className={[
                      'tarotx-card',
                      isOpen ? 'open' : '',
                      isLocked ? 'locked' : '',
                      stage === 'dealing' ? 'dealing' : '',
                      phase === 'select' ? 'flat' : 'focus',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    style={{
                      '--tx': `${pos.x}px`,
                      '--ty': `${pos.y}px`,
                      '--rt': `${pos.rotate}deg`,
                      '--delay': `${idx * 80}ms`,
                      '--stack': `${idx}`,
                      zIndex: isOpen ? 200 + pickOrder : 20 + idx,
                    }}
                  >
                    <div className="tarotx-card-inner">
                      <div className="tarotx-face tarotx-face-back">
                        <div className="tarotx-back-frame">
                          {pickOrder !== -1 && <div className="tarotx-pick-badge">{POSITIONS[pickOrder]}</div>}
                          <div className="tarotx-back-star">{CARD_BACK}</div>
                        </div>
                      </div>
                      <div className={`tarotx-face tarotx-face-front ${card.reversed ? 'reversed' : ''}`}>
                        <div className="tarotx-front-position">{pickOrder !== -1 ? POSITIONS[pickOrder] : '未选'}</div>
                        <div className="tarotx-illustration" style={{ '--ill-a': art.primary, '--ill-b': art.secondary }}>
                          <div className="tarotx-ill-header">
                            <span>{card.name}</span>
                            <span>{art.title}</span>
                          </div>
                          <div className="tarotx-ill-image-wrap">
                            <img
                              src={getCardImagePath(card.key)}
                              alt={card.name}
                              className="tarotx-ill-image"
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                                const fallback = e.currentTarget.nextElementSibling
                                if (fallback) fallback.style.display = 'flex'
                              }}
                            />
                            <div className="tarotx-ill-fallback">{art.symbol}</div>
                          </div>
                          <div className="tarotx-ill-footer">{card.reversed ? 'REVERSED' : 'UPRIGHT'}</div>
                        </div>
                        <div className="tarotx-front-orientation">{card.reversed ? '逆位' : '正位'}</div>
                        <div className="tarotx-front-desc">{cardText}</div>
                      </div>
                    </div>
                  </button>
                )
              })}
          </div>

          {allRevealed && (
            <div className="tarotx-reading">
              <div className="reading-card">
                <div className="reading-card-title">深度解析</div>
                <div className="reading-card-content">{aiReading?.overall || summary}</div>
                {aiLoading && <div className="tarotx-ai-hint">正在生成深度解析...</div>}
                {!!aiError && <div className="tarotx-ai-error">{aiError}</div>}
                {!aiLoading && !!aiError && (
                  <button
                    type="button"
                    className="tarotx-ai-retry"
                    onClick={() => {
                      setAiReading(null)
                      setAiError('')
                      setAiRequestedKey('')
                      setAiRetryNonce((n) => n + 1)
                    }}
                  >
                    重试深度解析
                  </button>
                )}
              </div>
              <div className="grid-3">
                {selectedCards.map((card, idx) => {
                  const aiCard = aiReading?.cards?.[idx]
                  return (
                  <div key={`${card.key}-detail`} className="reading-card">
                    <div className="reading-card-title">
                      {POSITIONS[idx]} · {card.name}（{card.reversed ? '逆位' : '正位'}）
                    </div>
                    <div className="reading-card-content">{aiCard?.analysis || (card.reversed ? card.reversed : card.upright)}</div>
                  </div>
                  )
                })}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
