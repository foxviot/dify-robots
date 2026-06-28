import { memo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

function MessageBubble({ message, isDark }) {
  const isUser = message.role === 'user'

  const formatTime = (ts) => {
    if (!ts) return ''
    const d = new Date(ts * 1000)
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className={`flex gap-3 sm:gap-4 animate-slide-up ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* 头像 */}
      <div className="flex-shrink-0">
        {isUser ? (
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center text-white font-semibold shadow-md shadow-cyan-500/20">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        ) : (
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-cyan-400 via-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
        )}
      </div>

      {/* 消息内容 */}
      <div className={`flex flex-col max-w-[80%] sm:max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-4 py-3 rounded-2xl shadow-sm transition-all ${
            isUser
              ? 'bg-gradient-to-br from-cyan-500 to-teal-600 text-white rounded-tr-md'
              : message.isError
              ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-tl-md border border-red-200 dark:border-red-800'
              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-md border border-slate-200/60 dark:border-slate-700/60'
          }`}
        >
          {/* 附件展示 */}
          {message.files && message.files.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {message.files.map((file, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs ${
                    isUser ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700'
                  }`}
                >
                  {file.previewUrl || file.url ? (
                    <img src={file.previewUrl || file.url} alt={file.name} className="w-8 h-8 rounded object-cover" />
                  ) : (
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  )}
                  <span className="truncate max-w-[120px]">{file.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* 文本内容 */}
          {isUser ? (
            <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
          ) : (
            <div className={`msg-content ${message.isStreaming ? 'typing-cursor' : ''}`}>
              {message.content ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '')
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={isDark ? oneDark : oneLight}
                          language={match[1]}
                          PreTag="div"
                          customStyle={{
                            margin: 0,
                            borderRadius: '0.5rem',
                            fontSize: '0.8rem',
                          }}
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      )
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              ) : message.isStreaming ? (
                <div className="flex items-center gap-1.5 py-1">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce-dot" style={{ animationDelay: '0s' }} />
                  <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce-dot" style={{ animationDelay: '0.16s' }} />
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce-dot" style={{ animationDelay: '0.32s' }} />
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* 时间戳 */}
        {message.createdAt && !message.isStreaming && (
          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 px-2">
            {formatTime(message.createdAt)}
          </span>
        )}
      </div>
    </div>
  )
}

export default memo(MessageBubble)
