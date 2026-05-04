import React, { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, Loader2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getSocket } from '@/lib/socket';
import { getMe } from '@/feature/user/api';

// You'll need to create this API endpoint in frontend
import { getMessageHistory, getUnreadCount } from '@/feature/friend/api'; 

export default function ChatPanel({ friend, onBack }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputMsg, setInputMsg] = useState('');
  const [myId, setMyId] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    getMe().then(u => setMyId(u?.id));
  }, []);

  useEffect(() => {
    if (friend?.id) {
      loadHistory();
    }
  }, [friend?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await getMessageHistory(friend.id, 1, 50);
      if (res && res.items) {
        // Reverse because history is ordered DESC, we want ASC for chat display
        setMessages(res.items.reverse());
      }
    } catch (err) {
      console.error("Failed to load messages", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = (data) => {
      // data.message is the MessageResponse
      if (
        data.message.senderId === friend.id || 
        data.message.receiverId === friend.id
      ) {
        setMessages(prev => [...prev, data.message]);
      }
    };

    socket.on('receive_private_message', handleNewMessage);

    return () => {
      socket.off('receive_private_message', handleNewMessage);
    };
  }, [friend?.id]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit('send_private_message', JSON.stringify({
        receiverId: friend.id,
        content: inputMsg
      }));
      // We will receive it back via receive_private_message if we are sender
      setInputMsg('');
    } else {
      alert("Not connected to chat server");
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-slate-100 mb-3">
        <button onClick={onBack} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500">
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100">
            {friend.avatarUrl ? <img src={friend.avatarUrl} className="w-full h-full object-cover"/> : <User size={16} className="m-2 text-slate-400" />}
          </div>
          <div className="font-bold text-slate-800 text-sm">{friend.nickname}</div>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-3 pb-2">
        {messages.map((msg) => {
          const isMe = msg.senderId === myId;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                  isMe 
                    ? 'bg-indigo-600 text-white rounded-br-sm' 
                    : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="pt-2 flex gap-2">
        <Input 
          value={inputMsg}
          onChange={e => setInputMsg(e.target.value)}
          placeholder="在此输入消息..." 
          className="rounded-xl border-slate-200 text-sm flex-1 h-9"
        />
        <Button type="submit" size="icon" className="h-9 w-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 shrink-0">
          <Send size={14} />
        </Button>
      </form>
    </div>
  );
}
