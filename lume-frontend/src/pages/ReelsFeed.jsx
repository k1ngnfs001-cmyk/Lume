import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHeart, FaRegHeart, FaComment, FaShare, FaChevronUp, FaChevronDown, FaBookmark, FaPlay, FaTrash, FaPencilAlt, FaReply } from 'react-icons/fa';
import { FiBookmark, FiMoreVertical, FiEdit2 } from 'react-icons/fi';

const ReelsFeed = ({ feedType = 'global' }) => {
  const { user, setUser } = useAuth();
  const location = useLocation();
  const [posts, setPosts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef(null);

  const [isEditMenuOpen, setIsEditMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editFile, setEditFile] = useState(null);
  const [editPreview, setEditPreview] = useState(null);
  const editFileInputRef = useRef(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const [replyTexts, setReplyTexts] = useState({});
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');

  const getMediaUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/uploads')) return 'https://lume-5mof.onrender.com' + url;
    return url;
  };

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const endpoint = feedType === 'following' ? '/posts/following' : '/posts';
        const res = await axios.get(endpoint);
        setPosts(res.data);
      } catch (error) {
        alert('Ошибка загрузки ленты: ' + (error.response?.data?.message || error.message));
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [feedType, location.key]);

  useEffect(() => {
    setProgress(0);
    setIsPlaying(true);
  }, [currentIndex]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted, currentIndex]);

  // ============= ИСПРАВЛЕННЫЕ ФУНКЦИИ (Оптимистичные) =============
  const handleLike = async (postId) => {
    if (!postId) return;
    // 1. Оптимистичное обновление (Мгновенно!)
    setPosts(prev => prev.map(p => 
      p._id === postId ? {
        ...p,
        isLikedByMe: !p.isLikedByMe,
        likes: p.isLikedByMe 
          ? p.likes.filter(id => id !== user._id) 
          : [...p.likes, user._id]
      } : p
    ));

    try {
      // 2. Реальный запрос к бэкенду
      const response = await axios.post(`/posts/${postId}/like`);
      const resData = response.data;
      const isLiked = resData.isLiked || resData.liked || false;
      // 3. Синхронизация с правильным ответом сервера
      setPosts(prev => prev.map(p => 
        p._id === postId ? { ...p, isLikedByMe: isLiked, likes: resData.likes || [] } : p
      ));
    } catch (error) {
      // 4. Откат в случае ошибки
      setPosts(prev => prev.map(p => 
        p._id === postId ? {
          ...p,
          isLikedByMe: !p.isLikedByMe,
          likes: p.isLikedByMe 
            ? p.likes.filter(id => id !== user._id) 
            : [...p.likes, user._id]
        } : p
      ));
      alert('Ошибка лайка: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSave = async (postId) => {
    if (!postId) return;
    // 1. Оптимистичное обновление
    setPosts(prev => prev.map(p => 
      p._id === postId ? {
        ...p,
        savedBy: p.savedBy?.includes(user._id)
          ? p.savedBy.filter(id => id !== user._id)
          : [...(p.savedBy || []), user._id]
      } : p
    ));

    try {
      const response = await axios.post(`/posts/${postId}/save`);
      const resData = response.data;
      const isSaved = resData.isSaved || resData.saved || false;
      setPosts(prev => prev.map(p => 
        p._id === postId ? { 
          ...p, 
          savedBy: isSaved 
            ? [...(p.savedBy || []), user._id] 
            : (p.savedBy || []).filter(id => id !== user._id) 
        } : p
      ));
    } catch (error) {
      // Откат
      setPosts(prev => prev.map(p => 
        p._id === postId ? {
          ...p,
          savedBy: p.savedBy?.includes(user._id)
            ? p.savedBy.filter(id => id !== user._id)
            : [...(p.savedBy || []), user._id]
        } : p
      ));
      alert('Ошибка сохранения: ' + (error.response?.data?.message || error.message));
    }
  };
  // ================================================================

  const handleFollow = async (targetUserId) => {
    if (!user || !targetUserId || targetUserId === user._id) return;
    try {
      const response = await axios.post(`/users/follow/${targetUserId}`);
      const { isFollowing } = response.data;
      setUser(prev => {
        if (!prev) return prev;
        const currentFollowing = prev.following || [];
        const newFollowing = isFollowing
          ? [...currentFollowing, targetUserId]
          : currentFollowing.filter(id => id !== targetUserId);
        const updatedUser = { ...prev, following: newFollowing };
        localStorage.setItem('lumeUser', JSON.stringify(updatedUser));
        return updatedUser;
      });
    } catch (error) {
      alert('Ошибка подписки: ' + (error.response?.data?.message || error.message));
    }
  };

  // ... (остальные функции handleVideoClick, openEditModal, handleAddComment и т.д. остаются без изменений)
  const toggleMute = (e) => { e.stopPropagation(); setIsMuted(prev => !prev); };
  const handleVideoClick = () => { if (videoRef.current) { if (videoRef.current.paused) videoRef.current.play(); else videoRef.current.pause(); } };
  const handleTimeUpdate = () => { if (videoRef.current) { const currentTime = videoRef.current.currentTime; const duration = videoRef.current.duration; if (duration && duration > 0) setProgress((currentTime / duration) * 100); } };
  const openEditMenu = (e) => { e.stopPropagation(); setIsEditMenuOpen(prev => !prev); };
  const closeEditMenu = () => setIsEditMenuOpen(false);
  const openEditModal = () => { const post = posts[currentIndex]; setEditContent(post.content || ''); setEditFile(null); setEditPreview(null); setIsEditModalOpen(true); closeEditMenu(); };
  const handleEditFileChange = (e) => { const file = e.target.files[0]; if (file) { setEditFile(file); setEditPreview(URL.createObjectURL(file)); } };
  const handleUpdatePost = async () => { const post = posts[currentIndex]; if (!post) return; if (!editContent.trim()) { alert('Пожалуйста, введите название поста!'); return; } setIsUpdating(true); const formData = new FormData(); formData.append('content', editContent); if (editFile) formData.append('media', editFile); try { const response = await axios.put(`/posts/${post._id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }); setPosts(prev => prev.map(p => p._id === post._id ? response.data : p)); setIsEditModalOpen(false); alert('Пост успешно обновлён!'); } catch (error) { alert('Ошибка обновления: ' + (error.response?.data?.message || 'Сервер не отвечает')); } finally { setIsUpdating(false); } };
  const handleAddComment = async (postId) => { if (!commentText.trim() || !postId) return; try { const response = await axios.post(`/posts/${postId}/comment`, { text: commentText }); const newComment = response.data; setPosts(prev => prev.map(p => p._id === postId ? { ...p, comments: [...p.comments, newComment] } : p)); setCommentText(''); } catch (error) { alert('Ошибка добавления комментария: ' + (error.response?.data?.message || error.message)); } };
  const handleCommentLike = async (postId, commentId) => { try { const response = await axios.post(`/posts/${postId}/comments/${commentId}/like`); const updatedComment = response.data.comment; setPosts(prev => prev.map(p => p._id === postId ? { ...p, comments: p.comments.map(c => c._id === commentId ? updatedComment : c) } : p)); } catch (error) { alert('Ошибка лайка комментария: ' + (error.response?.data?.message || error.message)); } };
  const handleReply = async (postId, commentId) => { const text = replyTexts[commentId]; if (!text || !text.trim()) return; try { const response = await axios.post(`/posts/${postId}/comments/${commentId}/reply`, { text }); const { reply, commentId: parentId } = response.data; setPosts(prev => prev.map(p => p._id === postId ? { ...p, comments: p.comments.map(c => c._id === parentId ? { ...c, replies: [...c.replies, reply] } : c) } : p)); setReplyTexts(prev => ({ ...prev, [commentId]: '' })); } catch (error) { alert('Ошибка добавления ответа: ' + (error.response?.data?.message || error.message)); } };
  const startEditComment = (commentId, currentText) => { setEditingCommentId(commentId); setEditCommentText(currentText); };
  const saveEditComment = async (postId, commentId, isReply = false) => { if (!editCommentText.trim()) return; try { await axios.put(`/posts/${postId}/comments/${commentId}`, { text: editCommentText, isReply }); setPosts(prev => prev.map(p => p._id === postId ? { ...p, comments: isReply ? p.comments.map(c => ({ ...c, replies: c.replies.map(r => r._id === commentId ? { ...r, text: editCommentText } : r) })) : p.comments.map(c => c._id === commentId ? { ...c, text: editCommentText } : c) } : p)); setEditingCommentId(null); setEditCommentText(''); } catch (error) { alert('Ошибка редактирования: ' + (error.response?.data?.message || error.message)); } };
  const deleteComment = async (postId, commentId, isReply = false) => { if (!window.confirm('Вы уверены, что хотите удалить этот комментарий?')) return; try { await axios.delete(`/posts/${postId}/comments/${commentId}`, { data: { isReply } }); setPosts(prev => prev.map(p => p._id === postId ? { ...p, comments: isReply ? p.comments.map(c => ({ ...c, replies: c.replies.filter(r => r._id !== commentId) })) : p.comments.filter(c => c._id !== commentId) } : p)); } catch (error) { alert('Ошибка удаления: ' + (error.response?.data?.message || error.message)); } };
  const goToNext = useCallback(() => { if (currentIndex < posts.length - 1) setCurrentIndex(prev => prev + 1); }, [currentIndex, posts.length]);
  const goToPrev = useCallback(() => { if (currentIndex > 0) setCurrentIndex(prev => prev - 1); }, [currentIndex]);

  useEffect(() => {
    const handleGlobalScroll = (e) => {
      const sidebar = document.getElementById('lume-sidebar'); if (sidebar && sidebar.contains(e.target)) return; if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return; const delta = e.deltaY; if (Math.abs(delta) < 30) return; let shouldSwitch = false; if (delta > 0 && currentIndex < posts.length - 1) shouldSwitch = true; else if (delta < 0 && currentIndex > 0) shouldSwitch = true; if (shouldSwitch) { e.preventDefault(); if (delta > 0) goToNext(); else if (delta < 0) goToPrev(); } };
    window.addEventListener('wheel', handleGlobalScroll, { passive: false });
    return () => window.removeEventListener('wheel', handleGlobalScroll);
  }, [currentIndex, posts.length, goToNext, goToPrev]);

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return; if (e.key === 'ArrowDown') { e.preventDefault(); goToNext(); } else if (e.key === 'ArrowUp') { e.preventDefault(); goToPrev(); } else if (e.key === ' ') { e.preventDefault(); handleVideoClick(); } };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev]);

  if (loading) return <div className="w-full h-screen flex items-center justify-center bg-[#0a0a0a] text-white/50">Lume загружается...</div>;
  if (posts.length === 0) return <div className="w-full h-screen flex items-center justify-center bg-[#0a0a0a] text-white/50">Лента пуста...</div>;

  const post = posts[currentIndex];
  const isLiked = post.isLikedByMe || (post.likes && post.likes.includes(user?._id));
  const isSaved = post.savedBy && post.savedBy.includes(user?._id);
  const isFollowingAuthor = user?.following?.map(id => id.toString()).includes(post.user?._id.toString());
  const canEdit = user && user._id === post.user?._id;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#0a0a0a] flex flex-row items-center justify-center">
      <motion.div layout transition={{ duration: 0.35, ease: "easeInOut" }} className="flex-1 h-full flex flex-row items-center justify-center min-w-0">
        <div className="flex flex-row items-center justify-center gap-4 md:gap-8 w-full max-w-[1000px] mx-auto px-4 py-8">
          <div className="flex-1 flex items-center justify-center min-w-0">
            <div className="relative w-full max-w-[450px] lg:max-w-[650px] aspect-[1/1] max-h-[85vh] rounded-[24px] overflow-hidden bg-black shadow-2xl cursor-pointer">
              <button onClick={toggleMute} className="absolute top-4 left-4 z-30 bg-black/60 backdrop-blur-sm hover:bg-black/80 p-2 rounded-full text-white transition">
                {isMuted ? '🔇' : '🔊'}
              </button>
              {canEdit && (
                <div className="absolute top-4 right-4 z-30">
                  <button onClick={openEditMenu} className="bg-black/60 backdrop-blur-sm hover:bg-black/80 p-2 rounded-full text-white transition">
                    <FiMoreVertical size={20} />
                  </button>
                  <AnimatePresence>
                    {isEditMenuOpen && (
                      <motion.div initial={{ opacity: 0, scale: 0.8, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, y: -10 }} className="absolute right-0 top-12 bg-black/90 backdrop-blur-md border border-white/10 rounded-xl p-2 min-w-[140px] shadow-2xl">
                        <button onClick={openEditModal} className="flex items-center gap-2 w-full px-3 py-2 text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition">
                          <FiEdit2 size={16} />
                          <span className="text-sm">Изменить</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
              <div onClick={handleVideoClick} className="w-full h-full relative">
                <AnimatePresence mode="wait">
                  <motion.div key={post._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="w-full h-full relative">
                    {post.mediaUrl ? (
                      post.mediaType === 'video' ? (
                        <video ref={videoRef} src={getMediaUrl(post.mediaUrl)} className="w-full h-full object-cover" autoPlay loop playsInline muted={isMuted} onTimeUpdate={handleTimeUpdate} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} />
                      ) : (
                        <img src={getMediaUrl(post.mediaUrl)} className="w-full h-full object-cover" alt="Reel" crossOrigin="anonymous" />
                      )
                    ) : (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center text-white/30 text-4xl font-bold text-center p-4">{post.content}</div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-linear-to-t from-black/90 via-black/40 to-transparent pointer-events-none rounded-b-[24px]"></div>
                    <div className="absolute bottom-6 left-4 z-10 text-left">
                      <Link to={`/profile/${post.user?._id}`} className="inline-flex items-center gap-3 mb-2 hover:opacity-80 transition">
                        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-bold text-xs overflow-hidden shrink-0">
                          {post.user?.avatar && post.user.avatar !== '' ? <img src={post.user.avatar} alt="Avatar" className="w-full h-full object-cover" crossOrigin="anonymous" /> : post.user?.username?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-row items-center gap-1.5">
                          <span className="text-white font-bold text-base drop-shadow-lg flex items-center gap-1">
                            @{post.user?.username}{post.user?.isVerified && <span className="text-blue-500 text-lg ml-1">✓</span>}
                          </span>
                          <span className="text-white/50 text-xs font-medium drop-shadow-md mt-0.5">
                            · {post.createdAt ? new Date(post.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\./g, '-') : ''}
                          </span>
                        </div>
                      </Link>
                      <p className="text-white/90 text-sm drop-shadow-md leading-relaxed max-w-[80%]">{post.content}</p>
                    </div>
                    <AnimatePresence>
                      {!isPlaying && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          transition={{ duration: 0.2 }}
                          className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
                        >
                          <div className="w-16 h-16 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-lg">
                            <FaPlay className="ml-1" size={24} />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center gap-4 py-4 shrink-0 min-w-[60px] md:min-w-[80px]">
            <div className="relative">
              <Link to={`/profile/${post.user?._id}`}>
                <div className="w-12 h-12 rounded-full border-[2px] border-white/30 bg-gray-800 flex items-center justify-center overflow-hidden cursor-pointer hover:border-accent transition">
                  {post.user?.avatar && post.user.avatar !== '' ? <img src={post.user.avatar} alt="Avatar" className="w-full h-full object-cover" crossOrigin="anonymous" /> : <span className="text-white font-bold text-lg">{post.user?.username?.charAt(0).toUpperCase()}</span>}
                </div>
              </Link>
              {post.user?._id !== user?._id && (
                <AnimatePresence mode="wait">
                  {!isFollowingAuthor ? (
                    <motion.div key="follow-btn" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.3, type: 'spring', stiffness: 400, damping: 25 }} className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs border-[2px] border-[#0a0a0a] cursor-pointer select-none overflow-hidden shadow-lg" onClick={(e) => { e.stopPropagation(); handleFollow(post.user._id); }}>
                      <motion.span key="plus" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.2 }}>+</motion.span>
                    </motion.div>
                  ) : (
                    <motion.div key="followed-btn" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.3, type: 'spring', stiffness: 400, damping: 25 }} className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs border-[2px] border-[#0a0a0a] cursor-pointer select-none overflow-hidden shadow-lg" onClick={(e) => { e.stopPropagation(); handleFollow(post.user._id); }}>
                      <motion.span key="check" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.2 }}>✓</motion.span>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
            <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => handleLike(post._id)}>
              <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-black/80 transition">
                <span className={`text-xl transition-colors ${isLiked ? 'text-red-500' : 'text-white/80 hover:text-white'}`}>{isLiked ? <FaHeart /> : <FaRegHeart />}</span>
              </div>
              <span className="text-white/80 text-[11px] font-bold tracking-wide">{post.likes?.length || 0}</span>
            </div>
            <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={(e) => { e.stopPropagation(); setIsCommentsOpen(!isCommentsOpen); }}>
              <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-black/80 transition">
                <FaComment className="text-white/80 text-xl hover:text-white transition" />
              </div>
              <span className="text-white/80 text-[11px] font-bold tracking-wide">{post.comments?.length || 0}</span>
            </div>
            <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => handleSave(post._id)}>
              <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-black/80 transition">
                {isSaved ? <FaBookmark className="text-yellow-400 text-xl transition-colors" /> : <FiBookmark className="text-white/80 text-xl hover:text-white transition-colors" />}
              </div>
              <span className="text-white/80 text-[11px] font-bold tracking-wide">{post.savedBy?.length || 0}</span>
            </div>
            <div className="flex flex-col items-center gap-1 cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-black/80 transition">
                <FaShare className="text-white/80 text-xl hover:text-white transition" />
              </div>
            </div>
            <div className="border-t border-white/10 pt-4 mt-4 flex flex-col gap-3 w-full items-center">
              <button onClick={goToPrev} disabled={currentIndex === 0} className="w-10 h-10 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-white hover:bg-black/80 transition disabled:opacity-30 flex items-center justify-center"><FaChevronUp size={16} /></button>
              <button onClick={goToNext} disabled={currentIndex === posts.length - 1} className="w-10 h-10 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-white hover:bg-black/80 transition disabled:opacity-30 flex items-center justify-center"><FaChevronDown size={16} /></button>
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isCommentsOpen && (
          <motion.div layout initial={{ width: 0, opacity: 0 }} animate={{ width: "420px", opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.35, ease: "easeInOut" }} className="flex-shrink-0 h-full border-l border-white/10 bg-[#0a0a0a]/95 backdrop-blur-xl z-40 flex flex-col shadow-2xl overflow-hidden">
            <div className="w-[420px] h-full p-6 flex flex-col">
              <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                <span className="text-white font-bold text-lg">Комментарии</span>
                <button onClick={() => setIsCommentsOpen(false)} className="text-white/50 hover:text-white transition text-xl">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-6 pr-2 pb-20 custom-scrollbar">
                {post.comments?.length === 0 && <p className="text-white/40 text-center mt-10">Нет комментариев</p>}
                {post.comments?.map((comment) => (
                  <div key={comment._id} className="flex gap-3 border-b border-white/5 pb-4">
                    <Link to={`/profile/${comment.user?._id}`} className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs text-white shrink-0 overflow-hidden hover:opacity-80">
                      {comment.user?.avatar ? <img src={comment.user.avatar} className="w-full h-full object-cover" crossOrigin="anonymous" /> : comment.user?.username?.charAt(0).toUpperCase()}
                    </Link>
                    <div className="flex-1">
                      <Link to={`/profile/${comment.user?._id}`} className="text-white/60 text-xs font-medium hover:text-white transition inline-block">
                        @{comment.user?.username}
                      </Link>
                      <p className="text-white/80 text-sm mt-1">{comment.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-white/10 bg-[#0a0a0a]/90 backdrop-blur-md z-10 shrink-0">
                <div className="flex gap-2 bg-black/40 border border-white/10 rounded-full px-4 py-2 items-center">
                  <input type="text" placeholder="Добавить комментарий..." value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(post._id); }} className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/30" />
                  <button onClick={() => handleAddComment(post._id)} className="text-accent font-medium text-sm hover:opacity-80 transition">Опубликовать</button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isEditModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setIsEditModalOpen(false)}>
            <motion.div key={isEditModalOpen} initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-white mb-4">Редактировать пост</h3>
              <div className="space-y-4">
                <textarea autoFocus value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-accent/50 resize-none min-h-[80px] placeholder:text-white/30" placeholder="Название / Описание поста..." />
                {editPreview && (
                  <div className="relative border border-white/10 rounded-xl overflow-hidden">
                    <img src={editPreview} alt="Preview" className="w-full max-h-40 object-contain" />
                    <button type="button" onClick={() => { setEditFile(null); setEditPreview(null); if (editFileInputRef.current) editFileInputRef.current.value = ''; }} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80">✕</button>
                  </div>
                )}
                <button type="button" onClick={() => editFileInputRef.current?.click()} className="w-full py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition">Заменить медиа (фото/видео)</button>
                <input type="file" ref={editFileInputRef} accept="image/*,video/*" onChange={handleEditFileChange} className="hidden" />
              </div>
              <div className="flex gap-2 mt-6">
                <button onClick={() => setIsEditModalOpen(false)} className="flex-1 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition">Отмена</button>
                <button onClick={handleUpdatePost} disabled={isUpdating || !editContent.trim()} className="flex-1 py-2 bg-accent text-white font-semibold rounded-xl hover:bg-accent/80 transition disabled:opacity-50 disabled:cursor-not-allowed">{isUpdating ? 'Сохранение...' : 'Сохранить'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReelsFeed;