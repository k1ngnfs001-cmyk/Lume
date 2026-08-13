import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom'; // <--- ЭТОТ ИМПОРТ ВСЁ ИСПРАВЛЯЕТ!
import StoriesBar from '../components/StoriesBar';

const Feed = () => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [posts, setPosts] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  // Загружаем посты при первом заходе
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get('/posts');
        setPosts(response.data);
      } catch (error) {
        console.error('Ошибка загрузки ленты:', error);
      }
    };
    fetchPosts();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !selectedFile) return;

    const formData = new FormData();
    formData.append('content', content);
    if (selectedFile) {
      formData.append('media', selectedFile);
    }

    try {
      const token = localStorage.getItem('lumeToken');
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      setPosts([data, ...posts]);
      setContent('');
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      alert('Ошибка при публикации: ' + error.message);
    }
  };

  // --- ЛОГИКА ЛАЙКОВ ---
  const handleLike = async (postId) => {
    try {
      const response = await axios.post(`/posts/${postId}/like`);
      const { likes, isLiked } = response.data;
      
      setPosts(prevPosts => prevPosts.map(p => 
        p._id === postId ? { ...p, likes, isLikedByMe: isLiked } : p
      ));
    } catch (error) {
      console.error('Ошибка лайка:', error);
    }
  };

  // --- ЛОГИКА КОММЕНТАРИЕВ ---
  const [commentTexts, setCommentTexts] = useState({});
  
  const handleCommentChange = (postId, text) => {
    setCommentTexts(prev => ({ ...prev, [postId]: text }));
  };

  const handleCommentSubmit = async (postId) => {
    const text = commentTexts[postId];
    if (!text || !text.trim()) return;

    try {
      const response = await axios.post(`/posts/${postId}/comment`, { text });
      const newComment = response.data;

      setPosts(prevPosts => prevPosts.map(p => 
        p._id === postId ? { ...p, comments: [...p.comments, newComment] } : p
      ));
      setCommentTexts(prev => ({ ...prev, [postId]: '' }));
    } catch (error) {
      console.error('Ошибка отправки комментария:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <StoriesBar />
      {/* Форма создания поста */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 border border-white/10 backdrop-blur-xl p-6 rounded-2xl shadow-xl"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-10 h-10 rounded-full bg-linear-to-r from-accent to-glow flex items-center justify-center text-white font-bold">
            {user?.username?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <span className="text-white/80 font-semibold">@{user?.username}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            placeholder="Что у вас нового?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-transparent text-white text-lg outline-none resize-none placeholder:text-white/30 min-h-20"
          />

          {previewUrl && (
            <div className="relative border border-white/10 rounded-xl overflow-hidden max-h-75 bg-black/40">
              {selectedFile?.type?.startsWith('video') ? (
                <video src={previewUrl} className="w-full h-auto max-h-75 object-contain" controls />
              ) : (
                <img src={previewUrl} alt="Preview" className="w-full h-auto max-h-75 object-contain" />
              )}
              <button
                type="button"
                onClick={() => { setSelectedFile(null); setPreviewUrl(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex justify-between items-center mt-4">
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              className="text-white/50 hover:text-white/80 transition-colors text-xl"
            >
              📷 Фото/Видео
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="hidden"
            />
            
            <button
              type="submit"
              className="px-6 py-2 bg-linear-to-r from-accent to-glow text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-accent/30 transition-all disabled:opacity-50"
              disabled={!content.trim() && !selectedFile}
            >
              Опубликовать
            </button>
          </div>
        </form>
      </motion.div>

      {/* Лента постов */}
      <div className="space-y-8">
        {posts.length === 0 && (
          <div className="text-center text-white/40 mt-10">
            <p className="text-xl">Пока здесь тихо...</p>
          </div>
        )}

        {posts.map((post) => {
          const isLikedByMe = post.isLikedByMe || post.likes.includes(user?._id);
          return (
          <motion.div
            key={post._id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/5 border border-white/10 backdrop-blur-md p-6 rounded-2xl"
          >
            {/* Шапка поста */}
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs text-white">
                {post.user?.username?.charAt(0)?.toUpperCase()}
              </div>
              <Link to={`/profile/${post.user?._id}`} className="text-white/60 text-sm font-medium hover:text-white transition">
                @{post.user?.username}
              </Link>
              <span className="text-white/30 text-xs ml-auto">
                {new Date(post.createdAt).toLocaleString()}
              </span>
            </div>
            
            {/* Текст */}
            <p className="text-white/90 text-base leading-relaxed whitespace-pre-wrap mb-4">
              {post.content}
            </p>

            {/* Медиа */}
            {post.mediaUrl && (
              <div className="rounded-xl overflow-hidden border border-white/10 mt-2 bg-black/50 mb-4">
                {post.mediaType === 'video' ? (
                  <video src={post.mediaUrl} className="w-full max-h-100 object-contain" controls crossOrigin="anonymous" />
                ) : (
                  <img src={post.mediaUrl} alt="Post media" className="w-full max-h-100 object-contain" />
                )}
              </div>
            )}

            {/* Панель действий: Лайк и Комментарий */}
            <div className="flex items-center gap-6 border-t border-white/10 pt-3 mt-2">
              {/* Лайк */}
              <button 
                onClick={() => handleLike(post._id)}
                className="flex items-center gap-1 transition-colors group"
              >
                <span className={`text-xl transition-colors ${isLikedByMe ? 'text-red-500' : 'text-white/50 group-hover:text-white'}`}>
                  {isLikedByMe ? '❤️' : '🤍'}
                </span>
                <span className="text-sm text-white/50">{post.likes?.length || 0}</span>
              </button>

              {/* Комментарий */}
              <div className="flex-1">
                <button 
                  onClick={() => {
                    const input = document.getElementById(`comment-input-${post._id}`);
                    if(input) input.focus();
                  }}
                  className="flex items-center gap-1 text-white/50 hover:text-white transition-colors"
                >
                  <span className="text-xl">💬</span>
                  <span className="text-sm">{post.comments?.length || 0}</span>
                </button>
              </div>
            </div>

            {/* Блок комментариев */}
            <div className="mt-4 space-y-3 pt-2 border-t border-white/5">
              {/* Форма ввода комментария */}
              <div className="flex gap-2">
                <input 
                  id={`comment-input-${post._id}`}
                  type="text"
                  placeholder="Напишите комментарий..."
                  value={commentTexts[post._id] || ''}
                  onChange={(e) => handleCommentChange(post._id, e.target.value)}
                  onKeyDown={(e) => {
                    if(e.key === 'Enter') handleCommentSubmit(post._id);
                  }}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-accent/50 placeholder:text-white/30"
                />
                <button 
                  onClick={() => handleCommentSubmit(post._id)}
                  className="px-4 py-2 bg-accent/80 text-white text-sm rounded-xl hover:bg-accent transition"
                >
                  Отправить
                </button>
              </div>

              {/* Список комментариев */}
              <AnimatePresence>
                {post.comments?.map((comment, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-2 items-start"
                  >
                    <div className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center text-[10px] text-white shrink-0 mt-1">
                      {comment.user?.username?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <span className="text-white/60 text-xs font-medium">@{comment.user?.username}</span>
                      <p className="text-white/80 text-sm">{comment.text}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )})}
      </div>
    </div>
  );
};

export default Feed;