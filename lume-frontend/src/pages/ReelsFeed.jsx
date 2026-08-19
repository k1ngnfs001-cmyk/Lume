import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaHeart, FaRegHeart, FaComment, FaShare, 
  FaChevronUp, FaChevronDown, FaBookmark, 
  FaPlay, FaTrash, FaPencilAlt, FaReply, FaTimes 
} from 'react-icons/fa';
import { FiBookmark } from 'react-icons/fi';

const ReelsFeed = ({ feedType = 'global' }) => {
  const { user, setUser } = useAuth();
  
  const [posts, setPosts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef(null);

  // KOMMENTARIYA STATE'LARI
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyTexts, setReplyTexts] = useState({});
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);

  // POST TAHRIRLASH STATE'LARI
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editFile, setEditFile] = useState(null);
  const [editPreview, setEditPreview] = useState(null);
  const editFileInputRef = useRef(null);

  const getMediaUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/uploads')) return 'https://lume-5mof.onrender.com' + url;
    return url;
  };

  const sameId = (a, b) => a != null && b != null && String(a?._id || a) === String(b?._id || b);
  const isIdInArray = (arr, id) => Array.isArray(arr) && arr.some(item => sameId(item, id));

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const endpoint = feedType === 'following' ? '/posts/following' : '/posts';
        const res = await axios.get(endpoint);
        setPosts(res.data);
      } catch (error) {
        console.error('Ошибка загрузки ленты:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [feedType]); 

  useEffect(() => {
    setProgress(0);
    setIsPlaying(true);
    setIsCommentsOpen(false); 
  }, [currentIndex]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted, currentIndex]);

  const isUserLiked = (likesArray) => {
    if (!Array.isArray(likesArray) || !user) return false;
    return likesArray.some(like => like === user._id || like?._id === user._id);
  };

  const isUserSaved = (savedArray) => {
    if (!Array.isArray(savedArray) || !user) return false;
    return savedArray.some(save => save === user._id || save?._id === user._id);
  };

  const updatePostInList = (postId, updater) => {
    setPosts(prev => prev.map(p => p._id === postId ? updater(p) : p));
  };

  const handleLike = async (postId) => {
    if (!postId || isUpdating || !user?._id) return;
    const targetPost = posts.find(p => p._id === postId);
    if (!targetPost) return;

    setIsUpdating(true);
    const wasLiked = targetPost.isLikedByMe || isIdInArray(targetPost.likes, user._id);
    const originalPost = targetPost;

    updatePostInList(postId, p => ({
      ...p,
      isLikedByMe: !wasLiked,
      likes: wasLiked
        ? (p.likes || []).filter(id => !sameId(id, user._id))
        : [...(p.likes || []), user._id]
    }));

    try {
      const res = await axios.post(`/posts/${postId}/like`);
      updatePostInList(postId, p => ({
        ...p,
        isLikedByMe: Boolean(res.data.isLiked),
        likes: Array.isArray(res.data.likes) ? res.data.likes : p.likes || []
      }));
    } catch (error) {
      setPosts(prev => prev.map(p => p._id === postId ? originalPost : p));
      alert('Ошибка лайка: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSave = async (postId) => {
    if (!postId || isUpdating || !user?._id) return;
    const targetPost = posts.find(p => p._id === postId);
    if (!targetPost) return;

    setIsUpdating(true);
    const wasSaved = targetPost.isSavedByMe || isIdInArray(targetPost.savedBy, user._id);
    const originalPost = targetPost;

    updatePostInList(postId, p => ({
      ...p,
      isSavedByMe: !wasSaved,
      savedBy: wasSaved
        ? (p.savedBy || []).filter(id => !sameId(id, user._id))
        : [...(p.savedBy || []), user._id]
    }));

    try {
      const res = await axios.post(`/posts/${postId}/save`);
      updatePostInList(postId, p => ({
        ...p,
        isSavedByMe: Boolean(res.data.isSaved),
        savedBy: Array.isArray(res.data.savedBy) ? res.data.savedBy : p.savedBy || []
      }));
    } catch (error) {
      setPosts(prev => prev.map(p => p._id === postId ? originalPost : p));
      alert('Ошибка сохранения: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFollow = async (targetUserId) => {
    if (!user || !targetUserId || targetUserId === user._id) return;
    try {
      const response = await axios.post(`/users/follow/${targetUserId}`);
      setUser(prev => {
        if (!prev) return prev;
        const updatedUser = { ...prev, following: response.data.isFollowing ? [...(prev.following || []), targetUserId] : (prev.following || []).filter(id => id !== targetUserId) };
        localStorage.setItem('lumeUser', JSON.stringify(updatedUser));
        return updatedUser;
      });
    } catch (error) {
      console.error('Ошибка подписки:', error);
    }
  };

  const toggleMute = (e) => { e.stopPropagation(); setIsMuted(prev => !prev); };
  const handleVideoClick = () => { if (videoRef.current) { if (videoRef.current.paused) videoRef.current.play(); else videoRef.current.pause(); } };
  const handleTimeUpdate = () => { if (videoRef.current && videoRef.current.duration > 0) setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100); };
  
  const goToNext = useCallback(() => { if (currentIndex < posts.length - 1) setCurrentIndex(prev => prev + 1); }, [currentIndex, posts.length]);
  const goToPrev = useCallback(() => { if (currentIndex > 0) setCurrentIndex(prev => prev - 1); }, [currentIndex]);

  useEffect(() => {
    const handleGlobalScroll = (e) => {
      const sidebar = document.getElementById('lume-sidebar'); 
      if (sidebar && sidebar.contains(e.target)) return; 
      if (isCommentsOpen || isEditModalOpen) return; 
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return; 
      
      const delta = e.deltaY; 
      if (Math.abs(delta) < 30) return; 
      if (delta > 0 && currentIndex < posts.length - 1) goToNext(); 
      else if (delta < 0 && currentIndex > 0) goToPrev(); 
    };
    window.addEventListener('wheel', handleGlobalScroll, { passive: false });
    return () => window.removeEventListener('wheel', handleGlobalScroll);
  }, [currentIndex, posts.length, goToNext, goToPrev, isCommentsOpen, isEditModalOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => { 
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return; 
      if (e.key === 'ArrowDown') { e.preventDefault(); goToNext(); } 
      else if (e.key === 'ArrowUp') { e.preventDefault(); goToPrev(); } 
      else if (e.key === ' ') { e.preventDefault(); handleVideoClick(); } 
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev]);

  const handleEditFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEditFile(file);
      setEditPreview(URL.createObjectURL(file));
    }
  };

  const handleUpdatePost = async () => {
    const post = posts[currentIndex];
    if (!post || !editContent.trim() || isUpdating) return;

    setIsUpdating(true);
    const formData = new FormData();
    formData.append('content', editContent.trim());
    if (editFile) formData.append('media', editFile);

    try {
      const response = await axios.put(`/posts/${post._id}`, formData);
      const updatedPost = {
        ...post,
        ...response.data,
        isLikedByMe: response.data.isLikedByMe ?? post.isLikedByMe,
        isSavedByMe: response.data.isSavedByMe ?? post.isSavedByMe
      };
      setPosts(prev => prev.map(p => p._id === post._id ? updatedPost : p));
      setIsEditModalOpen(false);
      setEditFile(null);
      setEditPreview(null);
    } catch (error) {
      alert('Ошибка обновления: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddComment = async (postId) => {
    if (!commentText.trim() || !postId) return;
    setIsCommenting(true);
    try {
      const response = await axios.post(`/posts/${postId}/comment`, { text: commentText });
      const newComment = response.data.comment || response.data;
      setPosts(prev => prev.map(p => p._id === postId ? { ...p, comments: [...(p.comments || []), newComment] } : p));
      setCommentText('');
    } catch (error) {
      console.error('Ошибка добавления комментария:', error);
    } finally {
      setIsCommenting(false);
    }
  };

  const handleCommentLike = async (postId, commentId) => {
    try {
      const response = await axios.post(`/posts/${postId}/comments/${commentId}/like`);
      const updatedComment = response.data.comment || response.data;
      setPosts(prev => prev.map(p => p._id === postId ? { 
        ...p, comments: p.comments.map(c => c._id === commentId ? { ...c, likes: updatedComment.likes } : c) 
      } : p));
    } catch (error) { console.error('Ошибка лайка комментария:', error); }
  };

  const handleReply = async (postId, commentId) => {
    const text = replyTexts[commentId];
    if (!text || !text.trim()) return;
    try {
      const response = await axios.post(`/posts/${postId}/comments/${commentId}/reply`, { text });
      const reply = response.data.reply || response.data;
      setPosts(prev => prev.map(p => p._id === postId ? { 
        ...p, comments: p.comments.map(c => c._id === commentId ? { ...c, replies: [...(c.replies || []), reply] } : c) 
      } : p));
      setReplyTexts(prev => ({ ...prev, [commentId]: '' }));
    } catch (error) { console.error('Ошибка добавления ответа:', error); }
  };

  const startEditComment = (commentId, currentText) => {
    setEditingCommentId(commentId);
    setEditCommentText(currentText);
  };

  const saveEditComment = async (postId, commentId, isReply = false) => {
    if (!editCommentText.trim()) return;
    try {
      const response = await axios.put(`/posts/${postId}/comments/${commentId}`, { text: editCommentText, isReply });
      
      setPosts(prev => prev.map(p => {
        if (p._id !== postId) return p;
        if (response.data.post) return response.data.post;

        return {
          ...p,
          comments: p.comments.map(c => {
            if (isReply) {
              return {
                ...c,
                replies: c.replies?.map(r => r._id === commentId ? { ...r, text: editCommentText } : r) || []
              };
            }
            return c._id === commentId ? { ...c, text: editCommentText } : c;
          })
        };
      }));

      setEditingCommentId(null);
      setEditCommentText('');
    } catch (error) {
      console.error('Ошибка редактирования:', error);
    }
  };

  const deleteComment = async (postId, commentId, isReply = false) => {
    if (!window.confirm('Вы уверены?')) return;
    try {
      await axios.delete(`/posts/${postId}/comments/${commentId}`, { data: { isReply } });
      setPosts(prev => prev.map(p => p._id === postId ? { 
        ...p, comments: isReply 
          ? p.comments.map(c => ({ ...c, replies: c.replies.filter(r => r._id !== commentId) })) 
          : p.comments.filter(c => c._id !== commentId) 
      } : p));
    } catch (error) { console.error('Ошибка удаления:', error); }
  };

  if (loading) return <div className="w-full h-screen flex items-center justify-center bg-[#0a0a0a] text-white/50">Lume загружается...</div>;
  if (posts.length === 0) return <div className="w-full h-screen flex items-center justify-center bg-[#0a0a0a] text-white/50">Лента пуста...</div>;

  const post = posts[currentIndex];
  const isLiked = post.isLikedByMe || isIdInArray(post.likes, user?._id);
  const isSaved = post.isSavedByMe || isIdInArray(post.savedBy, user?._id);
  const isFollowingAuthor = user?.following?.map(id => id.toString()).includes(post.user?._id?.toString());

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#0a0a0a] flex">
      
      {/* ===== ASOSIY LENTA ===== */}
      <motion.div 
        initial={false}
        animate={{ width: isCommentsOpen ? 'calc(100% - 420px)' : '100%' }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="h-full flex items-center justify-center min-w-0 relative z-0"
      >
        <div className="flex flex-row items-center justify-center gap-4 md:gap-8 w-full max-w-[1000px] mx-auto px-4 py-8">
          
          <div className="flex-1 flex items-center justify-center min-w-0">
            <div className="relative w-full max-w-[450px] lg:max-w-[650px] aspect-[1/1] max-h-[85vh] rounded-[24px] overflow-hidden bg-black shadow-2xl cursor-pointer">
              <button onClick={toggleMute} className="absolute top-4 left-4 z-30 bg-black/60 backdrop-blur-sm hover:bg-black/80 p-2 rounded-full text-white transition">
                {isMuted ? '🔇' : '🔊'}
              </button>
              {user?._id && sameId(user._id, post.user?._id) && (
                <div className="absolute top-4 right-4 z-30">
                  <button onClick={(e) => { e.stopPropagation(); setEditContent(post.content || ''); setEditFile(null); setEditPreview(null); setIsEditModalOpen(true); }} className="bg-black/60 backdrop-blur-sm hover:bg-black/80 p-2 rounded-full text-white transition">⋮</button>
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
                          {post.user?.avatar ? <img src={post.user.avatar} alt="Avatar" className="w-full h-full object-cover" crossOrigin="anonymous" /> : post.user?.username?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-row items-center gap-1.5">
                          <span className="text-white font-bold text-base drop-shadow-lg flex items-center gap-1">
                            @{post.user?.username}{post.user?.isVerified && <span className="text-blue-500 text-lg ml-1">✓</span>}
                          </span>
                        </div>
                      </Link>
                      <p className="text-white/90 text-sm drop-shadow-md leading-relaxed max-w-[80%]">{post.content}</p>
                    </div>

                    <AnimatePresence>
                      {!isPlaying && (
                        <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                          <div className="w-16 h-16 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-lg"><FaPlay className="ml-1" size={24} /></div>
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
                  {post.user?.avatar ? <img src={post.user.avatar} className="w-full h-full object-cover" crossOrigin="anonymous" /> : <span className="text-white font-bold text-lg">{post.user?.username?.charAt(0).toUpperCase()}</span>}
                </div>
              </Link>
              {post.user?._id !== user?._id && (
                <AnimatePresence mode="wait">
                  {!isFollowingAuthor ? (
                    <motion.div key="follow-btn" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs border-[2px] border-[#0a0a0a] cursor-pointer" onClick={(e) => { e.stopPropagation(); handleFollow(post.user._id); }}>+</motion.div>
                  ) : (
                    <motion.div key="followed-btn" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs border-[2px] border-[#0a0a0a] cursor-pointer" onClick={(e) => { e.stopPropagation(); handleFollow(post.user._id); }}>✓</motion.div>
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

            <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={(e) => { e.stopPropagation(); setIsCommentsOpen(prev => !prev); }}>
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

            <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => navigator.clipboard.writeText(window.location.origin + `/post/${post._id}`)}>
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

      {/* ===== KOMMENTARIYALAR PANELI ===== */}
      <AnimatePresence>
        {isCommentsOpen && (
          <motion.div 
            initial={{ x: '100%' }} 
            animate={{ x: 0 }} 
            exit={{ x: '100%' }} 
            transition={{ type: "spring", damping: 25, stiffness: 200 }} 
            className="absolute top-0 right-0 h-full w-[420px] border-l border-white/10 bg-[#0a0a0a]/95 backdrop-blur-xl z-50 flex flex-col shadow-2xl shrink-0"
          >
            <div className="p-6 flex flex-col h-full">
              <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4 shrink-0">
                <span className="text-white font-bold text-lg">Комментарии</span>
                <button onClick={() => setIsCommentsOpen(false)} className="text-white/50 hover:text-white transition p-1"><FaTimes size={20} /></button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-6 pr-2 pb-4 custom-scrollbar">
                {(!post.comments || post.comments.length === 0) && <p className="text-white/40 text-center mt-10">Нет комментариев</p>}
                
                {post.comments?.map((comment) => {
                  const isCommentAuthor = user?._id === comment.user?._id;
                  const isPostAuthor = user?._id === post.user?._id;
                  const isLikedByMe = isUserLiked(comment.likes);

                  return (
                    <div key={comment._id} className="border-b border-white/5 pb-4">
                      <div className="flex gap-3 mb-2">
                        <Link to={`/profile/${comment.user?._id}`} className="shrink-0 hover:opacity-80 transition">
                          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs text-white overflow-hidden">
                            {comment.user?.avatar ? <img src={comment.user.avatar} alt="Avatar" className="w-full h-full object-cover" crossOrigin="anonymous" /> : comment.user?.username?.charAt(0).toUpperCase()}
                          </div>
                        </Link>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link to={`/profile/${comment.user?._id}`} className="text-white/60 text-xs font-medium hover:text-white transition inline-block">
                              @{comment.user?.username}
                            </Link>
                            {isPostAuthor && <span className="text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">Автор</span>}
                            {comment.user?.isVerified && <span className="text-blue-500 text-xs">✓</span>}
                          </div>

                          {editingCommentId === comment._id ? (
                            <div className="mt-1 flex flex-col gap-2">
                              <textarea 
                                value={editCommentText}
                                onChange={(e) => setEditCommentText(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent/50 resize-none"
                                rows="2"
                              />
                              <div className="flex gap-2">
                                <button onClick={() => { setEditingCommentId(null); setEditCommentText(''); }} className="text-xs text-white/50 hover:text-white">Отмена</button>
                                <button onClick={() => saveEditComment(post._id, comment._id, false)} className="text-xs text-accent hover:opacity-80">Сохранить</button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-white/80 text-sm mt-1">{comment.text}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 ml-11 mt-1">
                        <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleCommentLike(post._id, comment._id)}>
                          <span className={`text-sm transition-colors ${isLikedByMe ? 'text-red-500' : 'text-white/40 hover:text-white'}`}>{isLikedByMe ? <FaHeart /> : <FaRegHeart />}</span>
                          <span className="text-xs text-white/40">{comment.likes?.length > 0 ? comment.likes.length : ''}</span>
                        </div>
                        <div className="flex items-center gap-1 cursor-pointer text-white/40 hover:text-white transition text-xs" onClick={() => { document.getElementById(`reply-input-${comment._id}`)?.focus(); }}>
                          <FaReply size={12} /> <span>Ответить</span>
                        </div>
                        {isCommentAuthor && !editingCommentId && (
                          <div className="flex items-center gap-2 text-white/30 ml-auto">
                            <button onClick={() => startEditComment(comment._id, comment.text)} className="hover:text-white transition"><FaPencilAlt size={12} /></button>
                            <button onClick={() => deleteComment(post._id, comment._id, false)} className="hover:text-red-400 transition"><FaTrash size={12} /></button>
                          </div>
                        )}
                      </div>

                      <div className="ml-11 mt-2 flex gap-2">
                        <input 
                          id={`reply-input-${comment._id}`}
                          type="text"
                          placeholder="Написать ответ..."
                          value={replyTexts[comment._id] || ''}
                          onChange={(e) => setReplyTexts(prev => ({ ...prev, [comment._id]: e.target.value }))}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleReply(post._id, comment._id); }}
                          className="flex-1 bg-transparent border-b border-white/10 text-white text-xs outline-none pb-1 placeholder:text-white/30 focus:border-accent/50 transition"
                        />
                        <button onClick={() => handleReply(post._id, comment._id)} className="text-accent text-xs font-medium hover:opacity-80 transition">Отправить</button>
                      </div>

                      {comment.replies?.length > 0 && (
                        <div className="ml-11 mt-3 space-y-3 border-l-2 border-white/10 pl-3">
                          {comment.replies.map((reply) => {
                            const isReplyAuthor = user?._id === reply.user?._id;
                            const isReplyEditing = editingCommentId === reply._id;

                            return (
                              <div key={reply._id} className="flex gap-3">
                                <Link to={`/profile/${reply.user?._id}`} className="shrink-0 hover:opacity-80 transition">
                                  <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-[10px] text-white overflow-hidden">
                                    {reply.user?.avatar ? <img src={reply.user.avatar} alt="Avatar" className="w-full h-full object-cover" crossOrigin="anonymous" /> : reply.user?.username?.charAt(0).toUpperCase()}
                                  </div>
                                </Link>
                                
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Link to={`/profile/${reply.user?._id}`} className="text-white/40 text-[11px] font-medium hover:text-white transition inline-block">
                                      @{reply.user?.username}
                                    </Link>
                                    {reply.user?.isVerified && <span className="text-blue-500 text-[10px]">✓</span>}
                                  </div>

                                  {isReplyEditing ? (
                                    <div className="mt-1 flex flex-col gap-2">
                                      <textarea 
                                        value={editCommentText} 
                                        onChange={(e) => setEditCommentText(e.target.value)} 
                                        className="w-full bg-black/40 border border-white/10 text-white rounded-lg px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-accent/50 resize-none" 
                                        rows="2" 
                                      />
                                      <div className="flex gap-2">
                                        <button onClick={() => { setEditingCommentId(null); setEditCommentText(''); }} className="text-[10px] text-white/50 hover:text-white">Отмена</button>
                                        <button onClick={() => saveEditComment(post._id, reply._id, true)} className="text-[10px] text-accent hover:opacity-80">Сохранить</button>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-white/70 text-sm mt-1">{reply.text}</p>
                                  )}
                                  
                                  {isReplyAuthor && !isReplyEditing && (
                                    <div className="flex items-center gap-2 mt-1 text-white/20">
                                      <button onClick={() => startEditComment(reply._id, reply.text)} className="hover:text-white transition"><FaPencilAlt size={10} /></button>
                                      <button onClick={() => deleteComment(post._id, reply._id, true)} className="hover:text-red-400 transition"><FaTrash size={10} /></button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <div className="p-4 border-t border-white/10 bg-[#0a0a0a]/90 backdrop-blur-md z-10 shrink-0">
                <div className="flex gap-2 bg-black/40 border border-white/10 rounded-full px-4 py-2 items-center">
                  <input 
                    type="text" 
                    placeholder="Добавить комментарий..." 
                    value={commentText} 
                    onChange={(e) => setCommentText(e.target.value)} 
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(post._id); }} 
                    className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/30" 
                  />
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