import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHeart, FaRegHeart, FaComment, FaPlay, FaChevronUp, FaChevronDown, FaBookmark, FaTrash, FaPencilAlt, FaReply, FaShare } from 'react-icons/fa';
import { FiBookmark } from 'react-icons/fi';

const Search = () => {
  const { user: currentUser, setUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const typeParam = searchParams.get('type') || 'all';
  
  const [activeTab, setActiveTab] = useState(typeParam);
  const [results, setResults] = useState({ users: [], posts: [], reels: [] });
  const [loading, setLoading] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);
  const videoRefs = useRef({}); 

  const [viewerPost, setViewerPost] = useState(null);
  const [viewerPosts, setViewerPosts] = useState([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef(null);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [commentText, setCommentText] = useState('');

  const [replyTexts, setReplyTexts] = useState({});
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');

  // ===== ИСПРАВЛЕННАЯ ФУНКЦИЯ =====
  const getMediaUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/uploads')) return 'https://lume-5mof.onrender.com' + url;
    return url;
  };

  const sameId = (a, b) => a != null && b != null && String(a?._id || a) === String(b?._id || b);
  const isIdInArray = (arr, id) => Array.isArray(arr) && arr.some(item => sameId(item, id));

  useEffect(() => {
    if (!query.trim()) {
      setResults({ users: [], posts: [], reels: [] });
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.append('q', query.trim());
        if (activeTab !== 'all') params.append('type', activeTab);

        const res = await axios.get(`/search?${params.toString()}`, { signal: controller.signal });
        setResults(res.data);
      } catch (error) {
        if (error.name !== 'CanceledError' && error.code !== 'ERR_CANCELED') {
          alert('Ошибка поиска: ' + (error.response?.data?.message || error.message));
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, activeTab]);

  // ======= ЛОГИКА ВОСПРОИЗВЕДЕНИЯ ВИДЕО В СЕТКЕ (HOVER) =======
  useEffect(() => {
    Object.keys(videoRefs.current).forEach((id) => {
      const video = videoRefs.current[id];
      if (!video) return;
      if (id === hoveredId) {
        video.currentTime = 0;
        video.play().catch(() => {});
      } else {
        video.pause();
        video.currentTime = 0;
      }
    });
  }, [hoveredId]);

  const openViewer = (post, postsList) => {
    const index = postsList.findIndex(p => p._id === post._id);
    setViewerPosts(postsList);
    setViewerIndex(index);
    setViewerPost(post);
    setProgress(0);
    setIsMuted(true);
    setIsCommentsOpen(false);
    document.body.style.overflow = 'hidden';
  };

  const closeViewer = () => {
    setViewerPost(null);
    setViewerPosts([]);
    setProgress(0);
    setIsMuted(true);
    setIsCommentsOpen(false);
    document.body.style.overflow = '';
  };

  const goNext = useCallback(() => {
    if (viewerIndex < viewerPosts.length - 1) {
      setViewerIndex(prev => prev + 1);
      setViewerPost(viewerPosts[viewerIndex + 1]);
      setProgress(0);
      setIsCommentsOpen(false);
    }
  }, [viewerIndex, viewerPosts]);

  const goPrev = useCallback(() => {
    if (viewerIndex > 0) {
      setViewerIndex(prev => prev - 1);
      setViewerPost(viewerPosts[viewerIndex - 1]);
      setProgress(0);
      setIsCommentsOpen(false);
    }
  }, [viewerIndex, viewerPosts]);

  useEffect(() => {
    if (!viewerPost) return;
    const handleScrollBlocker = (e) => {
      const sidebar = document.getElementById('lume-sidebar');
      if (sidebar && sidebar.contains(e.target)) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (isCommentsOpen) {
        const commentsPanel = document.querySelector('.w-\\[420px\\]');
        if (commentsPanel && commentsPanel.contains(e.target)) return;
      }
      e.preventDefault();
      const delta = e.deltaY || e.wheelDelta;
      if (Math.abs(delta) < 50) return;
      if (delta > 0) goNext();
      else if (delta < 0) goPrev();
    };
    window.addEventListener('wheel', handleScrollBlocker, { passive: false });
    window.addEventListener('touchmove', handleScrollBlocker, { passive: false });
    return () => {
      window.removeEventListener('wheel', handleScrollBlocker);
      window.removeEventListener('touchmove', handleScrollBlocker);
    };
  }, [viewerPost, isCommentsOpen, goNext, goPrev]);

  // =========================================================
  //  УПРАВЛЕНИЕ С КЛАВИАТУРЫ (Стрелки и Пробел)
  // =========================================================
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        goPrev();
      } else if (e.key === ' ') {
        e.preventDefault();
        handleVideoClick();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev]);

  // ============= СТАБИЛЬНЫЕ LIKE / SAVE =============
  const updateSearchPostEverywhere = (postId, updater) => {
    setViewerPosts(prev => prev.map(p => p._id === postId ? updater(p) : p));
    setViewerPost(prev => prev && prev._id === postId ? updater(prev) : prev);
    setResults(prev => ({
      ...prev,
      reels: prev.reels.map(p => p._id === postId ? updater(p) : p),
      posts: prev.posts.map(p => p._id === postId ? updater(p) : p)
    }));
  };

  const handleLike = async (postId) => {
    if (!postId || !currentUser?._id) return;
    const targetPost = viewerPosts.find(p => p._id === postId) || viewerPost;
    if (!targetPost) return;
    const wasLiked = targetPost.isLikedByMe || isIdInArray(targetPost.likes, currentUser._id);
    const originalPost = targetPost;

    updateSearchPostEverywhere(postId, p => ({
      ...p,
      isLikedByMe: !wasLiked,
      likes: wasLiked
        ? (p.likes || []).filter(id => !sameId(id, currentUser._id))
        : [...(p.likes || []), currentUser._id]
    }));

    try {
      const response = await axios.post(`/posts/${postId}/like`);
      updateSearchPostEverywhere(postId, p => ({
        ...p,
        isLikedByMe: Boolean(response.data.isLiked),
        likes: Array.isArray(response.data.likes) ? response.data.likes : p.likes || []
      }));
    } catch (error) {
      updateSearchPostEverywhere(postId, () => originalPost);
      alert('Ошибка лайка: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSave = async (postId) => {
    if (!postId || !currentUser?._id) return;
    const targetPost = viewerPosts.find(p => p._id === postId) || viewerPost;
    if (!targetPost) return;
    const wasSaved = targetPost.isSavedByMe || isIdInArray(targetPost.savedBy, currentUser._id);
    const originalPost = targetPost;

    updateSearchPostEverywhere(postId, p => ({
      ...p,
      isSavedByMe: !wasSaved,
      savedBy: wasSaved
        ? (p.savedBy || []).filter(id => !sameId(id, currentUser._id))
        : [...(p.savedBy || []), currentUser._id]
    }));

    try {
      const response = await axios.post(`/posts/${postId}/save`);
      updateSearchPostEverywhere(postId, p => ({
        ...p,
        isSavedByMe: Boolean(response.data.isSaved),
        savedBy: Array.isArray(response.data.savedBy) ? response.data.savedBy : p.savedBy || []
      }));
    } catch (error) {
      updateSearchPostEverywhere(postId, () => originalPost);
      alert('Ошибка сохранения: ' + (error.response?.data?.message || error.message));
    }
  };
  // =================================================

  const handleShare = async (postId) => {
    if (!postId || !currentUser?._id) return;

    const shareUrl = `${window.location.origin}/post/${postId}`;
    const currentPost = viewerPosts.find(p => p._id === postId) || viewerPost;
    const shareTitle = currentPost?.user?.username
      ? `Пост @${currentPost.user.username} в Lume`
      : 'Пост в Lume';
    const shareText = currentPost?.content || 'Посмотри этот пост в Lume';

    try {
      const response = await axios.post(`/posts/${postId}/share`);
      console.log('✅ SHARE NOTIFICATION CREATED:', response.data);
    } catch (error) {
      console.error('❌ SHARE NOTIFICATION ERROR:', error);
      alert(error.response?.data?.message || 'Не удалось поделиться постом.');
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl
        });
        return;
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Ссылка на пост скопирована.');
    } catch (error) {
      console.error('Ошибка копирования ссылки:', error);
      alert(shareUrl);
    }
  };

  const handleFollow = async (targetUserId) => {
    if (!currentUser || !targetUserId || targetUserId === currentUser._id) return;
    try {
      const response = await axios.post(`/users/follow/${targetUserId}`);
      const { isFollowing } = response.data;
      setUser(prev => {
        if (!prev) return prev;
        const currentFollowing = prev.following || [];
        return { ...prev, following: isFollowing ? [...currentFollowing, targetUserId] : currentFollowing.filter(id => id !== targetUserId) };
      });
      const updatedUser = { ...currentUser, following: isFollowing ? [...currentUser.following, targetUserId] : currentUser.following.filter(id => id !== targetUserId) };
      localStorage.setItem('lumeUser', JSON.stringify(updatedUser));
    } catch (error) {
      alert('Ошибка подписки/отписки: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleAddComment = async (postId) => {
    if (!commentText.trim() || !postId) return;
    try {
      const response = await axios.post(`/posts/${postId}/comment`, { text: commentText });
      const newComment = response.data;
      const updateComments = (post) => ({ ...post, comments: [...post.comments, newComment] });
      setViewerPost(updateComments);
      setViewerPosts(prev => prev.map(p => p._id === postId ? updateComments(p) : p));
      setCommentText('');
    } catch (error) {
      alert('Ошибка добавления комментария: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleCommentLike = async (postId, commentId) => {
    try {
      const response = await axios.post(`/posts/${postId}/comments/${commentId}/like`);
      const updatedComment = response.data.comment;
      const updateComments = (comments) => comments.map(c => c._id === commentId ? updatedComment : c);
      setViewerPost(prev => ({ ...prev, comments: updateComments(prev.comments) }));
      setViewerPosts(prev => prev.map(p => p._id === postId ? { ...p, comments: updateComments(p.comments) } : p));
    } catch (error) {
      alert('Ошибка лайка комментария: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleReply = async (postId, commentId) => {
    const text = replyTexts[commentId];
    if (!text || !text.trim()) return;
    try {
      const response = await axios.post(`/posts/${postId}/comments/${commentId}/reply`, { text });
      const { reply, commentId: parentId } = response.data;
      const updateReplies = (comments) => comments.map(c => 
        c._id === parentId ? { ...c, replies: [...c.replies, reply] } : c
      );
      setViewerPost(prev => ({ ...prev, comments: updateReplies(prev.comments) }));
      setViewerPosts(prev => prev.map(p => p._id === postId ? { ...p, comments: updateReplies(p.comments) } : p));
      setReplyTexts(prev => ({ ...prev, [commentId]: '' }));
    } catch (error) {
      alert('Ошибка добавления ответа: ' + (error.response?.data?.message || error.message));
    }
  };

  const startEditComment = (commentId, currentText) => {
    setEditingCommentId(commentId);
    setEditCommentText(currentText);
  };

  const saveEditComment = async (postId, commentId, isReply = false) => {
    if (!editCommentText.trim()) return;
    try {
      await axios.put(`/posts/${postId}/comments/${commentId}`, { text: editCommentText, isReply });
      const updateComment = (comments) => comments.map(c => 
        c._id === commentId ? { ...c, text: editCommentText } : 
        isReply ? { ...c, replies: c.replies.map(r => r._id === commentId ? { ...r, text: editCommentText } : r) } : c
      );
      setViewerPost(prev => ({ ...prev, comments: updateComment(prev.comments) }));
      setViewerPosts(prev => prev.map(p => p._id === postId ? { ...p, comments: updateComment(p.comments) } : p));
      setEditingCommentId(null);
      setEditCommentText('');
    } catch (error) {
      alert('Ошибка редактирования: ' + (error.response?.data?.message || error.message));
    }
  };

  const deleteComment = async (postId, commentId, isReply = false) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот комментарий?')) return;
    try {
      await axios.delete(`/posts/${postId}/comments/${commentId}`, { data: { isReply } });
      const filterComment = (comments) => isReply 
        ? comments.map(c => ({ ...c, replies: c.replies.filter(r => r._id !== commentId) }))
        : comments.filter(c => c._id !== commentId);
      setViewerPost(prev => ({ ...prev, comments: filterComment(prev.comments) }));
      setViewerPosts(prev => prev.map(p => p._id === postId ? { ...p, comments: filterComment(p.comments) } : p));
    } catch (error) {
      alert('Ошибка удаления: ' + (error.response?.data?.message || error.message));
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    setIsMuted(prev => !prev);
  };

  const handleVideoClick = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      const duration = videoRef.current.duration;
      if (duration && duration > 0) {
        setProgress((currentTime / duration) * 100);
      }
    }
  };

  const tabs = [
    { key: 'all', label: 'Все' },
    { key: 'users', label: 'Пользователи' },
    { key: 'posts', label: 'Посты' },
    { key: 'reels', label: 'Reels' },
  ];

  const getCurrentResults = () => {
    if (activeTab === 'users') return results.users.length;
    if (activeTab === 'posts') return results.posts.length;
    if (activeTab === 'reels') return results.reels.length;
    return results.users.length + results.posts.length + results.reels.length;
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
    const newParams = new URLSearchParams(searchParams);
    if (key === 'all') {
      newParams.delete('type');
    } else {
      newParams.set('type', key);
    }
    setSearchParams(newParams);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 relative min-h-screen">
      <h2 className="text-2xl font-bold text-white mb-6">
        Результаты по запросу: <span className="text-accent">"{query}"</span>
      </h2>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              activeTab === tab.key 
                ? 'bg-white text-black' 
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-white/50">Загрузка...</p>}
      {!loading && getCurrentResults() === 0 && (
        <p className="text-white/30 text-center mt-10">
          По запросу "{query}" ничего не найдено в разделе "{tabs.find(t => t.key === activeTab)?.label}".
        </p>
      )}

      {(activeTab === 'all' || activeTab === 'users') && results.users.length > 0 && (
        <div className="mb-8">
          <h3 className="text-white/70 text-lg mb-4">Пользователи</h3>
          <div className="space-y-3">
            {results.users.map(user => (
              <Link key={user._id} to={`/profile/${user._id}`} className="flex items-center gap-4 p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition">
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold overflow-hidden">
                  {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : user.username?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1"><div className="text-white font-semibold">@{user.username}</div></div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {(activeTab === 'all' || activeTab === 'posts') && results.posts.length > 0 && (
        <div className="mb-8">
          <h3 className="text-white/70 text-lg mb-4">Посты</h3>
          <div className="grid grid-cols-2 gap-4">
            {results.posts.map(post => (
              <div 
                key={post._id} 
                onClick={() => openViewer(post, results.posts)}
                className="bg-white/5 border border-white/10 rounded-xl p-4 cursor-pointer hover:bg-white/10 transition"
              >
                <p className="text-white/90 text-sm font-medium line-clamp-2">{post.content}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-white/50">
                  <span>@{post.user?.username}</span>
                  <span className="flex items-center gap-1"><FaHeart size={12} /> {post.likes?.length || 0}</span>
                  <span className="flex items-center gap-1"><FaComment size={12} /> {post.comments?.length || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(activeTab === 'all' || activeTab === 'reels') && results.reels.length > 0 && (
        <div>
          <h3 className="text-white/70 text-lg mb-4">Reels</h3>
          <div className="grid grid-cols-3 gap-2">
            {results.reels.map(reel => {
              const videoId = reel._id;
              return (
                <div 
                  key={videoId}
                  onMouseEnter={() => setHoveredId(videoId)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => openViewer(reel, results.reels)}
                  className="aspect-[1/1] bg-black/40 border border-white/10 rounded-xl overflow-hidden cursor-pointer relative group"
                >
                  {reel.mediaType === 'video' ? (
                    <video
                      ref={(el) => { if (el) videoRefs.current[videoId] = el; }}
                      src={getMediaUrl(reel.mediaUrl)}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                      loop={false}
                      onEnded={(e) => { if (hoveredId === videoId) { e.target.currentTime = 0; e.target.play().catch(() => {}); } }}
                    />
                  ) : (
                    <img src={getMediaUrl(reel.mediaUrl)} alt="Reel" className="w-full h-full object-cover" />
                  )}
                  <div className="absolute bottom-2 left-2 z-30 text-white drop-shadow-md w-full pr-4 pointer-events-none">
                    <div className="text-xs font-medium truncate">@{reel.user?.username}</div>
                    {reel.content && (
                      <div className="text-[10px] text-white/80 truncate mt-0.5 leading-tight opacity-90 max-w-[95%]">
                        {reel.content}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <AnimatePresence>
        {viewerPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-0 right-0 bottom-0 left-[260px] z-50 bg-[#0a0a0a] flex items-center justify-center overflow-hidden"
          >
            <div 
              className="flex flex-row items-center justify-center gap-4 md:gap-8 w-full max-w-[1000px] mx-auto px-4 h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`flex flex-row items-center justify-center gap-4 md:gap-8 transition-all duration-300 ease-in-out w-full ${isCommentsOpen ? 'translate-x-[-180px]' : 'translate-x-0'}`}>
                <div className="flex-1 flex items-center justify-center min-w-0 h-full">
                  <div className="relative w-full max-w-[450px] lg:max-w-[650px] aspect-[1/1] max-h-[85vh] rounded-[24px] overflow-hidden bg-black shadow-2xl cursor-pointer">
                    <button onClick={toggleMute} className="absolute top-4 left-4 z-30 bg-black/60 backdrop-blur-sm hover:bg-black/80 p-2 rounded-full text-white transition">
                      {isMuted ? '🔇' : '🔊'}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); closeViewer(); }} className="absolute top-4 right-4 z-30 bg-black/60 backdrop-blur-sm hover:bg-black/80 p-2 rounded-full text-white transition">✕</button>
                    <div onClick={handleVideoClick} className="w-full h-full relative">
                      <AnimatePresence mode="wait">
                        <motion.div key={viewerPost._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="w-full h-full relative">
                          {viewerPost.mediaUrl ? (
                            viewerPost.mediaType === 'video' ? (
                              <video ref={videoRef} src={getMediaUrl(viewerPost.mediaUrl)} className="w-full h-full object-cover" autoPlay loop playsInline muted={isMuted} onTimeUpdate={handleTimeUpdate} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} />
                            ) : (
                              <img src={getMediaUrl(viewerPost.mediaUrl)} className="w-full h-full object-cover" alt="Reel" crossOrigin="anonymous" />
                            )
                          ) : (
                            <div className="w-full h-full bg-gray-800 flex items-center justify-center text-white/30 text-4xl font-bold text-center p-4">{viewerPost.content}</div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-linear-to-t from-black/90 via-black/40 to-transparent pointer-events-none rounded-b-[24px]"></div>
                          <div className="absolute bottom-6 left-4 z-10 text-left">
                            <Link to={`/profile/${viewerPost.user?._id}`} className="inline-flex items-center gap-3 mb-2 hover:opacity-80 transition">
                              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-bold text-xs overflow-hidden shrink-0">
                                {viewerPost.user?.avatar && viewerPost.user.avatar !== '' ? <img src={viewerPost.user.avatar} alt="Avatar" className="w-full h-full object-cover" crossOrigin="anonymous" /> : viewerPost.user?.username?.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-white font-bold text-base drop-shadow-lg flex items-center gap-1">@{viewerPost.user?.username}{viewerPost.user?.isVerified && <span className="text-blue-500 text-lg ml-1">✓</span>}</span>
                            </Link>
                            <p className="text-white/90 text-sm drop-shadow-md leading-relaxed max-w-[80%]">{viewerPost.content}</p>
                          </div>
                          <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20 z-20 pointer-events-none">
                            <div className="h-full bg-red-500 transition-all duration-100 ease-linear" style={{ width: `${progress}%` }}></div>
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
                    <Link to={`/profile/${viewerPost.user?._id}`}>
                      <div className="w-12 h-12 rounded-full border-[2px] border-white/30 bg-gray-800 flex items-center justify-center overflow-hidden cursor-pointer hover:border-accent transition">
                        {viewerPost.user?.avatar && viewerPost.user.avatar !== '' ? <img src={viewerPost.user.avatar} alt="Avatar" className="w-full h-full object-cover" crossOrigin="anonymous" /> : <span className="text-white font-bold text-lg">{viewerPost.user?.username?.charAt(0).toUpperCase()}</span>}
                      </div>
                    </Link>
                    {viewerPost.user?._id !== currentUser?._id && (
                      <AnimatePresence mode="wait">
                        {!currentUser?.following?.map(id => id.toString()).includes(viewerPost.user?._id?.toString()) ? (
                          <motion.div
                            key="follow-btn"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ duration: 0.3, type: 'spring', stiffness: 400, damping: 25 }}
                            className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs border-[2px] border-[#0a0a0a] cursor-pointer select-none overflow-hidden shadow-lg"
                            onClick={(e) => { e.stopPropagation(); handleFollow(viewerPost.user?._id); }}
                          >
                            <motion.span key="plus" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.2 }}>+</motion.span>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="followed-btn"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ duration: 0.3, type: 'spring', stiffness: 400, damping: 25 }}
                            className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs border-[2px] border-[#0a0a0a] cursor-pointer select-none overflow-hidden shadow-lg"
                            onClick={(e) => { e.stopPropagation(); handleFollow(viewerPost.user?._id); }}
                          >
                            <motion.span key="check" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.2 }}>✓</motion.span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}
                  </div>

                  <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleLike(viewerPost._id); }}>
                    <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-black/80 transition">
                      {viewerPost.isLikedByMe || isIdInArray(viewerPost.likes, currentUser?._id) ? (
                        <FaHeart className="text-red-500 text-xl transition-colors" />
                      ) : (
                        <FaRegHeart className="text-white/80 text-xl hover:text-white transition-colors" />
                      )}
                    </div>
                    <span className="text-white/80 text-[11px] font-bold tracking-wide">{viewerPost.likes?.length || 0}</span>
                  </div>

                  <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => setIsCommentsOpen(!isCommentsOpen)}>
                    <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-black/80 transition">
                      <FaComment className="text-white/80 text-xl hover:text-white transition" />
                    </div>
                    <span className="text-white/80 text-[11px] font-bold tracking-wide">{viewerPost.comments?.length || 0}</span>
                  </div>

                  <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleSave(viewerPost._id); }}>
                    <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-black/80 transition">
                      {viewerPost.isSavedByMe || isIdInArray(viewerPost.savedBy, currentUser?._id) ? (
                        <FaBookmark className="text-yellow-400 text-xl transition-colors" />
                      ) : (
                        <FiBookmark className="text-white/80 text-xl hover:text-white transition-colors" />
                      )}
                    </div>
                    <span className="text-white/80 text-[11px] font-bold tracking-wide">{viewerPost.savedBy?.length || 0}</span>
                  </div>

                  <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleShare(viewerPost._id); }}>
                    <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-black/80 transition">
                      <FaShare className="text-white/80 text-xl hover:text-white transition-colors" />
                    </div>
                    <span className="text-white/80 text-[11px] font-bold tracking-wide">Поделиться</span>
                  </div>

                  <div className="border-t border-white/10 pt-4 mt-4 flex flex-col gap-3 w-full items-center">
                    <button onClick={(e) => { e.stopPropagation(); goPrev(); }} disabled={viewerIndex === 0} className="w-10 h-10 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-white hover:bg-black/80 transition disabled:opacity-30 flex items-center justify-center"><FaChevronUp size={16} /></button>
                    <button onClick={(e) => { e.stopPropagation(); goNext(); }} disabled={viewerIndex === viewerPosts.length - 1} className="w-10 h-10 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-white hover:bg-black/80 transition disabled:opacity-30 flex items-center justify-center"><FaChevronDown size={16} /></button>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {isCommentsOpen && (
                  <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ duration: 0.3 }}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-0 bottom-0 w-[420px] bg-[#0a0a0a]/95 backdrop-blur-xl border-l border-white/10 z-40 p-6 flex flex-col shadow-2xl"
                  >
                    <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                      <span className="text-white font-bold text-lg">Комментарии</span>
                      <button onClick={() => setIsCommentsOpen(false)} className="text-white/50 hover:text-white transition text-xl">✕</button>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-6 pr-2 pb-20 custom-scrollbar">
                      {viewerPost.comments?.length === 0 && <p className="text-white/40 text-center mt-10">Нет комментариев</p>}
                      {viewerPost.comments?.map((comment) => {
                        const isCommentAuthor = currentUser?._id === comment.user?._id;
                        const isPostAuthor = currentUser?._id === viewerPost.user?._id;
                        const isLikedByMe = isIdInArray(comment.likes, currentUser?._id);
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
                                      <button onClick={() => saveEditComment(viewerPost._id, comment._id, false)} className="text-xs text-accent hover:opacity-80">Сохранить</button>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-white/80 text-sm mt-1">{comment.text}</p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-4 ml-11 mt-1">
                              <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleCommentLike(viewerPost._id, comment._id)}>
                                <span className={`text-sm transition-colors ${isLikedByMe ? 'text-red-500' : 'text-white/40 hover:text-white'}`}>
                                  {isLikedByMe ? <FaHeart /> : <FaRegHeart />}
                                </span>
                                <span className="text-xs text-white/40">{comment.likes?.length > 0 ? comment.likes.length : ''}</span>
                              </div>
                              <div className="flex items-center gap-1 cursor-pointer text-white/40 hover:text-white transition text-xs" onClick={() => {
                                const input = document.getElementById(`reply-input-${comment._id}`);
                                if (input) { input.focus(); }
                              }}>
                                <FaReply size={12} /> <span>Ответить</span>
                              </div>
                              {isCommentAuthor && !editingCommentId && (
                                <div className="flex items-center gap-2 text-white/30 ml-auto">
                                  <button onClick={() => startEditComment(comment._id, comment.text)} className="hover:text-white transition"><FaPencilAlt size={12} /></button>
                                  <button onClick={() => deleteComment(viewerPost._id, comment._id, false)} className="hover:text-red-400 transition"><FaTrash size={12} /></button>
                                </div>
                              )}
                            </div>
                            <div className="ml-11 mt-2 flex gap-2">
                              <input id={`reply-input-${comment._id}`} type="text" placeholder="Написать ответ..." value={replyTexts[comment._id] || ''} onChange={(e) => setReplyTexts(prev => ({ ...prev, [comment._id]: e.target.value }))} onKeyDown={(e) => { if (e.key === 'Enter') handleReply(viewerPost._id, comment._id); }} className="flex-1 bg-transparent border-b border-white/10 text-white text-xs outline-none pb-1 placeholder:text-white/30 focus:border-accent/50 transition" />
                              <button onClick={() => handleReply(viewerPost._id, comment._id)} className="text-accent text-xs font-medium hover:opacity-80 transition">Отправить</button>
                            </div>
                            {comment.replies?.length > 0 && (
                              <div className="ml-11 mt-3 space-y-3 border-l-2 border-white/10 pl-3">
                                {comment.replies.map((reply) => {
                                  const isReplyAuthor = currentUser?._id === reply.user?._id;
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
                                              <button onClick={() => saveEditComment(viewerPost._id, reply._id, true)} className="text-[10px] text-accent hover:opacity-80">Сохранить</button>
                                            </div>
                                          </div>
                                        ) : (
                                          <p className="text-white/70 text-sm mt-1">{reply.text}</p>
                                        )}
                                        {isReplyAuthor && !isReplyEditing && (
                                          <div className="flex items-center gap-2 mt-1 text-white/20">
                                            <button onClick={() => startEditComment(reply._id, reply.text)} className="hover:text-white transition"><FaPencilAlt size={10} /></button>
                                            <button onClick={() => deleteComment(viewerPost._id, reply._id, true)} className="hover:text-red-400 transition"><FaTrash size={10} /></button>
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
                        <input type="text" placeholder="Добавить комментарий..." value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(viewerPost._id); }} className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/30" />
                        <button onClick={() => handleAddComment(viewerPost._id)} className="text-accent font-medium text-sm hover:opacity-80 transition">Опубликовать</button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Search;