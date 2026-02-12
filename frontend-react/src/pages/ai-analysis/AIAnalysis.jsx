import React, { useState, useEffect, useRef } from 'react';
import OpenAI from 'openai';
import request from '@/lib/request';
import { v4 as uuidv4 } from 'uuid';

const AIAnalysis = () => {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const openai = new OpenAI({
    apiKey: 'sk-8e552dc4a28f4887b8a6de0f33f8e02d',
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    dangerouslyAllowBrowser: true,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const messages = activeSession ? activeSession.messages : [];

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    if (sessions.length === 0 && !activeSessionId) {
      const newSessionId = uuidv4();
      setSessions([{ id: newSessionId, messages: [] }]);
      setActiveSessionId(newSessionId);
    }
  }, []); // 仅在组件挂载时运行

  const startNewChat = () => {
    const firstSession = sessions[0];
    if (firstSession && firstSession.messages.length === 0) {
      setActiveSessionId(firstSession.id);
      alert('您已在新的聊天中。');
      return;
    }

    const newSessionId = uuidv4();
    setSessions(prev => [{ id: newSessionId, messages: [] }, ...prev]);
    setActiveSessionId(newSessionId);
  };

  const addMessageToSession = (sessionId, message) => {
    setSessions(prev => {
      const sessionIndex = prev.findIndex(s => s.id === sessionId);
      if (sessionIndex === -1) return prev;

      const updatedSession = { 
        ...prev[sessionIndex], 
        messages: [...prev[sessionIndex].messages, message] 
      };

      const newSessions = [...prev];
      newSessions.splice(sessionIndex, 1);
      newSessions.unshift(updatedSession);

      return newSessions;
    });
  };

  const callAI = async (prompt) => {
    setLoading(true);
    const currentSessionId = activeSessionId;
    try {
      const completion = await openai.chat.completions.create({
        model: 'deepseek-v3',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: prompt },
        ],
      });
      const aiMessage = { sender: 'ai', content: completion.choices[0].message.content };
      addMessageToSession(currentSessionId, aiMessage);
    } catch (error) {
      console.error('AI调用失败:', error);
      const errorMessage = { sender: 'ai', content: `AI分析出错: ${error.message}` };
      addMessageToSession(currentSessionId, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loading || !input.trim()) return;
    const userMessage = { sender: 'user', content: input };
    addMessageToSession(activeSessionId, userMessage);
    callAI(input);
    setInput('');
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const userMessage = { 
      sender: 'user', 
      content: `我上传了文件: ${file.name}。现在，请基于这个文件回答我的问题。` 
    };
    addMessageToSession(activeSessionId, userMessage);

    // 模拟后端文件上传
    const formData = new FormData();
    formData.append('file', file);

    try {
      // 这是一个假接口，等待后端开发
      // const response = await request.post('/api/ai/upload-file', formData);
      // const fileId = response.data.fileId;

      // 模拟成功
      console.log('假装文件上传成功:', file.name);
      const aiMessage = { 
        sender: 'ai', 
        content: `文件“${file.name}”已收到。您可以开始提问了。`
      };
      addMessageToSession(activeSessionId, aiMessage);

    } catch (error) {
      console.error('文件上传失败:', error);
      const errorMessage = { 
        sender: 'ai', 
        content: `文件“${file.name}”上传失败: ${error.message}` 
      };
      addMessageToSession(activeSessionId, errorMessage);
    }

    // 重置 file input
    e.target.value = null;
  };

  const handleStudyDataSubmit = async () => {
    if (loading) return;

    const userMessage = { sender: 'user', content: '请帮我分析一下我的学习数据。' };
    addMessageToSession(activeSessionId, userMessage);

    try {
      const response = await request.get('/study/stats/summary');
      const studyData = response;

      const dataString = JSON.stringify(studyData, null, 2);

      const aiPrompt = `作为一名专业的学习顾问和数据分析师，请分析以下学习数据。在分析时，请遵循以下步骤：

1.  **总结个人表现**: 首先，总结这份学习数据中的关键指标，例如总学习时长、专注时间分布、最高效的学习时段等。
2.  **网络数据检索与对比**: 接下来，请在线搜索关于“高效学习方法”、“番茄工作法实践”、“学习技巧”等主题的博客文章、论坛讨论或公开研究。
3.  **结合分析与建议**: 将用户的个人数据与网上找到的学习策略进行对比分析。例如，如果用户数据显示其在晚间效率较低，而网络文章普遍建议将高强度学习安排在早晨，请指出这一点。
4.  **提供个性化建议**: 基于以上对比，为用户提供 3-5 条具体的、可操作的、个性化的学习建议。建议应结合用户的实际数据和网络上的最佳实践。
5.  **保持鼓励口吻**: 全程请使用友好、积极和鼓励的语气进行沟通。

用户的学习数据如下：
\`\`\`json
${dataString}
\`\`\``;

      callAI(aiPrompt);
    } catch (error) {
      console.error('获取学习数据失败:', error);
      const errorMessage = { sender: 'ai', content: `获取学习数据失败: ${error.message}` };
      addMessageToSession(activeSessionId, errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      {/* Sidebar for chat history */}
      <div className="w-64 bg-gray-800/50 p-4 flex flex-col">
        <button 
          onClick={startNewChat}
          className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg mb-4 transition-colors duration-300"
        >
          + 新建聊天
        </button>
        <div className="flex-1 overflow-y-auto">
          {sessions.map(session => (
            <div 
              key={session.id}
              onClick={() => setActiveSessionId(session.id)}
              className={`p-2 my-1 rounded-lg cursor-pointer ${activeSessionId === session.id ? 'bg-gray-700' : 'hover:bg-gray-700/50'}`}>
              <p className="truncate text-sm">{session.messages.length > 0 ? session.messages[0].content : '新聊天'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col p-4 sm:p-6">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m12.728 0l-.707.707M12 21v-1m-6.364-1.636l.707-.707m12.728 0l.707-.707" />
              </svg>
              <h1 className="text-2xl font-bold">与 DeepSeek 对话</h1>
              <p>我是 DeepSeek，你的专属智能伙伴，有什么可以帮你的吗？</p>
            </div>
          )}
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-start gap-3 w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.sender === 'ai' && (
                <>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-sm flex-shrink-0">DS</div>
                  <div className="bg-gray-700 rounded-lg p-3 max-w-lg break-words">
                    {msg.content}
                  </div>
                </>
              )}
              {msg.sender === 'user' && (
                <>
                  <div className="bg-indigo-500 text-white rounded-lg p-3 max-w-lg break-words">
                    {msg.content}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center font-bold text-sm flex-shrink-0">我</div>
                </>
              )}
            </div>
          ))}
          {loading && (
             <div className="flex items-start gap-3">
              <div className="w-8 h-8 flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-pulse">
                  <path d="M6.5 10.5C6.5 12.433 8.067 14 10 14C11.933 14 13.5 12.433 13.5 10.5C13.5 8.567 11.933 7 10 7C8.067 7 6.5 8.567 6.5 10.5Z" stroke="#9CA3AF" strokeWidth="1.5"/>
                  <path d="M15.5 4.5C15.5 5.32843 14.8284 6 14 6C13.1716 6 12.5 5.32843 12.5 4.5C12.5 3.67157 13.1716 3 14 3C14.8284 3 15.5 3.67157 15.5 4.5Z" stroke="#9CA3AF" strokeWidth="1.5"/>
                  <path d="M19.5 9.5C19.5 10.3284 18.8284 11 18 11C17.1716 11 16.5 10.3284 16.5 9.5C16.5 8.67157 17.1716 8 18 8C18.8284 8 19.5 8.67157 19.5 9.5Z" stroke="#9CA3AF" strokeWidth="1.5"/>
                  <path d="M10 14V17C10 18.1046 10.8954 19 12 19H14" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M14 19L12 21L10 19" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="bg-gray-700 rounded-lg p-3 max-w-lg">
                DeepSeek 正在努力思考...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="mt-4">
          <div className="flex justify-start mb-2">
            <button 
              onClick={handleStudyDataSubmit}
              className="bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-semibold py-1.5 px-4 rounded-full transition-colors duration-300 ease-in-out"
            >
              一键提交学习数据辅助分析
            </button>
          </div>
          <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".txt,.pdf,.doc,.docx,.xls,.xlsx"
          />
          <button 
            type="button"
            onClick={() => fileInputRef.current.click()}
            className="w-10 h-10 flex-shrink-0 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-full transition-colors duration-300 ease-in-out flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="和 DeepSeek 聊点什么..."
            className="flex-1 bg-gray-700 border border-gray-600 rounded-full py-3 px-5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
          />
          <button 
            type="submit" 
            disabled={loading || !input.trim()} 
            className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-blue-500/50">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </form>
        </div>
      </div>
    </div>
  );
};

export default AIAnalysis;