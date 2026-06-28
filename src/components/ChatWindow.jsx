import { useState, useRef, useEffect, useCallback } from 'react'
import MessageBubble from './MessageBubble'
import FileUpload from './FileUpload'

export default function ChatWindow({
  messages,
  isStreaming,
  onSend,
  onStop,
  onUploadFile,
  onRegenerate,
  onToggleSidebar,
  loadingMessages,
  currentConversationId,
}) {
  const [input, setInput] = useState('')
  const [pendingFiles, setPendingFiles] = useState([])
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'))
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  // 监听暗色模式变化
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  // 自动滚动到底部
  const scrollToBottom = useCallback((smooth = true) => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end',
      })
    })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // 自适应文本框高度
  const adjustTextarea = () => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 160) + 'px'
  }

  useEffect(() => {
    adjustTextarea()
  }, [input])

  const handleSubmit = (e) => {
    e?.preventDefault()
    if (!input.trim() || isStreaming) return
    onSend(input.trim(), pendingFiles)
    setInput('')
    setPendingFiles([])
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleUpload = async (file) => {
    const result = await onUploadFile(file)
    setPendingFiles((prev) => [...prev, result])
  }

  const removeFile = (idx) => {
    setPendingFiles((prev) => {
      const file = prev[idx]
      if (file.previewUrl) URL.revokeObjectURL(file.previewUrl)
      return prev.filter((_, i) => i !== idx)
    })
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const isEmpty = messages.length === 0 && !loadingMessages

  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-br from-slate-50 via-white to-cyan-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-cyan-950/30">
      {/* 顶部栏 */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-200/60 dark:border-slate-800/60 backdrop-blur-md bg-white/60 dark:bg-slate-900/60 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {currentConversationId ? '对话中' : '新对话'}
            </h2>
          </div>
        </div>

        {!isStreaming && messages.length > 0 && (
          <button
            onClick={onRegenerate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-cyan-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            title="重新生成最后一条回复"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            重新生成
          </button>
        )}
      </header>

      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {isEmpty ? (
          <WelcomeScreen onSuggestion={(text) => { setInput(text); textareaRef.current?.focus() }} />
        ) : loadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-400">加载消息中...</p>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} isDark={isDark} />
            ))}
            <div ref={messagesEndRef} className="h-1" />
          </div>
        )}
      </div>

      {/* 输入区域 */}
      <div className="px-4 pb-4 pt-2">
        <div className="max-w-3xl mx-auto">
          {/* 待上传文件预览 */}
          {pendingFiles.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {pendingFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="group relative flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm"
                >
                  {file.previewUrl ? (
                    <img src={file.previewUrl} alt={file.name} className="w-7 h-7 rounded object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                      <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-200 max-w-[120px] truncate">{file.name}</span>
                    {file.size && <span className="text-[10px] text-slate-400">{formatFileSize(file.size)}</span>}
                  </div>
                  {file.error && <span className="text-[10px] text-red-500">上传失败</span>}
                  <button
                    onClick={() => removeFile(idx)}
                    className="ml-1 p-0.5 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 输入框 */}
          <div className="chat-input-glow flex items-end gap-2 p-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg shadow-slate-200/50 dark:shadow-black/20 transition-all">
            <FileUpload onUpload={handleUpload} disabled={isStreaming} />

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入消息，Enter 发送，Shift+Enter 换行..."
              rows={1}
              disabled={isStreaming}
              className="flex-1 resize-none bg-transparent text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none max-h-40 py-2 px-1 disabled:opacity-60"
            />

            {isStreaming ? (
              <button
                onClick={onStop}
                className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-all active:scale-95"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
                停止
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!input.trim()}
                className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 text-white hover:shadow-lg hover:shadow-cyan-500/30 active:scale-90 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
                title="发送"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            )}
          </div>

          {/* 提示文字 */}
          <p className="text-center text-[10px] text-slate-400 dark:text-slate-600 mt-2">
            AI 生成内容仅供参考，请注意甄别 · Enter 发送 · Shift+Enter 换行
          </p>
        </div>
      </div>
    </div>
  )
}

function WelcomeScreen({ onSuggestion }) {
  const suggestions = [
    { icon: '💡', title: '创意写作', desc: '帮我写一首关于春天的诗' },
    { icon: '📝', title: '内容总结', desc: '请总结一下最近的技术趋势' },
    { icon: '🔧', title: '编程助手', desc: '用 Python 实现快速排序算法' },
    { icon: '📚', title: '知识问答', desc: '解释一下什么是量子计算' },
  ]

  return (
    <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto px-4 animate-fade-in">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-400 via-teal-500 to-emerald-400 flex items-center justify-center shadow-2xl shadow-teal-500/30 mb-6 animate-pulse-slow">
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold gradient-text mb-3">你好，我是 AI 助手</h1>
      <p className="text-slate-500 dark:text-slate-400 text-center mb-8">
        有什么可以帮助你的吗？试试下面的话题，或者直接输入你的问题
      </p>

      <div className="grid grid-cols-2 gap-3 w-full">
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => onSuggestion(s.desc)}
            className="group flex flex-col items-start gap-1 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-cyan-300 dark:hover:border-cyan-600 hover:shadow-lg hover:shadow-cyan-500/10 hover:-translate-y-0.5 transition-all duration-200 text-left"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <span className="text-2xl mb-1">{s.icon}</span>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{s.title}</span>
            <span className="text-xs text-slate-400 dark:text-slate-500 line-clamp-2">{s.desc}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
