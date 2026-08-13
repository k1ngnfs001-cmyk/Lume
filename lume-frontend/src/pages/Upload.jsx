import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const Upload = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Валидация: размер файла (макс 50 МБ)
      if (file.size > 50 * 1024 * 1024) {
        alert('Файл слишком большой! Пожалуйста, загрузите файл размером менее 50 МБ.');
        e.target.value = ''; // Сброс инпута
        return;
      }
      // Валидация: формат (только картинки и видео)
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        alert('Пожалуйста, загрузите только фото или видео!');
        e.target.value = '';
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      alert('Пожалуйста, введите описание поста!');
      return;
    }
    if (!selectedFile) {
      alert('Пожалуйста, выберите фото или видео!');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('content', content);
    formData.append('media', selectedFile);

    try {
      const token = localStorage.getItem('lumeToken');
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      alert('Пост успешно опубликован!');
      navigate('/');
    } catch (error) {
      alert('Ошибка: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 border border-white/10 backdrop-blur-xl p-8 rounded-3xl w-full max-w-md shadow-2xl"
      >
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Загрузить пост</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Описание поста (обязательно)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-black/40 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-accent/50 placeholder:text-white/30"
          />

          {/* ================= ИСПРАВЛЕННЫЙ БЛОК ПРЕВЬЮ ================= */}
          {previewUrl && (
            <div className="relative border border-white/10 rounded-xl overflow-hidden bg-black/40">
              {selectedFile && selectedFile.type.startsWith('video/') ? (
                <video 
                  src={previewUrl} 
                  className="w-full max-h-60 object-contain" 
                  controls 
                  loop 
                  muted 
                  playsInline 
                />
              ) : (
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="w-full max-h-60 object-contain" 
                />
              )}
              <button 
                type="button" 
                onClick={() => { setSelectedFile(null); setPreviewUrl(null); fileInputRef.current.value = ''; }}
                className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
              >
                ✕
              </button>
            </div>
          )}
          {/* ========================================================== */}

          <button 
            type="button" 
            onClick={() => fileInputRef.current.click()}
            className="w-full py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition"
          >
            📷 Выбрать медиа
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
            disabled={loading || !content.trim() || !selectedFile}
            className="w-full py-3 bg-accent text-white font-semibold rounded-xl hover:bg-accent/80 transition disabled:opacity-50"
          >
            {loading ? 'Публикация...' : 'Опубликовать'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Upload;