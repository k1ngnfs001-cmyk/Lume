import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../api/axios';
import { motion } from 'framer-motion';

const EditProfile = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append('displayName', displayName);
    formData.append('username', username);
    formData.append('bio', bio);
    if (selectedFile) {
      formData.append('avatar', selectedFile);
    }

    try {
      const response = await axios.put('/users/update', formData);
      setUser(prev => ({ 
        ...prev, 
        displayName: response.data.displayName, 
        username: response.data.username,
        avatar: response.data.avatar, 
        bio: response.data.bio 
      }));
      alert('Профиль обновлён!');
      navigate('/profile/' + user._id);
    } catch (error) {
      alert('Ошибка обновления: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 border border-white/10 backdrop-blur-xl p-8 rounded-3xl w-full max-w-md"
      >
        <h2 className="text-2xl font-bold text-white mb-6">Редактировать профиль</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-gray-700 overflow-hidden mb-2 cursor-pointer" onClick={() => fileInputRef.current.click()}>
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl text-white font-bold bg-linear-to-r from-accent to-glow">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <button type="button" onClick={() => fileInputRef.current.click()} className="text-sm text-white/50 hover:text-white transition">
              Сменить аватарку
            </button>
            <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileChange} className="hidden" />
          </div>

          {/* НОВЫЕ ПОЛЯ */}
          <input 
            type="text" 
            placeholder="Отображаемое имя"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full bg-black/40 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-accent/50 placeholder:text-white/30"
          />

          <input 
            type="text" 
            placeholder="Имя пользователя (username)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-black/40 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-accent/50 placeholder:text-white/30"
          />

          <textarea 
            placeholder="Расскажите о себе..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full bg-black/40 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-accent/50 resize-none placeholder:text-white/30"
            rows="4"
          />

          <div className="flex gap-2">
            <button type="button" onClick={() => navigate(-1)} className="flex-1 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition">Отмена</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 bg-accent text-white font-semibold rounded-xl hover:bg-accent/80 transition disabled:opacity-50">
              {loading ? 'Сохраняю...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default EditProfile;