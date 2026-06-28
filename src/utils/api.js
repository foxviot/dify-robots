/**
 * Dify Chat API 封装
 * 文档: https://docs.dify.ai/
 */

const API_BASE = import.meta.env.VITE_DIFY_API_BASE || 'https://api.dify.ai/v1'
const API_KEY = import.meta.env.VITE_DIFY_API_KEY || ''
const DEFAULT_USER = import.meta.env.VITE_DIFY_USER || 'frontend-user'

/**
 * 获取请求头
 */
function getHeaders(json = true) {
  const headers = {
    Authorization: `Bearer ${API_KEY}`,
  }
  if (json) {
    headers['Content-Type'] = 'application/json'
  }
  return headers
}

/**
 * 获取会话列表
 */
export async function getConversations(user = DEFAULT_USER, lastId = null, limit = 30) {
  const params = new URLSearchParams({ user, limit: String(limit), sort_by: '-updated_at' })
  if (lastId) params.set('last_id', lastId)
  const res = await fetch(`${API_BASE}/conversations?${params}`, {
    headers: getHeaders(),
  })
  if (!res.ok) throw new Error(`获取会话列表失败: ${res.status}`)
  return res.json()
}

/**
 * 获取会话消息历史
 */
export async function getMessages(conversationId, user = DEFAULT_USER, limit = 30) {
  const params = new URLSearchParams({ user, conversation_id: conversationId, limit: String(limit) })
  const res = await fetch(`${API_BASE}/messages?${params}`, {
    headers: getHeaders(),
  })
  if (!res.ok) throw new Error(`获取消息历史失败: ${res.status}`)
  return res.json()
}

/**
 * 发送消息（流式）
 * @param {Object} params
 * @param {string} params.query - 用户消息
 * @param {string} params.conversation_id - 会话ID
 * @param {string} params.user - 用户标识
 * @param {Array} params.files - 附件
 * @param {Function} params.onMessage - 收到消息块回调
 * @param {Function} params.onMessageEnd - 消息结束回调
 * @param {Function} params.onError - 错误回调
 * @param {AbortSignal} params.signal - 取消信号
 */
export async function sendMessageStream({
  query,
  conversation_id = '',
  user = DEFAULT_USER,
  files = [],
  onMessage,
  onMessageEnd,
  onError,
  signal,
}) {
  const body = {
    query,
    inputs: {},
    response_mode: 'streaming',
    conversation_id,
    user,
    files,
  }

  try {
    const res = await fetch(`${API_BASE}/chat-messages`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(body),
      signal,
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`请求失败 (${res.status}): ${errText}`)
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data:')) continue

        const dataStr = trimmed.slice(5).trim()
        if (!dataStr) continue

        try {
          const data = JSON.parse(dataStr)

          switch (data.event) {
            case 'message':
              onMessage?.(data)
              break
            case 'message_end':
              onMessageEnd?.(data)
              break
            case 'error':
              onError?.(new Error(data.msg || '流式响应错误'))
              break
            case 'ping':
              // 心跳，忽略
              break
            default:
              break
          }
        } catch (e) {
          // JSON 解析失败，跳过
        }
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') return
    onError?.(err)
  }
}

/**
 * 上传文件
 */
export async function uploadFile(file, user = DEFAULT_USER) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('user', user)

  const res = await fetch(`${API_BASE}/files/upload`, {
    method: 'POST',
    headers: getHeaders(false),
    body: formData,
  })

  if (!res.ok) throw new Error(`文件上传失败: ${res.status}`)
  return res.json()
}

/**
 * 删除会话
 */
export async function deleteConversation(conversationId, user = DEFAULT_USER) {
  const res = await fetch(`${API_BASE}/conversations/${conversationId}`, {
    method: 'DELETE',
    headers: getHeaders(),
    body: JSON.stringify({ user }),
  })
  if (!res.ok) throw new Error(`删除会话失败: ${res.status}`)
  return res.json()
}

/**
 * 重命名会话
 */
export async function renameConversation(conversationId, name, user = DEFAULT_USER) {
  const res = await fetch(`${API_BASE}/conversations/${conversationId}/name`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ name, user }),
  })
  if (!res.ok) throw new Error(`重命名会话失败: ${res.status}`)
  return res.json()
}

/**
 * 停止生成（流式停止）
 */
export async function stopGenerate(taskId, user = DEFAULT_USER) {
  try {
    await fetch(`${API_BASE}/chat-messages/${taskId}/stop`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ user }),
    })
  } catch (e) {
    // 忽略错误
  }
}

/**
 * 消息反馈（点赞/点踩）
 */
export async function feedbackMessage(messageId, rating, user = DEFAULT_USER) {
  const res = await fetch(`${API_BASE}/messages/${messageId}/feedbacks`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ rating, user }),
  })
  if (!res.ok) throw new Error(`反馈失败: ${res.status}`)
  return res.json()
}
