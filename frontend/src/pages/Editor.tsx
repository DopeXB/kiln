import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Send, Play } from 'lucide-react';
import '../styles/Editor.css';

const EditorPage: React.FC = () => {
  const { projectId } = useParams();
  const [code, setCode] = useState('// Start coding\nconsole.log("Hello Kiln!");');
  const [language, setLanguage] = useState('javascript');
  const [output, setOutput] = useState('');
  const [messages, setMessages] = useState<any[]>([
    { role: 'assistant', content: 'Hi! I\'m Kiln, your AI assistant. Ask me anything about coding!' }
  ]);
  const [input, setInput] = useState('');

  const handleRunCode = () => {
    try {
      // Simple eval for demo (not for production!)
      const result = eval(code);
      setOutput(result ? String(result) : 'Code executed successfully!');
    } catch (error: any) {
      setOutput(`Error: ${error.message}`);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    setMessages([...messages, { role: 'user', content: input }]);
    setInput('');
    
    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'I understood your message! This is a demo response.' 
      }]);
    }, 500);
  };

  return (
    <div className="editor-page">
      <div className="editor-header">
        <h1>Project: {projectId}</h1>
        <div className="header-controls">
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className="language-select">
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="typescript">TypeScript</option>
          </select>
          <button className="btn btn-primary" onClick={handleRunCode}>
            <Play size={18} /> Run
          </button>
        </div>
      </div>

      <div className="editor-container">
        <div className="editor-section">
          <div className="editor-wrapper">
            <Editor
              height="100%"
              language={language}
              value={code}
              onChange={(value) => setCode(value || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
              }}
            />
          </div>

          <div className="output-panel">
            <div className="output-header">
              <h3>Output</h3>
            </div>
            <div className="output-content">
              <pre>{output || 'Click "Run" to execute code...'}</pre>
            </div>
          </div>
        </div>

        <div className="ai-panel">
          <div className="ai-header">
            <h3>🤖 AI Assistant</h3>
          </div>
          
          <div className="messages-wrapper">
            {messages.map((msg, i) => (
              <div key={i} className={`message message-${msg.role}`}>
                <div className="message-content">{msg.content}</div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="chat-form">
            <textarea 
              placeholder="Ask Kiln anything..." 
              value={input} 
              onChange={(e) => setInput(e.target.value)}
              rows={3}
            />
            <button type="submit" className="btn btn-primary btn-send">
              <Send size={16} /> Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditorPage;
