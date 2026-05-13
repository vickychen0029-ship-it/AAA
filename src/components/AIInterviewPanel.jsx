import { useEffect, useMemo, useState } from 'react'
import {
  exportSystemInterview,
  getLatestSystemInterview,
  startSystemInterview,
  submitSystemInterviewAnswer,
} from '../services/aiInterviewApi.js'

const INTERVIEW_SECTIONS = [
  { key: 'career', label: '事业', hint: '职业路径、管理能力、关键决策' },
  { key: 'love', label: '爱情', hint: '关系模式、沟通冲突、亲密边界' },
  { key: 'wealth', label: '财运', hint: '收入结构、现金流、风险偏好' },
  { key: 'health', label: '健康', hint: '作息压力、恢复能力、生活节律' },
]

export default function AIInterviewPanel({
  systemType,
  profile,
  payload,
  title = '命盘深度访谈解析',
}) {
  const [interviewSessions, setInterviewSessions] = useState({})
  const [interviewLoading, setInterviewLoading] = useState(false)
  const [interviewBusy, setInterviewBusy] = useState(false)
  const [interviewError, setInterviewError] = useState('')
  const [activeSection, setActiveSection] = useState('career')
  const [answerInputBySection, setAnswerInputBySection] = useState({})
  const [feedbackBySection, setFeedbackBySection] = useState({})
  const [exportCopied, setExportCopied] = useState(false)

  const canRunInterview = Boolean(systemType && profile?.id && payload)

  const stablePayload = useMemo(() => payload, [payload])

  useEffect(() => {
    if (!canRunInterview) return
    let canceled = false
    const loadLatest = async () => {
      setInterviewLoading(true)
      setInterviewError('')
      try {
        const pairs = await Promise.all(
          INTERVIEW_SECTIONS.map(async (s) => {
            try {
              const data = await getLatestSystemInterview(systemType, profile.id, s.key)
              return [s.key, data]
            } catch {
              return [s.key, null]
            }
          }),
        )
        if (!canceled) {
          setInterviewSessions(Object.fromEntries(pairs))
        }
      } catch {
        if (!canceled) setInterviewSessions({})
      } finally {
        if (!canceled) setInterviewLoading(false)
      }
    }
    loadLatest()
    return () => { canceled = true }
  }, [canRunInterview, profile?.id, systemType, stablePayload])

  const handleStartInterview = async (sectionKey) => {
    if (!canRunInterview) return
    setInterviewBusy(true)
    setInterviewError('')
    try {
      const session = await startSystemInterview(systemType, {
        profile_id: profile.id,
        system_payload: payload,
        target_section: sectionKey,
      })
      setInterviewSessions((prev) => ({ ...prev, [sectionKey]: session }))
      setActiveSection(sectionKey)
      setAnswerInputBySection((prev) => ({ ...prev, [sectionKey]: null }))
      setFeedbackBySection((prev) => ({ ...prev, [sectionKey]: '' }))
    } catch (err) {
      setInterviewError(err instanceof Error ? err.message : '启动访谈失败')
    } finally {
      setInterviewBusy(false)
    }
  }

  const handleSubmitAnswer = async (sectionKey) => {
    const session = interviewSessions[sectionKey]
    const selected = answerInputBySection[sectionKey]
    if (!session?.session_id) return
    if (!selected?.key || !selected?.text) return
    setInterviewBusy(true)
    setInterviewError('')
    try {
      const updated = await submitSystemInterviewAnswer(systemType, session.session_id, {
        option_key: selected.key,
        option_text: selected.text,
      })
      setInterviewSessions((prev) => ({ ...prev, [sectionKey]: updated }))
      setAnswerInputBySection((prev) => ({ ...prev, [sectionKey]: null }))
      if (updated.feedback) {
        setFeedbackBySection((prev) => ({ ...prev, [sectionKey]: updated.feedback }))
      }
    } catch (err) {
      setInterviewError(err instanceof Error ? err.message : '提交答案失败')
    } finally {
      setInterviewBusy(false)
    }
  }

  const handleExport = async (sectionKey) => {
    const session = interviewSessions[sectionKey]
    if (!session?.session_id) return
    setInterviewBusy(true)
    setInterviewError('')
    try {
      const exported = await exportSystemInterview(systemType, session.session_id)
      const blob = new Blob([exported.markdown], { type: 'text/markdown;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${systemType}-interview-${sectionKey}-${profile.nickname || profile.id}.md`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      try {
        await navigator.clipboard.writeText(exported.markdown)
        setExportCopied(true)
        setTimeout(() => setExportCopied(false), 1200)
      } catch {
        setExportCopied(false)
      }
    } catch (err) {
      setInterviewError(err instanceof Error ? err.message : '导出失败')
    } finally {
      setInterviewBusy(false)
    }
  }

  const activeSession = interviewSessions[activeSection] || null

  return (
    <div className="card mt-24">
      <h3 style={{ marginBottom: 10 }}>{title}</h3>
      <p style={{ fontSize: '0.8125rem', marginBottom: 10 }}>
        四大板块独立访谈：每个板块10题，按你的命盘结构递进追问。
      </p>
      <p style={{ fontSize: '0.75rem', color: '#9a3412', marginBottom: 12 }}>
        健康板块仅作参考，不替代医疗建议。
      </p>

      <div className="bazi-ai-entry-grid">
        {INTERVIEW_SECTIONS.map((s) => {
          const session = interviewSessions[s.key]
          const total = session?.total_questions || 10
          const done = session?.answered_count || 0
          const pct = Math.min(100, Math.round((done / total) * 100))
          return (
            <div key={s.key} className={`bazi-ai-entry-card ${activeSection === s.key ? 'active' : ''}`}>
              <div className="bazi-ai-entry-title">{s.label}</div>
              <div className="bazi-ai-entry-hint">{s.hint}</div>
              <div className="bazi-ai-entry-meta">
                {session ? `进度 ${done}/${total}` : '尚未开始'}
              </div>
              {session && (
                <div style={{ height: 6, borderRadius: 999, background: '#dbeafe', marginTop: 8 }}>
                  <div style={{ height: 6, borderRadius: 999, width: `${pct}%`, background: 'linear-gradient(90deg, #0f7f91, #16a7b8)' }} />
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                {!session ? (
                  <button className="btn btn-primary" type="button" onClick={() => handleStartInterview(s.key)} disabled={interviewBusy || interviewLoading || !canRunInterview}>
                    点击开始（10题）
                  </button>
                ) : (
                  <>
                    <button className="btn btn-secondary" type="button" onClick={() => setActiveSection(s.key)}>
                      {session.status === 'completed' ? '查看结果' : '继续作答'}
                    </button>
                    <button className="btn btn-secondary" type="button" onClick={() => handleExport(s.key)} disabled={interviewBusy}>
                      导出
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {activeSession && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            当前板块：{INTERVIEW_SECTIONS.find((s) => s.key === activeSection)?.label}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            <span>进度：{activeSession.answered_count}/{activeSession.total_questions}</span>
            <span>{Math.min(100, Math.round((activeSession.answered_count / activeSession.total_questions) * 100))}%</span>
          </div>
          <div style={{ height: 8, borderRadius: 999, background: '#dbeafe' }}>
            <div style={{
              height: 8,
              borderRadius: 999,
              width: `${Math.min(100, Math.round((activeSession.answered_count / activeSession.total_questions) * 100))}%`,
              background: 'linear-gradient(90deg, #0f7f91, #16a7b8)',
            }}
            />
          </div>

          {activeSession.status !== 'completed' && activeSession.current_question && (
            <div className="reading-card" style={{ marginTop: 4 }}>
              <div className="reading-card-title">
                {activeSession.current_question.section_label} · 第{activeSession.current_question.question_number_in_section}问
              </div>
              <div className="reading-card-content" style={{ marginBottom: 10 }}>
                {activeSession.current_question.question}
              </div>
              <div className="ai-question-options-grid">
                {(activeSession.current_question.options || []).map((opt) => {
                  const picked = answerInputBySection[activeSection]?.key === opt.key
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      className={`btn ${picked ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ justifyContent: 'flex-start', textAlign: 'left', height: 'auto', padding: '10px 12px', whiteSpace: 'normal' }}
                      onClick={() => setAnswerInputBySection((prev) => ({ ...prev, [activeSection]: opt }))}
                    >
                      <strong>{opt.key}.</strong> {opt.text}
                    </button>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => handleSubmitAnswer(activeSection)}
                  disabled={interviewBusy || !answerInputBySection[activeSection]?.key}
                >
                  {interviewBusy ? '提交中…' : '提交并进入下一问'}
                </button>
                <button className="btn btn-secondary" type="button" onClick={() => handleExport(activeSection)} disabled={interviewBusy}>
                  {exportCopied ? '已复制并导出' : '导出当前记录'}
                </button>
              </div>
            </div>
          )}

          {feedbackBySection[activeSection] && (
            <div className="reading-card">
              <div className="reading-card-title">AI即时反馈</div>
              <div className="reading-card-content">{feedbackBySection[activeSection]}</div>
            </div>
          )}

          {activeSession.status === 'completed' && (
            <div className="reading-card" style={{ marginTop: 4 }}>
              <div className="reading-card-title">访谈已完成</div>
              <div className="reading-card-content">
                已完成该板块10题递进访谈，你可以导出完整问答记录，或查看下方AI总结。
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button className="btn btn-secondary" type="button" onClick={() => handleExport(activeSection)} disabled={interviewBusy}>
                  {exportCopied ? '已复制并导出' : '导出完整记录'}
                </button>
                <button className="btn btn-primary" type="button" onClick={() => handleStartInterview(activeSection)} disabled={interviewBusy}>
                  重新开始新一轮访谈
                </button>
              </div>
            </div>
          )}

          {activeSession.final_summary && (
            <div className="reading-card">
              <div className="reading-card-title">AI总结（结构化）</div>
              <div className="reading-card-content" style={{ whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(activeSession.final_summary, null, 2)}
              </div>
            </div>
          )}
        </div>
      )}

      {interviewLoading && (
        <p style={{ marginTop: 10, fontSize: '0.8125rem' }}>正在加载最近访谈…</p>
      )}
      {interviewError && (
        <p style={{ marginTop: 10, fontSize: '0.8125rem', color: '#b42318' }}>{interviewError}</p>
      )}
    </div>
  )
}
