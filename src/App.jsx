import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import ChatWindow from './components/ChatWindow'
import { useDifyChat } from './hooks/useDifyChat'

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const {
    conversations,
    currentConversationId,
    messages,
    isStreaming,
    loadingConversations,
    loadingMessages,
    error,
    selectConversation,
    newConversation,
    removeConversation,
    sendMessage,
    stopGenerate,
    uploadFile,
    regenerate,
    setError,
  } = useDifyChat()

  // 错误自动消失
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [error, setError])

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      <Sidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelect={selectConversation}
        onNew={newConversation}
        onDelete={removeConversation}
        loading={loadingConversations}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 relative">
        <ChatWindow
          messages={messages}
          isStreaming={isStreaming}
          onSend={sendMessage}
          onStop={stopGenerate}
          onUploadFile={uploadFile}
          onRegenerate={regenerate}
          onToggleSidebar={() => setSidebarOpen(true)}
          loadingMessages={loadingMessages}
          currentConversationId={currentConversationId}
        />

        {/* 错误提示 Toast */}
        {error && (
          <div className="fixed top-4 right-4 z-50 animate-slide-up">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 shadow-lg backdrop-blur-md">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm text-red-600 dark:text-red-300 max-w-xs">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600 dark:hover:text-red-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
