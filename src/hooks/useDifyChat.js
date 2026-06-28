import { useState, useCallback, useRef, useEffect } from 'react'
import {
  getConversations,
  getMessages,
  sendMessageStream,
  deleteConversation,
  stopGenerate,
  uploadFile,
} from '../utils/api'

export function useDifyChat() {
  const [conversations, setConversations] = useState([])
  const [currentConversationId, setCurrentConversationId] = useState('')
  const [messages, setMessages] = useState([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [loadingConversations, setLoadingConversations] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [error, setError] = useState(null)

  const abortControllerRef = useRef(null)
  const currentTaskIdRef = useRef(null)
  const streamingContentRef = useRef('')

  // 加载会话列表
  const loadConversations = useCallback(async () => {
    setLoadingConversations(true)
    setError(null)
    try {
      const data = await getConversations()
      setConversations(data.data || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoadingConversations(false)
    }
  }, [])

  // 加载会话消息
  const loadMessages = useCallback(async (conversationId) => {
    if (!conversationId) {
      setMessages([])
      return
    }
    setLoadingMessages(true)
    setError(null)
    try {
      const data = await getMessages(conversationId)
      // Dify 返回的消息格式: { id, query, answer, created_at, ... }
      const formatted = []
      const msgs = data.data || []
      for (const msg of msgs) {
        // 用户消息
        formatted.push({
          id: msg.id + '-user',
          role: 'user',
          content: msg.query,
          files: msg.message_files || [],
          createdAt: msg.created_at,
        })
        // AI 消息
        if (msg.answer) {
          formatted.push({
            id: msg.id,
            role: 'assistant',
            content: msg.answer,
            messageId: msg.id,
            feedback: msg.feedback,
            createdAt: msg.created_at,
          })
        }
      }
      setMessages(formatted)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoadingMessages(false)
    }
  }, [])

  // 切换会话
  const selectConversation = useCallback((conversationId) => {
    // 如果正在流式输出，先停止
    if (isStreaming) {
      handleStop()
    }
    setCurrentConversationId(conversationId)
    loadMessages(conversationId)
  }, [isStreaming, loadMessages])

  // 新建对话
  const newConversation = useCallback(() => {
    if (isStreaming) {
      handleStop()
    }
    setCurrentConversationId('')
    setMessages([])
  }, [isStreaming])

  // 删除会话
  const removeConversation = useCallback(async (conversationId) => {
    try {
      await deleteConversation(conversationId)
      setConversations((prev) => prev.filter((c) => c.id !== conversationId))
      if (currentConversationId === conversationId) {
        newConversation()
      }
    } catch (e) {
      setError(e.message)
    }
  }, [currentConversationId, newConversation])

  // 发送消息
  const sendMessage = useCallback(async (text, files = []) => {
    if (!text.trim() || isStreaming) return

    setError(null)
    setIsStreaming(true)
    streamingContentRef.current = ''

    // 构造文件参数（用于 API）
    const apiFiles = files
      .filter((f) => f.uploaded)
      .map((f) => ({
        type: f.type,
        transfer_method: 'local_file',
        upload_file_id: f.uploadedFileId,
      }))

    // 添加用户消息到界面
    const userMsg = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: text,
      files: files.map((f) => ({
        name: f.name,
        type: f.type,
        url: f.previewUrl,
        uploaded: f.uploaded,
      })),
      createdAt: Math.floor(Date.now() / 1000),
    }
    setMessages((prev) => [...prev, userMsg])

    // 添加 AI 占位消息
    const aiMsgId = `temp-ai-${Date.now()}`
    setMessages((prev) => [...prev, {
      id: aiMsgId,
      role: 'assistant',
      content: '',
      isStreaming: true,
      createdAt: Math.floor(Date.now() / 1000),
    }])

    abortControllerRef.current = new AbortController()

    await sendMessageStream({
      query: text,
      conversation_id: currentConversationId,
      files: apiFiles,
      signal: abortControllerRef.current.signal,
      onMessage: (data) => {
        currentTaskIdRef.current = data.task_id
        streamingContentRef.current += data.answer || ''

        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? { ...m, content: streamingContentRef.current }
              : m
          )
        )

        // 如果有 conversation_id 且当前没有选中，更新当前会话
        if (data.conversation_id && !currentConversationId) {
          setCurrentConversationId(data.conversation_id)
        }
      },
      onMessageEnd: (data) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? {
                  ...m,
                  content: streamingContentRef.current,
                  isStreaming: false,
                  messageId: data.message_id,
                  metadata: data.metadata,
                }
              : m
          )
        )
        setIsStreaming(false)
        currentTaskIdRef.current = null
        // 刷新会话列表
        loadConversations()
      },
      onError: (err) => {
        setError(err.message)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? {
                  ...m,
                  content: streamingContentRef.current || `[错误] ${err.message}`,
                  isStreaming: false,
                  isError: true,
                }
              : m
          )
        )
        setIsStreaming(false)
      },
    })
  }, [currentConversationId, isStreaming, loadConversations])

  // 停止生成
  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    if (currentTaskIdRef.current) {
      stopGenerate(currentTaskIdRef.current)
    }
    setIsStreaming(false)
    currentTaskIdRef.current = null
    setMessages((prev) =>
      prev.map((m) =>
        m.isStreaming ? { ...m, isStreaming: false, content: m.content || '（已停止生成）' } : m
      )
    )
  }, [])

  // 上传文件
  const handleUploadFile = useCallback(async (file) => {
    try {
      const result = await uploadFile(file)
      return {
        uploaded: true,
        uploadedFileId: result.id,
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'document',
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
        size: file.size,
      }
    } catch (e) {
      return {
        uploaded: false,
        error: e.message,
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'document',
        size: file.size,
      }
    }
  }, [])

  // 重新生成最后一条 AI 回复
  const regenerate = useCallback(() => {
    if (isStreaming) return
    // 找到最后一条用户消息
    const lastUserMsgIndex = [...messages].reverse().findIndex((m) => m.role === 'user')
    if (lastUserMsgIndex === -1) return
    const realIndex = messages.length - 1 - lastUserMsgIndex
    const lastUserMsg = messages[realIndex]

    // 删除该用户消息之后的所有消息
    setMessages((prev) => prev.slice(0, realIndex))

    // 重新发送
    setTimeout(() => {
      sendMessage(lastUserMsg.content, [])
    }, 100)
  }, [messages, isStreaming, sendMessage])

  // 初始化加载会话列表
  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  return {
    conversations,
    currentConversationId,
    messages,
    isStreaming,
    loadingConversations,
    loadingMessages,
    error,
    loadConversations,
    selectConversation,
    newConversation,
    removeConversation,
    sendMessage,
    stopGenerate: handleStop,
    uploadFile: handleUploadFile,
    regenerate,
    setError,
  }
}
