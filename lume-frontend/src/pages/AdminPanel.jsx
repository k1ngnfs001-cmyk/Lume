import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHeart, FaRegHeart, FaPlay, FaChevronUp, FaChevronDown, FaSearch, FaComment, FaBookmark, FaTrash, FaPencilAlt, FaReply } from 'react-icons/fa';
import { FiBookmark } from 'react-icons/fi';

const AdminPanel = ({ isSidebarOpen = true }) => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [postSearchQuery, setPostSearchQuery] = useState('');

  const [editingUser, setEditingUser] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [selectedPostComments, setSelectedPostComments] = useState([]);
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);

  const [viewerPost, setViewerPost] = useState(null);
  const [viewerPosts, setViewerPosts] = useState([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef(null);
  
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyTexts, setReplyTexts] = useState({});
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');

  const [editMediaFile, setEditMediaFile] = useState(null);
  const [editMediaPreview, setEditMediaPreview] = useState(null);
  const editMediaInputRef = useRef(null);

  const getMediaUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/uploads')) return 'https://lume-5mof.onrender.com' + url;
    return url;
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, postsRes] = await Promise.all([
        axios.get('/admin/users'),
        axios.get('/admin/posts')
      ]);
      setUsers(usersRes.data);
      setPosts(postsRes.data);
    } catch (error) {
      console.error('Ошибка загрузки данных админа:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    (user.email && user.email.toLowerCase().includes(userSearchQuery.toLowerCase()))
  );

  const filteredPosts = posts.filter(post => 
    (post.content && post.content.toLowerCase().includes(postSearchQuery.toLowerCase())) ||
    (post.user?.username && post.user.username.toLowerCase().includes(postSearchQuery.toLowerCase()))
  );

  const handleUpdateUser = async () => {
    try {
      await axios.put(`/admin/users/${editingUser._id}`, editingUser);
      setUsers(prev => prev.map(u => u._id === editingUser._id ? editingUser : u));
      setEditingUser(null);
      alert('Пользователь обновлён!');
    } catch (error) {
      alert('Ошибка обновления: ' + error.message);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Удалить пользователя и все его посты?')) return;
    try {
      await axios.delete(`/admin/users/${id}`);
      setUsers(prev => prev.filter(u => u._id !== id));
      setPosts(prev => prev.filter(p => p.user?._id !== id));
    } catch (error) { alert('Ошибка: ' + error.message); }
  };

  const handleToggleVerify = async (id) => {
    try {
      const res = await axios.put(`/admin/verify/${id}`);
      const { isVerified } = res.data;
      setUsers(prev => prev.map(u => u._id === id ? { ...u, isVerified } : u));
    } catch (error) { alert('Ошибка: ' + error.message); }
  };

  const handleToggleBan = async (id) => {
    try {
      const res = await axios.put(`/admin/ban/${id}`);
      const { isBanned } = res.data;
      setUsers(prev => prev.map(u => u._id === id ? { ...u, isBanned } : u));
    } catch (error) {
      alert('Ошибка бана/разбана: ' + error.message);
    }
  };

  const handleUpdatePost = async () => {
    try {
      const formData = new FormData();
      formData.append('content', editingPost.content);
      if (editMediaFile) {
        formData.append('media', editMediaFile);
      }

      const res = await axios.put(`/admin/posts/${editingPost._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setPosts(prev => prev.map(p => p._id === editingPost._id ? res.data : p));
      setEditingPost(null);
      setEditMediaFile(null);
      setEditMediaPreview(null);
      alert('Пост и медиа обновлены!');
    } catch (error) {
      alert('Ошибка обновления: ' + error.message);
    }
  };

  const handleDeletePost = async (id) => {
    if (!window.confirm('Удалить этот пост?')) return;
    try {
      await axios.delete(`/admin/posts/${id}`);
      setPosts(prev => prev.filter(p => p._id !== id));
    } catch (error) { alert('Ошибка: ' + error.message); }
  };

  const handleOpenComments = async (postId) => {
    setActiveCommentPostId(postId);
    try {
      const res = await axios.get(`/admin/posts/${postId}/comments`);
      setSelectedPostComments(res.data);
      setCommentsModalOpen(true);
    } catch (error) { alert('Ошибка загрузки комментариев: ' + error.message); }
  };

  const handleUpdateComment = async () => {
    if (!editCommentText.trim()) return;
    try {
      const response = await axios.put(`/admin/comments/${editingComment._id}`, { text: editCommentText });
      setSelectedPostComments(prev => prev.map(c => c._id === editingComment._id ? response.data : c));
      setPosts(prev => prev.map(p => 
        p._id === activeCommentPostId ? { ...p, comments: p.comments.map(c => c._id === editingComment._id ? response.data : c) } : p
      ));
      setEditingComment(null);
    } catch (error) { alert('Ошибка обновления: ' + error.message); }
  };

  const handleDeleteComment = async (id) => {
    if (!window.confirm('Удалить этот комментарий?')) return;
    try {
      await axios.delete(`/admin/comments/${id}`);
      setSelectedPostComments(prev => prev.filter(c => c._id !== id));
      setPosts(prev => prev.map(p => 
        p._id === activeCommentPostId ? { ...p, comments: p.comments.filter(c => c._id !== id) } : p
      ));
    } catch (error) { alert('Ошибка удаления: ' + error.message); }
  };

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

  const goNext = () => {
    if (viewerIndex < viewerPosts.length - 1) {
      setViewerIndex(prev => prev + 1);
      setViewerPost(viewerPosts[viewerIndex + 1]);
      setProgress(0);
    }
  };

  const goPrev = () => {
    if (viewerIndex > 0) {
      setViewerIndex(prev => prev - 1);
      setViewerPost(viewerPosts[viewerIndex - 1]);
      setProgress(0);
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

  const handleLike = async (postId) => {
    if (!postId) return;
    try {
      const response = await axios.post(`/posts/${postId}/like`);
      const { likes, isLiked } = response.data;
      const updatePost = (p) => p._id === postId ? { ...p, likes, isLikedByMe: isLiked } : p;
      setViewerPosts(prev => prev.map(updatePost));
      setPosts(prev => prev.map(updatePost));
    } catch (error) {
      alert('Ошибка лайка: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSave = async (postId) => {
    if (!postId) return;
    try {
      const response = await axios.post(`/posts/${postId}/save`);
      const { isSaved } = response.data;
      const updatePost = (p) => p._id === postId ? { 
        ...p, 
        savedBy: isSaved ? [...(p.savedBy || []), currentUser._id] : (p.savedBy || []).filter(id => id !== currentUser._id) 
      } : p;
      setViewerPosts(prev => prev.map(updatePost));
      setPosts(prev => prev.map(updatePost));
    } catch (error) {
      alert('Ошибка сохранения: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleAddComment = async (postId) => {
    if (!commentText.trim() || !postId) return;
    try {
      const response = await axios.post(`/posts/${postId}/comment`, { text: commentText });
      const newComment = response.data;
      const updatePostComments = (p) => p._id === postId ? { ...p, comments: [...p.comments, newComment] } : p;
      setViewerPost(prev => ({ ...prev, comments: [...prev.comments, newComment] }));
      setViewerPosts(prev => prev.map(updatePostComments));
      setPosts(prev => prev.map(updatePostComments));
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
      setPosts(prev => prev.map(p => p._id === postId ? { ...p, comments: updateComments(p.comments) } : p));
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
      setPosts(prev => prev.map(p => p._id === postId ? { ...p, comments: updateReplies(p.comments) } : p));
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
      setPosts(prev => prev.map(p => p._id === postId ? { ...p, comments: updateComment(p.comments) } : p));
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
      setPosts(prev => prev.map(p => p._id === postId ? { ...p, comments: filterComment(p.comments) } : p));
    } catch (error) {
      alert('Ошибка удаления: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) return <div className="min-h-screen bg-dark flex items-center justify-center text-white/50">Загрузка панели...</div>;

  return (
    <div className="min-h-screen bg-dark p-8 flex flex-col items-center text-white relative">
      <div className="w-full max-w-6xl space-y-12">
        <h1 className="text-4xl font-bold">Панель администратора</h1>
        
        {/* Users Table */}
        <div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <h2 className="text-2xl font-bold">Управление пользователями</h2>
            <div className="relative w-full md:w-64">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm" />
              <input 
                type="text" 
                placeholder="Поиск по имени или email..." 
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full bg-black/40 border border-white/10 text-white rounded-xl pl-9 pr-4 py-2 outline-none focus:ring-2 focus:ring-accent/50 placeholder:text-white/30"
              />
            </div>
          </div>

          <table className="w-full bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <thead className="bg-white/10">
              <tr><th className="p-4 text-left">ID</th><th className="p-4 text-left">Имя</th><th className="p-4 text-left">Статус</th><th className="p-4 text-right">Действия</th></tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr><td colSpan="4" className="p-8 text-center text-white/40">Пользователи не найдены</td></tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user._id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-4 font-mono text-xs">{user._id.slice(0,8)}...</td>
                    <td className="p-4 flex items-center gap-2">
                      @{user.username} {user.isVerified && <span className="text-blue-500">✓</span>} {user.isAdmin && <span className="text-red-500 text-xs ml-2 bg-red-500/20 px-2 py-0.5 rounded">ADMIN</span>}
                    </td>
                    <td className="p-4">
                      <button onClick={() => handleToggleVerify(user._id)} disabled={user.isAdmin} className={`px-3 py-1 rounded-full text-xs ${user.isAdmin ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed' : user.isVerified ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'}`}>
                        {user.isAdmin ? 'Недоступно' : user.isVerified ? 'Верифицирован' : 'Не верифицирован'}
                      </button>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => setEditingUser(user)} className="px-4 py-1 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition">✎</button>
                      <button onClick={() => handleToggleBan(user._id)} disabled={user.isAdmin} className={`px-3 py-1 rounded-lg text-xs transition ${user.isAdmin ? 'bg-gray-500/10 text-gray-500 cursor-not-allowed' : user.isBanned ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'}`}>
                        {user.isAdmin ? '-' : user.isBanned ? 'Разбанить' : 'Забанить'}
                      </button>
                      <button onClick={() => handleDeleteUser(user._id)} disabled={user.isAdmin} className={`px-4 py-1 rounded-lg ${user.isAdmin ? 'bg-gray-500/10 text-gray-500 cursor-not-allowed' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'}`}>
                        {user.isAdmin ? '-' : 'Удалить'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Posts Grid */}
        <div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <h2 className="text-2xl font-bold">Управление постами</h2>
            <div className="relative w-full md:w-64">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm" />
              <input 
                type="text" 
                placeholder="Поиск по описанию или автору..." 
                value={postSearchQuery}
                onChange={(e) => setPostSearchQuery(e.target.value)}
                className="w-full bg-black/40 border border-white/10 text-white rounded-xl pl-9 pr-4 py-2 outline-none focus:ring-2 focus:ring-accent/50 placeholder:text-white/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.length === 0 ? (
              <div className="col-span-3 py-10 text-center text-white/40">Посты не найдены</div>
            ) : (
              filteredPosts.map(post => (
                <div 
                  key={post._id} 
                  onClick={() => openViewer(post, posts)}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4 relative cursor-pointer hover:bg-white/10 transition"
                >
                  <div className="mb-2 pointer-events-none">
                    <p className="text-white/80 text-sm">@{post.user?.username}</p>
                    <p className="text-white line-clamp-3 mt-1">{post.content || 'Без текста'}</p>
                    
                    {post.mediaUrl && (
                      <div className="mt-2 w-full aspect-[1/1] bg-black/40 rounded-lg overflow-hidden border border-white/5 pointer-events-none">
                        {post.mediaType === 'video' ? (
                          <video src={getMediaUrl(post.mediaUrl)} className="w-full h-full object-cover" muted preload="metadata" playsInline />
                        ) : (
                          <img src={getMediaUrl(post.mediaUrl)} className="w-full h-full object-cover" alt="Media" />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5 pointer-events-none">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleOpenComments(post._id); }} 
                      className="text-xs text-white/50 flex items-center gap-1 pointer-events-auto hover:text-white transition"
                    >
                      💬 {post.comments?.length || 0} комментов
                    </button>

                    <div className="space-x-2 pointer-events-auto">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setEditingPost(post); setEditMediaFile(null); setEditMediaPreview(null); }} 
                        className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-lg text-xs hover:bg-blue-500/20"
                      >
                        ✎
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeletePost(post._id); }} 
                        className="px-3 py-1 bg-red-500/10 text-red-400 rounded-lg text-xs hover:bg-red-500/20"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ===== ПЛЕЕР ===== */}
      <AnimatePresence>
        {viewerPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed top-0 right-0 bottom-0 z-[9999] bg-[#0a0a0a] flex items-center justify-center overflow-hidden transition-all duration-300 ease-in-out ${isSidebarOpen ? 'left-[260px]' : 'left-0'}`}
          >
            <div className="flex flex-row items-center justify-center gap-4 md:gap-8 w-full max-w-[1000px] mx-auto px-4 h-full">
              <button 
                onClick={(e) => { e.stopPropagation(); closeViewer(); }}
                className="absolute top-4 right-4 z-20 text-white/80 hover:text-white p-2 bg-black/60 rounded-full backdrop-blur-sm transition"
              >
                ✕
              </button>

              <div className={`flex flex-row items-center justify-center gap-4 md:gap-8 transition-all duration-300 ease-in-out w-full ${isCommentsOpen ? 'translate-x-[-180px]' : 'translate-x-0'}`}>
                <div className="flex-1 flex items-center justify-center min-w-0 h-full">
                  <div className="relative w-full max-w-[450px] lg:max-w-[650px] aspect-[1/1] max-h-[85vh] rounded-[24px] overflow-hidden bg-black shadow-2xl cursor-pointer">
                    
                    <button onClick={toggleMute} className="absolute top-4 left-4 z-30 bg-black/60 backdrop-blur-sm hover:bg-black/80 p-2 rounded-full text-white transition">
                      {isMuted ? '🔇' : '🔊'}
                    </button>

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
                              <div className="flex flex-row items-center gap-1.5">
                                <span className="text-white font-bold text-base drop-shadow-lg flex items-center gap-1">
                                  @{viewerPost.user?.username}{viewerPost.user?.isVerified && <span className="text-blue-500 text-lg ml-1">✓</span>}
                                </span>
                                <span className="text-white/50 text-xs font-medium drop-shadow-md mt-0.5">
                                  · {viewerPost.createdAt ? new Date(viewerPost.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\./g, '-') : ''}
                                </span>
                              </div>
                            </Link>
                            <p className="text-white/90 text-sm drop-shadow-md leading-relaxed max-w-[80%]">{viewerPost.content}</p>
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

                {/* ПРАВЫЕ КНОПКИ */}
                <div className="flex flex-col items-center gap-4 py-4 shrink-0 min-w-[60px] md:min-w-[80px]">
                  <div className="relative">
                    <Link to={`/profile/${viewerPost.user?._id}`}>
                      <div className="w-12 h-12 rounded-full border-[2px] border-white/30 bg-gray-800 flex items-center justify-center overflow-hidden cursor-pointer hover:border-accent transition">
                        {viewerPost.user?.avatar && viewerPost.user.avatar !== '' ? <img src={viewerPost.user.avatar} alt="Avatar" className="w-full h-full object-cover" crossOrigin="anonymous" /> : <span className="text-white font-bold text-lg">{viewerPost.user?.username?.charAt(0).toUpperCase()}</span>}
                      </div>
                    </Link>
                  </div>

                  <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => handleLike(viewerPost._id)}>
                    <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-black/80 transition">
                      {viewerPost.isLikedByMe || (viewerPost.likes && viewerPost.likes.includes(currentUser?._id)) ? (
                        <FaHeart className="text-red-500 text-xl transition-colors" />
                      ) : (
                        <FaRegHeart className="text-white/80 text-xl hover:text-white transition-colors" />
                      )}
                    </div>
                    <span className="text-white/80 text-[11px] font-bold tracking-wide">{viewerPost.likes?.length || 0}</span>
                  </div>

                  <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={(e) => { e.stopPropagation(); setIsCommentsOpen(!isCommentsOpen); }}>
                    <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-black/80 transition">
                      <FaComment className="text-white/80 text-xl hover:text-white transition" />
                    </div>
                    <span className="text-white/80 text-[11px] font-bold tracking-wide">{viewerPost.comments?.length || 0}</span>
                  </div>

                  <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => handleSave(viewerPost._id)}>
                    <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-black/80 transition">
                      {viewerPost.savedBy && viewerPost.savedBy.includes(currentUser?._id) ? (
                        <FaBookmark className="text-yellow-400 text-xl transition-colors" />
                      ) : (
                        <FiBookmark className="text-white/80 text-xl hover:text-white transition-colors" />
                      )}
                    </div>
                    <span className="text-white/80 text-[11px] font-bold tracking-wide">{viewerPost.savedBy?.length || 0}</span>
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
                        const isLikedByMe = comment.likes?.includes(currentUser?._id);
                        
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
                              <input 
                                id={`reply-input-${comment._id}`}
                                type="text"
                                placeholder="Написать ответ..."
                                value={replyTexts[comment._id] || ''}
                                onChange={(e) => setReplyTexts(prev => ({ ...prev, [comment._id]: e.target.value }))}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleReply(viewerPost._id, comment._id); }}
                                className="flex-1 bg-transparent border-b border-white/10 text-white text-xs outline-none pb-1 placeholder:text-white/30 focus:border-accent/50 transition"
                              />
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
                        <input
                          type="text"
                          placeholder="Добавить комментарий..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(viewerPost._id); }}
                          className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/30"
                        />
                        <button onClick={() => handleAddComment(viewerPost._id)} className="text-accent font-medium text-sm hover:opacity-80 transition">
                          Опубликовать
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-dark border border-white/10 rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">Редактировать {editingUser.username}</h3>
              <div className="space-y-3">
                <input value={editingUser.username} onChange={e => setEditingUser({...editingUser, username: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none" placeholder="Имя пользователя" />
                <textarea value={editingUser.bio || ''} onChange={e => setEditingUser({...editingUser, bio: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none" placeholder="Био" rows="3" />
                <div className="flex items-center gap-3">
                  <label className="text-white/70 text-sm">Верифицирован:</label>
                  <input type="checkbox" checked={editingUser.isVerified} onChange={e => setEditingUser({...editingUser, isVerified: e.target.checked})} className="w-5 h-5 accent-blue-500" />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => setEditingUser(null)} className="flex-1 py-2 bg-white/10 rounded-xl">Отмена</button>
                <button onClick={handleUpdateUser} className="flex-1 py-2 bg-blue-500 rounded-xl">Сохранить</button>
              </div>
            </div>
          </motion.div>
        )}

        {editingPost && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-dark border border-white/10 rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">Редактировать пост</h3>
              <div className="space-y-3">
                <textarea value={editingPost.content} onChange={e => setEditingPost({...editingPost, content: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none min-h-[100px]" placeholder="Текст поста" />
                
                {editMediaPreview && (
                  <div className="relative border border-white/10 rounded-xl overflow-hidden">
                    <img src={editMediaPreview} alt="Preview" className="w-full max-h-40 object-contain" />
                    <button 
                      type="button" 
                      onClick={() => { setEditMediaFile(null); setEditMediaPreview(null); if (editMediaInputRef.current) editMediaInputRef.current.value = ''; }}
                      className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <button 
                  type="button" 
                  onClick={() => editMediaInputRef.current?.click()}
                  className="w-full py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition"
                >
                  {editMediaPreview ? 'Заменить медиа' : 'Добавить/Заменить медиа'}
                </button>
                <input 
                  type="file" 
                  ref={editMediaInputRef} 
                  accept="image/*,video/*" 
                  onChange={(e) => { 
                    const file = e.target.files[0]; 
                    if (file) { 
                      setEditMediaFile(file); 
                      setEditMediaPreview(URL.createObjectURL(file)); 
                    } 
                  }} 
                  className="hidden" 
                />
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => { setEditingPost(null); setEditMediaFile(null); setEditMediaPreview(null); }} className="flex-1 py-2 bg-white/10 rounded-xl">Отмена</button>
                <button onClick={handleUpdatePost} className="flex-1 py-2 bg-blue-500 rounded-xl">Сохранить</button>
              </div>
            </div>
          </motion.div>
        )}

        {commentsModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-dark border border-white/10 rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Комментарии к посту</h3>
                <button onClick={() => setCommentsModalOpen(false)} className="text-white/50 hover:text-white">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {selectedPostComments.length === 0 && <p className="text-white/40 text-center mt-10">Нет комментариев</p>}
                {selectedPostComments.map(c => (
                  <div key={c._id} className="flex justify-between items-start p-3 bg-white/5 rounded-xl border border-white/5">
                    <div>
                      <p className="text-white/60 text-xs">@{c.user?.username}</p>
                      <p className="text-white text-sm mt-1">{c.text}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingComment(c); setCommentsModalOpen(false); }} className="text-blue-400 hover:text-blue-300 text-sm">✎</button>
                      <button onClick={() => handleDeleteComment(c._id)} className="text-red-400 hover:text-red-300 text-sm">🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {editingComment && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-dark border border-white/10 rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">Редактировать комментарий</h3>
              <textarea value={editingComment.text} onChange={e => setEditingComment({...editingComment, text: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none" rows="3" />
              <div className="flex gap-2 mt-4">
                <button onClick={() => { setEditingComment(null); setCommentsModalOpen(true); }} className="flex-1 py-2 bg-white/10 rounded-xl">Отмена</button>
                <button onClick={() => { handleUpdateComment(); setCommentsModalOpen(true); }} className="flex-1 py-2 bg-blue-500 rounded-xl">Сохранить</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPanel;