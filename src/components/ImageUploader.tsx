import React, { useRef, useEffect } from 'react';
import { Upload, Button, Progress, Spin, message, Image } from 'antd';
import { UploadOutlined, InboxOutlined, LoadingOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';

const { Dragger } = Upload;

interface ImageUploaderProps {
  imageUrl: string;
  imageStatus: {
    processing: boolean;
    progress: number;
    statusText: string;
  };
  onImageChange: (file: File | Blob) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  imageUrl,
  imageStatus,
  onImageChange
}) => {
  const pasteAreaRef = useRef<HTMLDivElement>(null);

  // 判断是否为文件路径
  const isFilePath = (url: string) => {
    return !url.startsWith('data:');
  };

  // 获取图片显示地址
  const getDisplayUrl = (url: string) => {
    if (!url) return '';
    return isFilePath(url) ? `file://${encodeURI(url)}` : url;
  };

  useEffect(() => {
    const currentRef = pasteAreaRef.current;
    if (currentRef) {
      const handlePaste = (e: ClipboardEvent) => {
        if (!e.clipboardData) return;
        
        const items = e.clipboardData.items;
        if (!items) return;
        
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();
            if (blob) {
              onImageChange(blob);
              break;
            }
          }
        }
      };

      currentRef.addEventListener('paste', handlePaste);
      return () => {
        currentRef.removeEventListener('paste', handlePaste);
      };
    }
  }, [onImageChange]);

  const draggerProps: UploadProps = {
    name: 'file',
    multiple: false,
    showUploadList: false,
    accept: 'image/*',
    beforeUpload: (file) => {
      onImageChange(file);
      return false;
    },
    openFileDialogOnClick: false
  };

  return (
    <div 
      ref={pasteAreaRef} 
      style={{ 
        outline: 'none',
        position: 'relative',
        border: '1px dashed #d9d9d9',
        borderRadius: '8px',
        padding: '4px',
        backgroundColor: '#fafafa',
        transition: 'all 0.3s'
      }} 
      tabIndex={0}
      onClick={() => {
        pasteAreaRef.current?.focus();
      }}
    >
      {!imageUrl && !imageStatus.processing && (
        <div 
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: 'rgba(0, 0, 0, 0.03)',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#666',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            zIndex: 5
          }}
        >
          <kbd style={{background: '#fff', border: '1px solid #d9d9d9', borderRadius: '3px', padding: '1px 4px', boxShadow: '0 1px 1px rgba(0,0,0,0.1)'}}>command</kbd>+<kbd style={{background: '#fff', border: '1px solid #d9d9d9', borderRadius: '3px', padding: '1px 4px', boxShadow: '0 1px 1px rgba(0,0,0,0.1)'}}>v</kbd> 粘贴图片
        </div>
      )}
      <Dragger {...draggerProps} style={{ padding: imageUrl ? '0' : '20px 0', background: 'transparent', border: 'none' }}>
        {imageStatus.processing ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <Spin indicator={<LoadingOutlined style={{ fontSize: 24, color: '#1890ff' }} spin />} />
            <p style={{ marginTop: 15, color: '#666' }}>{imageStatus.statusText}</p>
            <Progress 
              percent={imageStatus.progress} 
              status="active" 
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
              style={{ margin: '10px 20px' }}
            />
          </div>
        ) : imageUrl ? (
          <div style={{ padding: '20px', textAlign: 'center', borderRadius: '6px', overflow: 'hidden', background: '#fff' }}>
            <div style={{ position: 'relative', marginBottom: 16, borderRadius: '4px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'inline-block', maxWidth: '90%' }}>
              <Image 
                src={getDisplayUrl(imageUrl)}
                alt="预览" 
                style={{ maxWidth: '100%', maxHeight: '180px', display: 'block', objectFit: 'contain' }}
                preview={{
                  mask: <div style={{ color: '#fff' }}></div>,
                }}
                onError={(e) => {
                  console.error('图片加载失败', e);
                }}
              />
            </div>
            <div>
              <Button 
                type="primary" 
                onClick={(e) => {
                  e.stopPropagation();
                  onImageChange(new Blob([]));
                }}
                danger
                icon={<UploadOutlined />}
                style={{ borderRadius: '4px', boxShadow: '0 2px 4px rgba(255,77,79,0.2)' }}
              >
                移除图片
              </Button>
            </div>
          </div>
        ) : (
          <div style={{ padding: '10px 0' }}>
            <p className="ant-upload-drag-icon" style={{ color: '#1890ff', marginBottom: 16 }}>
              <InboxOutlined style={{ fontSize: 48 }} />
            </p>
            <p className="ant-upload-text" style={{ fontSize: 16, color: 'rgba(0, 0, 0, 0.85)', fontWeight: 500 }}>
              点击下方按钮选择图片或拖拽图片到此区域上传
            </p>
            <p className="ant-upload-hint" style={{ fontSize: 14, color: 'rgba(0, 0, 0, 0.45)', margin: '8px 0 16px' }}>
              支持单个图片上传。也可以直接复制图片后，点击区域并按command+v粘贴。
            </p>
            <Button 
              type="primary" 
              icon={<UploadOutlined />} 
              onClick={(e) => {
                e.stopPropagation();
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (event) => {
                  const file = (event.target as HTMLInputElement).files?.[0];
                  if (file) {
                    onImageChange(file);
                  }
                };
                input.click();
              }}
              style={{ 
                marginTop: 10,
                height: '38px',
                padding: '0 20px',
                fontSize: '14px',
                borderRadius: '4px',
                boxShadow: '0 2px 4px rgba(24,144,255,0.2)'
              }}
            >
              选择图片
            </Button>
          </div>
        )}
      </Dragger>
    </div>
  );
};

export default ImageUploader; 