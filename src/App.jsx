import { useState, useRef, useEffect } from 'react'

function App() {
  const [messages, setMessages] = useState([
    { role: 'bot', content: '👋 Welcome! Upload a PDF document to unlock intelligent conversations about its content.' }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [file, setFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedDocs, setUploadedDocs] = useState([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const clearChat = () => {
    setMessages([
      { role: 'bot', content: '👋 Welcome! Upload a PDF document to unlock intelligent conversations about its content.' }
    ])
    setInput('')
  }

  const clearDocuments = async () => {
    try {
      const response = await fetch('http://localhost:8000/clear', {
        method: 'DELETE',
      })

      if (response.ok) {
        setUploadedDocs([])
        setMessages([
          { role: 'bot', content: '✅ All documents have been deleted. Upload a new PDF to start fresh.' }
        ])
      } else {
        const errorData = await response.json().catch(() => ({}))
        setMessages(prev => [...prev, {
          role: 'bot',
          content: `❌ Failed to clear documents: ${errorData.detail || 'Unknown error'}`
        }])
      }
    } catch (error) {
      console.error('Error:', error)
      setMessages(prev => [...prev, {
        role: 'bot',
        content: '⚠️ Error clearing documents. Make sure the backend is running.'
      }])
    } finally {
      setShowDeleteModal(false)
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        setMessages(prev => [...prev, {
          role: 'bot',
          content: `✅ Document "${file.name}" has been processed successfully! I'm now ready to answer your questions about it.`
        }])
        setUploadedDocs(prev => [...prev, file.name])
        setFile(null)
      } else {
        const errorData = await response.json().catch(() => ({}))
        setMessages(prev => [...prev, {
          role: 'bot',
          content: `❌ Upload failed: ${errorData.detail || 'Unknown error'}`
        }])
      }
    } catch (error) {
      console.error('Error:', error)
      setMessages(prev => [...prev, {
        role: 'bot',
        content: '⚠️ Connection error. Please ensure the backend server is running.'
      }])
    } finally {
      setIsUploading(false)
    }
  }

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage = input
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMessage }),
      })

      if (!response.ok) {
        throw new Error('Network response was not ok')
      }

      const data = await response.json()
      setMessages(prev => [...prev, { role: 'bot', content: data.answer }])
    } catch (error) {
      console.error('Error:', error)
      setMessages(prev => [...prev, {
        role: 'bot',
        content: '⚠️ Something went wrong. Please check if the backend is running and try again.'
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="logo">RAG ChatBot</div>

        <div className="upload-section">
          <div className="section-title">📄 Document Upload</div>

          <input
            type="file"
            id="file-upload"
            accept=".pdf"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          <div
            className={`dropzone ${file ? 'active' : ''}`}
            onClick={() => document.getElementById('file-upload').click()}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.5rem' }}>
                {file ? file.name : 'Click to upload PDF'}
              </div>
              {!file && (
                <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                  Drag & drop or click to browse
                </div>
              )}
            </div>
          </div>

          {file && (
            <button
              className="upload-btn"
              onClick={handleUpload}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <span>Processing...</span>
                  <div className="loading-dots" style={{ display: 'inline-flex', marginLeft: '0.5rem' }}>
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                  </div>
                </>
              ) : (
                '🚀 Process Document'
              )}
            </button>
          )}

          {uploadedDocs.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <div className="section-title">📚 Uploaded Documents</div>
              <div style={{
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                background: 'var(--bg-secondary)',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                marginBottom: '0.75rem'
              }}>
                {uploadedDocs.map((doc, idx) => (
                  <div key={idx} style={{ padding: '0.25rem 0' }}>
                    ✓ {doc}
                  </div>
                ))}
              </div>
              <button
                className="delete-docs-btn"
                onClick={() => setShowDeleteModal(true)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                Delete All Documents
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="chat-area">
        <div className="chat-header">
          <h2>💬 Intelligent Chat</h2>
          <button
            className="clear-chat-btn"
            onClick={clearChat}
            title="Clear chat history"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            Clear Chat
          </button>
        </div>

        <div className="messages-container">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.role}`}>
              {msg.content}
            </div>
          ))}
          {isLoading && (
            <div className="message bot">
              <div className="loading-dots">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          <input
            type="text"
            className="chat-input"
            placeholder="Ask me anything about your document..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          <button
            className="send-btn"
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            title="Send message"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete All Documents?</h3>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete all uploaded documents?</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                This will permanently clear the knowledge base and cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button className="modal-btn modal-btn-cancel" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button className="modal-btn modal-btn-delete" onClick={clearDocuments}>
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
