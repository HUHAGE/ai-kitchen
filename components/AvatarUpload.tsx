import React, { useState, useRef } from 'react';
import { Upload, X, Loader } from 'lucide-react';

interface AvatarUploadProps {
  currentAvatar?: string;
  onUploadSuccess: (url: string) => void;
  onUploadError: (error: string) => void;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatar,
  onUploadSuccess,
  onUploadError,
}) => {
  const [preview, setPreview] = useState<string>(currentAvatar || '');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 压缩图片
  const compressImage = (file: File, maxWidth: number = 400, quality: number = 0.8): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // 计算缩放比例
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxWidth) {
              width = (width * maxWidth) / height;
              height = maxWidth;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('无法获取 canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('图片压缩失败'));
              }
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = () => reject(new Error('图片加载失败'));
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      onUploadError('请选择图片文件');
      return;
    }

    // 验证文件大小（5MB）
    if (file.size > 5 * 1024 * 1024) {
      onUploadError('图片大小不能超过 5MB');
      return;
    }

    try {
      setUploading(true);

      // 压缩图片
      const compressedBlob = await compressImage(file);
      
      // 生成预览
      const previewUrl = URL.createObjectURL(compressedBlob);
      setPreview(previewUrl);

      // 创建 File 对象
      const compressedFile = new File([compressedBlob], file.name, {
        type: 'image/jpeg',
      });

      // 返回压缩后的文件供父组件上传
      onUploadSuccess(previewUrl);
      
      // 保存文件到组件状态，供父组件获取
      (window as any).__avatarFile = compressedFile;

    } catch (error: any) {
      console.error('图片处理失败:', error);
      onUploadError(error.message || '图片处理失败');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    (window as any).__avatarFile = null;
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 头像预览 */}
      <div className="relative">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white overflow-hidden">
          {preview ? (
            <img src={preview} alt="头像预览" className="w-full h-full object-cover" />
          ) : (
            <Upload size={48} />
          )}
        </div>
        
        {preview && !uploading && (
          <button
            onClick={handleRemove}
            className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
            title="移除头像"
          >
            <X size={16} />
          </button>
        )}

        {uploading && (
          <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center">
            <Loader className="animate-spin text-white" size={32} />
          </div>
        )}
      </div>

      {/* 上传按钮 */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          id="avatar-upload"
        />
        <label
          htmlFor="avatar-upload"
          className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
        >
          <Upload size={18} />
          <span>{preview ? '更换头像' : '上传头像'}</span>
        </label>
      </div>

      <p className="text-xs text-stone-500 text-center">
        支持 JPG、PNG、GIF 格式<br />
        图片将自动压缩至 400x400 以内
      </p>
    </div>
  );
};

export default AvatarUpload;
