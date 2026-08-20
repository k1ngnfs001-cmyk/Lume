import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import axios from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { FaTrash, FaPencilAlt, FaCheck, FaTimes } from 'react-icons/fa';

const Chats = () => {
  const { userId } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [activeChatId, setActiveChatId] = useState(userId || null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    axios.get('/chats/conversations').then(res => setConversations(res.data));
  }, []);

  useEffect(() => {
    if (!activeChatId) return;
    axios.get(`/chats/${activeChatId}`).then(res => {
      setMessages(res.data);
      scrollToBottom();
    });
  }, [activeChatId]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMsg) => {
      if (activeChatId && (newMsg.sender._id === activeChatId || newMsg.receiver._id === activeChatId)) {
        setMessages(prev => {
          if (prev.some(m => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });
        scrollToBottom();
      }
      setConversations(prev => {
        const otherUser = newMsg.sender._id === user._id ? newMsg.receiver : newMsg.sender;
        const updated = prev.map(c => c.user._id === otherUser._id ? { ...c, lastMessage: newMsg.content || 'Медиа', lastMessageTime: newMsg.createdAt } : c);
        return updated.sort((a,b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
      });
    };

    const handleMessageDeleted = ({ messageId }) => {
      setMessages(prev => prev.filter(m => m._id !== messageId));
    };

    const handleMessageEdited = ({ updatedMessage }) => {
      setMessages(prev => prev.map(m => m._id === updatedMessage._id ? updatedMessage : m));
    };

    socket.on('private-message', handleNewMessage);
    socket.on('messageDeleted', handleMessageDeleted);
    socket.on('messageEdited', handleMessageEdited);

    return () => {
      socket.off('private-message', handleNewMessage);
      socket.off('messageDeleted', handleMessageDeleted);
      socket.off('messageEdited', handleMessageEdited);
    };
  }, [socket, activeChatId, user]);

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() && !selectedFile) return;

    if (!socket) {
      alert('Ошибка: Соединение с чатом разорвано. Перезагрузите страницу.');
      return;
    }

    if (selectedFile) {
      try {
        const fileFormData = new FormData();
        fileFormData.append('media', selectedFile);
        fileFormData.append('receiver', activeChatId);
        fileFormData.append('content', inputText);

        const uploadRes = await axios.post('/chats/send', fileFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        const savedMsg = uploadRes.data;
        
        setMessages(prev => [...prev, savedMsg]);
        setSelectedFile(null);
        setInputText('');
        scrollToBottom();
      } catch (error) {
        console.error('Ошибка загрузки файла', error);
        alert('Не удалось загрузить файл: ' + (error.response?.data?.message || error.message));
      }
    } else {
      socket.emit('private-message', {
        receiverId: activeChatId,
        content: inputText,
        mediaUrl: '',
        mediaType: 'none'
      });
      setInputText('');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Вы уверены, что хотите удалить это сообщение?')) return;
    try {
      await axios.delete(`/chats/messages/${messageId}`);
      setMessages(prev => prev.filter(m => m._id !== messageId));
    } catch (error) {
      alert('Не удалось удалить сообщение: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSaveEdit = async (messageId) => {
    if (!editText.trim()) return;
    try {
      const res = await axios.put(`/chats/messages/${messageId}`, { text: editText.trim() });
      setMessages(prev => prev.map(m => m._id === messageId ? res.data : m));
      setEditingMessageId(null);
      setEditText('');
    } catch (error) {
      alert('Не удалось отредактировать сообщение: ' + (error.response?.data?.message || error.message));
    }
  };

  if (!activeChatId) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Ваши чаты</h2>
        <div className="space-y-4">
          {conversations.length === 0 && <p className="text-white/40 text-center mt-10">У вас пока нет диалогов. Начните общение, нажав «Написать» на странице профиля другого пользователя.</p>}
          {conversations.map((conv) => (
            <div 
              key={conv.user._id}
              onClick={() => setActiveChatId(conv.user._id)}
              className="bg-white/5 border border-white/10 backdrop-blur-md p-4 rounded-2xl cursor-pointer hover:bg-white/10 transition"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-linear-to-r from-accent to-glow flex items-center justify-center text-white font-bold text-lg">
                  {conv.user?.avatar ? <img src={conv.user.avatar} className="w-full h-full rounded-full object-cover"/> : conv.user?.username?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="text-white font-semibold">@{conv.user.username}</div>
                  <div className="text-white/50 text-sm truncate">{conv.lastMessage}</div>
                </div>
                <div className="text-white/30 text-xs">
                  {new Date(conv.lastMessageTime).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 flex flex-col h-[calc(100vh-120px)]">
      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-white/10">
        <button onClick={() => { setActiveChatId(null); navigate('/chats'); }} className="text-white/50 hover:text-white">← Назад</button>
        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold">
          {conversations.find(c => c.user._id === activeChatId)?.user?.username?.charAt(0).toUpperCase()}
        </div>
        <span className="text-white font-semibold">
          @{conversations.find(c => c.user._id === activeChatId)?.user?.username}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        {/* BO'SH CHAT VA XABARLARNI TO'G'RI CHIQARISH MANTIQI */}
        {messages.length === 0 ? (
          <p className="text-white/30 text-center mt-10">Нет сообщений. Напишите первое!</p>
        ) : (
          <AnimatePresence>
            {messages.map((msg, idx) => {
              const isMe = msg.sender._id === user._id;
              const isEditing = editingMessageId === msg._id;
              
              return (
                <motion.div 
                  key={msg._id || idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} gap-1 group`}
                >
                  <div className={`flex items-center gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    
                    {/* MATN SIG'IShI UCHUN break-words VA overflow-hidden QO'SHILDI */}
                    <div className={`max-w-[70%] p-3 rounded-2xl relative break-words [overflow-wrap:anywhere] ${isMe ? 'bg-accent/70 text-white' : 'bg-white/10 text-white/90'}`}>
                      {isEditing ? (
                        <div className="flex flex-col gap-2 min-w-[140px]">
                          <input
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full bg-black/40 text-white border border-white/20 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-accent/50 text-sm placeholder:text-white/40"
                            autoFocus
                          />
                          <div className="flex justify-end gap-2 mt-1">
                            <button 
                              onClick={() => handleSaveEdit(msg._id)} 
                              className="text-xs font-medium text-green-400 hover:text-green-300 bg-white/5 hover:bg-white/10 px-3 py-1 rounded-lg transition flex items-center gap-1"
                            >
                              <FaCheck size={11} /> Сохр.
                            </button>
                            <button 
                              onClick={() => { setEditingMessageId(null); setEditText(''); }} 
                              className="text-xs font-medium text-white/50 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1 rounded-lg transition flex items-center gap-1"
                            >
                              <FaTimes size={11} /> Отмена
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {msg.content && <p className="break-words [overflow-wrap:anywhere] whitespace-pre-wrap">{msg.content}</p>}
                          {msg.mediaUrl && (
                            <div className="mt-2 rounded-lg overflow-hidden border border-white/10">
                              {msg.mediaType === 'video' ? (
                                <video src={msg.mediaUrl} className="w-full max-h-60 object-contain" controls crossOrigin="anonymous" />
                              ) : (
                                <img src={msg.mediaUrl} alt="Image" className="w-full max-h-60 object-contain" />
                              )}
                            </div>
                          )}
                          <div className={`text-[10px] mt-1 ${isMe ? 'text-white/50' : 'text-white/30'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString()}
                          </div>
                        </>
                      )}
                    </div>

                    {isMe && !isEditing && (
                      <div className={`flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${isMe ? 'mr-1' : 'ml-1'} bg-black/40 backdrop-blur-sm p-1 rounded-xl`}>
                        <button 
                          onClick={() => { setEditingMessageId(msg._id); setEditText(msg.content || ''); }}
                          className="text-white/70 hover:text-white p-1.5 rounded-lg transition hover:bg-white/10"
                          title="Редактировать"
                        >
                          <FaPencilAlt size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteMessage(msg._id)}
                          className="text-red-400/70 hover:text-red-400 p-1.5 rounded-lg transition hover:bg-red-500/10"
                          title="Удалить"
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2 items-center bg-white/5 border border-white/10 rounded-2xl p-2">
        <button type="button" onClick={() => fileInputRef.current.click()} className="text-white/50 hover:text-white p-2">
          📷
        </button>
        <input type="file" ref={fileInputRef} accept="image/*,video/*" onChange={(e) => { setSelectedFile(e.target.files[0]); e.target.value = null; }} className="hidden" />
        {selectedFile && <span className="text-white/60 text-xs truncate max-w-25">{selectedFile.name}</span>}
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 bg-transparent text-white outline-none placeholder:text-white/30 px-2"
          placeholder="Сообщение..."
        />
        <button type="submit" disabled={!inputText.trim() && !selectedFile} className="px-4 py-2 bg-accent text-white rounded-xl font-medium disabled:opacity-50">
          Отпр.
        </button>
      </form>
    </div>
  );
};

export default Chats;