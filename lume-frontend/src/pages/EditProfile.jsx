import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../api/axios';
import { motion } from 'framer-motion';

const EditProfile = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(
    user?.displayName || ''
  );

  const [username, setUsername] = useState(
    user?.username || ''
  );

  const [bio, setBio] = useState(
    user?.bio || ''
  );

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef(null);

  // ---------------------------------------------------------
  // Preview URL cleanup
  // ---------------------------------------------------------

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // ---------------------------------------------------------
  // File change
  // ---------------------------------------------------------

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    // Faqat rasmlar
    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите изображение.');
      e.target.value = '';
      return;
    }

    // 10 MB
    if (file.size > 10 * 1024 * 1024) {
      alert('Размер изображения не должен превышать 10 МБ.');
      e.target.value = '';
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  // ---------------------------------------------------------
  // Submit
  // ---------------------------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) {
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      formData.append(
        'displayName',
        displayName.trim()
      );

      formData.append(
        'username',
        username.trim()
      );

      formData.append(
        'bio',
        bio
      );

      if (selectedFile) {
        formData.append(
          'avatar',
          selectedFile,
          selectedFile.name
        );
      }

      // -----------------------------------------------------
      // DEBUG
      // -----------------------------------------------------

      console.log(
        '========== EDIT PROFILE =========='
      );

      console.log(
        'Selected file:',
        selectedFile
          ? {
              name: selectedFile.name,
              type: selectedFile.type,
              size: selectedFile.size,
            }
          : null
      );

      for (const [key, value] of formData.entries()) {
        console.log(
          'FormData:',
          key,
          value
        );
      }

      // -----------------------------------------------------
      // Request
      // -----------------------------------------------------

      const response = await axios.put(
        '/users/update',
        formData
      );

      console.log(
        'UPDATE PROFILE RESPONSE:',
        response.data
      );

      console.log(
        'SERVER AVATAR:',
        response.data?.avatar
      );

      // -----------------------------------------------------
      // Update AuthContext
      // -----------------------------------------------------

      setUser((prev) => {
        const updatedUser = {
          ...(prev || {}),
          _id:
            response.data._id ||
            prev?._id,

          username:
            response.data.username ??
            prev?.username,

          displayName:
            response.data.displayName ??
            prev?.displayName,

          avatar:
            response.data.avatar ??
            prev?.avatar ??
            '',

          bio:
            response.data.bio ??
            prev?.bio ??
            '',

          email:
            response.data.email ??
            prev?.email,

          followers:
            response.data.followers ??
            prev?.followers ??
            [],

          following:
            response.data.following ??
            prev?.following ??
            [],

          isAdmin:
            response.data.isAdmin ??
            prev?.isAdmin ??
            false,

          isVerified:
            response.data.isVerified ??
            prev?.isVerified ??
            false,
        };

        console.log(
          'UPDATED AUTH USER:',
          updatedUser
        );

        // localStorage'ni ham darhol yangilaymiz
        localStorage.setItem(
          'lumeUser',
          JSON.stringify(updatedUser)
        );

        return updatedUser;
      });

      alert('Профиль успешно обновлён!');

      // Profile sahifasiga qaytish
      const profileId =
        response.data._id ||
        user?._id;

      navigate(`/profile/${profileId}`);
    } catch (error) {
      console.error(
        'UPDATE PROFILE ERROR:',
        error
      );

      console.error(
        'SERVER RESPONSE:',
        error.response
      );

      alert(
        'Ошибка обновления: ' +
          (
            error.response?.data?.message ||
            error.message ||
            'Неизвестная ошибка'
          )
      );
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------
  // Remove selected preview
  // ---------------------------------------------------------

  const handleRemoveSelectedFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(null);
    setPreviewUrl(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ---------------------------------------------------------
  // Render
  // ---------------------------------------------------------

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark p-6">
      <motion.div
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        className="bg-white/5 border border-white/10 backdrop-blur-xl p-8 rounded-3xl w-full max-w-md"
      >
        <h2 className="text-2xl font-bold text-white mb-6">
          Редактировать профиль
        </h2>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {/* -------------------------------------------------
              Avatar
          -------------------------------------------------- */}

          <div className="flex flex-col items-center">
            <div
              className="relative w-24 h-24 rounded-full bg-gray-700 overflow-hidden mb-3 cursor-pointer border-2 border-white/10"
              onClick={() =>
                fileInputRef.current?.click()
              }
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : user?.avatar ? (
                <img
                  src={user.avatar}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl text-white font-bold bg-linear-to-r from-accent to-glow">
                  {user?.username
                    ?.charAt(0)
                    .toUpperCase()}
                </div>
              )}
            </div>

            {previewUrl && (
              <button
                type="button"
                onClick={handleRemoveSelectedFile}
                className="text-xs text-red-400 hover:text-red-300 mb-2 transition"
              >
                Удалить выбранное фото
              </button>
            )}

            <button
              type="button"
              onClick={() =>
                fileInputRef.current?.click()
              }
              className="text-sm text-white/50 hover:text-white transition"
            >
              Сменить аватарку
            </button>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* -------------------------------------------------
              Display name
          -------------------------------------------------- */}

          <input
            type="text"
            placeholder="Отображаемое имя"
            value={displayName}
            onChange={(e) =>
              setDisplayName(e.target.value)
            }
            className="w-full bg-black/40 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-accent/50 placeholder:text-white/30"
          />

          {/* -------------------------------------------------
              Username
          -------------------------------------------------- */}

          <input
            type="text"
            placeholder="Имя пользователя (username)"
            value={username}
            onChange={(e) =>
              setUsername(e.target.value)
            }
            className="w-full bg-black/40 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-accent/50 placeholder:text-white/30"
          />

          {/* -------------------------------------------------
              Bio
          -------------------------------------------------- */}

          <textarea
            placeholder="Расскажите о себе..."
            value={bio}
            onChange={(e) =>
              setBio(e.target.value)
            }
            className="w-full bg-black/40 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-accent/50 resize-none placeholder:text-white/30"
            rows="4"
          />

          {/* -------------------------------------------------
              Buttons
          -------------------------------------------------- */}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={loading}
              className="flex-1 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition disabled:opacity-50"
            >
              Отмена
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-accent text-white font-semibold rounded-xl hover:bg-accent/80 transition disabled:opacity-50"
            >
              {loading
                ? 'Сохраняю...'
                : 'Сохранить'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default EditProfile;