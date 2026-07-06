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
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');

  const handleRunCode = () => {
    setOutput('Code executed successfully!');
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages([...messages, { role: 'user', content: input }]);
    setInput('');
  };

  return (
    <div className="editor-page">
      <div className="editor-header">
        <h1>Project: {projectId}</h1>
        <select value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="typescript">TypeScript</option>
        </select>
        <button className="btn btn-primary" onClick={handleRunCode}>
          <Play size={18} /> Run
        </button>
      </div>

      <div className="editor-container">
        <div className="editor-panel">
          <Editor
            height="100%"
            language={language}
            value={code}
            onChange={(value) => setCode(value || '')}
            theme="vs-dark"
          />
          <div className="output-panel">
            <h3>Output</h3>
            <pre>{output}</pre>
          </div>
        </div>

        <div className="ai-panel">
          <h3>🤖 AI Assistant</h3>
          <div className="messages">
            {messages.map((msg, i) => (
              <div key={i} className={`message ${msg.role}`}>
                {msg.content}
              </div>
            ))}
          </div>
          <form onSubmit={handleSendMessage}>
            <textarea placeholder="Ask Kiln anything..." value={input} onChange={(e) => setInput(e.target.value)} />
            <button type="submit" className="btn btn-primary">
              <Send size={18} /> Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditorPage;
