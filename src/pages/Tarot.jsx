import { useMemo, useState } from 'react'

const TAROT_POOL = [
  { key: 'fool', name: '愚者', upright: '新起点、勇敢尝试、保持开放。', reversed: '犹豫不决、冲动冒进、缺少计划。' },
  { key: 'magician', name: '魔术师', upright: '资源整合力强，行动会带来结果。', reversed: '目标分散，执行断续，容易失焦。' },
  { key: 'high-priestess', name: '女祭司', upright: '倾听直觉，先观察再出手。', reversed: '信息不对称，情绪影响判断。' },
  { key: 'empress', name: '皇后', upright: '关系与成长并进，适合长期投入。', reversed: '投入失衡，注意边界和节奏。' },
  { key: 'emperor', name: '皇帝', upright: '建立规则，强化掌控，推进落地。', reversed: '控制过强，协作阻力增加。' },
  { key: 'lovers', name: '恋人', upright: '价值观对齐，适合做关键选择。', reversed: '关系拉扯，先厘清真实诉求。' },
  { key: 'chariot', name: '战车', upright: '执行窗口打开，适合加速推进。', reversed: '方向不稳，先定主线再冲刺。' },
  { key: 'strength', name: '力量', upright: '稳定内核，以柔克刚。', reversed: '情绪耗损，先恢复再决策。' },
  { key: 'hermit', name: '隐者', upright: '回到内在，做深度复盘。', reversed: '过度封闭，忽视外部反馈。' },
  { key: 'wheel', name: '命运之轮', upright: '阶段转机，顺势而为。', reversed: '节奏波动，控制风险优先。' },
  { key: 'justice', name: '正义', upright: '事实导向，讲规则讲平衡。', reversed: '决策偏主观，证据不足。' },
  { key: 'sun', name: '太阳', upright: '信心与能量提升，结果可见。', reversed: '期望过高，注意现实约束。' },
]

const CARD_BACK = '✶'

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

function cardPosition(index, total) {
  const span = total > 1 ? 220 : 0
  const x = total > 1 ? -span / 2 + (span / (total - 1)) * index : 0
  const yCurve = Math.abs(index - (total - 1) / 2)
  const y = yCurve * 18
  const rotate = (index - (total - 1) / 2) * 8
  return { x, y, rotate }
}

export default function Tarot() {
  const [question, setQuestion] = useState('')
  const [stage, setStage] = useState('form') // form | draw | result
  const [revealed, setRevealed] = useState([false, false, false])
  const [cards, setCards] = useState([])

  const allRevealed = revealed.every(Boolean)

  const drawCards = () => {
    const nextCards = pickCards(question, 3)
    setCards(nextCards)
    setRevealed([false, false, false])
    setStage('draw')
  }

  const revealCard = (idx) => {
    setRevealed((prev) => {
      const next = [...prev]
      next[idx] = true
      return next
    })
  }

  const summary = useMemo(() => {
    if (cards.length === 0) return ''
    const [past, now, future] = cards
    return `过去位「${past.name}」提示你这件事的起因；现在位「${now.name}」说明当前主轴；未来位「${future.name}」给出后续趋势。`
  }, [cards])

  return (
    <div className="page page-wide">
      <div className="page-header">
        <h1>🃏 塔罗占卜</h1>
        <p>输入问题，抽取三张牌：过去、现在、未来。</p>
      </div>

      {stage === 'form' && (
        <div className="card" style={{ maxWidth: 760, margin: '0 auto' }}>
          <div className="input-group">
            <label>你的问题</label>
            <input
              type="text"
              placeholder="例如：我近期是否适合换工作？"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={drawCards}>
            开始抽牌
          </button>
        </div>
      )}

      {stage !== 'form' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 14 }}>
            问题：{question || '未填写具体问题'}
          </div>
          <div style={{ position: 'relative', height: 320 }}>
            {cards.map((card, idx) => {
              const pos = cardPosition(idx, cards.length)
              const isOpen = revealed[idx]
              return (
                <button
                  key={card.key}
                  type="button"
                  onClick={() => revealCard(idx)}
                  className={`tarot-card ${isOpen ? 'open' : ''}`}
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: 34 + pos.y,
                    transform: `translateX(${pos.x}px) rotate(${pos.rotate}deg)`,
                  }}
                >
                  {!isOpen ? (
                    <div className="tarot-back">
                      <div className="tarot-star">{CARD_BACK}</div>
                    </div>
                  ) : (
                    <div className={`tarot-front ${card.reversed ? 'reversed' : ''}`}>
                      <div className="tarot-title">{card.name}</div>
                      <div className="tarot-orientation">{card.reversed ? '逆位' : '正位'}</div>
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {allRevealed && (
            <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
              <div className="reading-card">
                <div className="reading-card-title">整体结论</div>
                <div className="reading-card-content">{summary}</div>
              </div>
              <div className="grid-3">
                {cards.map((card, idx) => (
                  <div key={`${card.key}-detail`} className="reading-card">
                    <div className="reading-card-title">
                      {idx === 0 ? '过去' : idx === 1 ? '现在' : '未来'} · {card.name}（{card.reversed ? '逆位' : '正位'}）
                    </div>
                    <div className="reading-card-content">
                      {card.reversed ? card.reversed : card.upright}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-secondary" onClick={() => setStage('form')}>
                  重新提问
                </button>
                <button className="btn btn-primary" onClick={drawCards}>
                  再抽一次
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
