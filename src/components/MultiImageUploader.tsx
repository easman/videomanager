import React, { useRef, useEffect, useState } from 'react';
import { Upload, Button, Progress, Spin, message, Image } from 'antd';
import { UploadOutlined, InboxOutlined, LoadingOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import update from 'immutability-helper';

const { Dragger } = Upload;

interface MultiImageUploaderProps {
  initImageUrls: string[];
  onImagesChange: (images: string[]) => void;
}

interface DragItem {
  type: string;
  index: number;
}

const DraggableImage: React.FC<{
  url: string;
  index: number;
  moveImage: (dragIndex: number, hoverIndex: number) => void;
  onRemove: () => void;
}> = ({ url, index, moveImage, onRemove }) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: 'image',
    item: { type: 'image', index, url },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop<DragItem, void, { isOver: boolean }>({
    accept: 'image',
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
    hover(item: DragItem, monitor) {
      if (!ref.current) return;
      
      const dragIndex = item.index;
      const hoverIndex = index;
      
      if (dragIndex === hoverIndex) return;

      // 获取拖拽元素和目标元素的位置信息
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      
      // 获取中点位置
      const hoverMiddleX = (hoverBoundingRect.right - hoverBoundingRect.left) / 2;
      
      // 获取鼠标位置
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      
      // 获取鼠标相对目标元素的水平位置
      const hoverClientX = clientOffset.x - hoverBoundingRect.left;

      // 只有当鼠标越过中点时才进行移动
      // 从左向右拖动时，鼠标必须越过目标元素的中点
      // 从右向左拖动时，鼠标必须越过目标元素的中点
      if (dragIndex < hoverIndex && hoverClientX < hoverMiddleX) return;
      if (dragIndex > hoverIndex && hoverClientX > hoverMiddleX) return;

      moveImage(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      style={{
        opacity: isDragging ? 0.2 : 1,
        cursor: 'move',
        position: 'relative',
        marginBottom: 8,
        borderRadius: 4,
        overflow: 'hidden',
        boxShadow: isDragging ? 'none' : '0 2px 8px rgba(0,0,0,0.1)',
        width: '160px',
        height: '120px',
        transition: 'opacity 0.2s ease',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
        }}
      >
        <Image
          src={url.startsWith('data:') ? url : `file://${encodeURI(url)}`}
          alt="预览"
          style={{
            width: '160px',
            height: '120px',
            objectFit: 'cover',
            filter: isDragging ? 'blur(1px)' : 'none',
            transition: 'all 0.2s ease',
          }}
          preview={{
            mask: null
          }}
        />
      </div>
      {!isDragging && (
        <Button
          type="primary"
          danger
          size="small"
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            opacity: 0.8,
            zIndex: 1,
          }}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          删除
        </Button>
      )}
    </div>
  );
};

const MultiImageUploader: React.FC<MultiImageUploaderProps> = ({
  initImageUrls,
  onImagesChange,
}) => {
  const pasteAreaRef = useRef<HTMLDivElement>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const [imageStatus, setImageStatus] = useState({
    processing: false,
    progress: 0,
    statusText: ''
  });

  // 初始化和更新内部状态
  useEffect(() => {
    setImageUrls(initImageUrls);
  }, [initImageUrls]);


  const handleImagesChange = async (files: File[] | Blob[]) => {
    setImageStatus({
      processing: true,
      progress: 0,
      statusText: '正在处理图片...'
    });

    try {
      const newImageUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const progress = Math.round((i + 1) / files.length * 100);
        setImageStatus(prev => ({
          ...prev,
          progress,
          statusText: `正在处理第 ${i + 1}/${files.length} 张图片...`
        }));

        if (file instanceof File) {
          const reader = new FileReader();
          await new Promise((resolve, reject) => {
            reader.onload = (e) => {
              if (e.target?.result) {
                newImageUrls.push(e.target.result as string);
                resolve(null);
              }
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        }
      }

      setImageUrls(prev => [...prev, ...newImageUrls]);
      setImageStatus({
        processing: false,
        progress: 100,
        statusText: '处理完成'
      });
    } catch (error) {
      console.error('处理图片失败：', error);
      message.error('处理图片失败');
      setImageStatus({
        processing: false,
        progress: 0,
        statusText: '处理失败'
      });
    }
  };

  useEffect(() => {
    const currentRef = pasteAreaRef.current;
    if (currentRef) {
      const handlePaste = (e: ClipboardEvent) => {
        if (!e.clipboardData) return;
        
        const items = e.clipboardData.items;
        if (!items) return;
        
        const files: File[] = [];
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            if (file) {
              files.push(file);
            }
          }
        }
        if (files.length > 0) {
          handleImagesChange(files);
        }
      };

      currentRef.addEventListener('paste', handlePaste);
      return () => {
        currentRef.removeEventListener('paste', handlePaste);
      };
    }
  }, [handleImagesChange]);


  const moveImage = (dragIndex: number, hoverIndex: number) => {
    const images = update(imageUrls, {
      $splice: [
        [dragIndex, 1],
        [hoverIndex, 0, imageUrls[dragIndex]],
      ],
    });
    setImageUrls(images);
    onImagesChange(images);
  };

  const handleRemoveImage = (index: number) => {
    const newUrls = imageUrls.filter((_, i) => i !== index);
    setImageUrls(newUrls);
    onImagesChange(newUrls);
  };

  const draggerProps: UploadProps = {
    name: 'file',
    multiple: true,
    showUploadList: false,
    accept: 'image/*',
    beforeUpload: (file) => {
      handleImagesChange([file]);
      return false;
    },
    openFileDialogOnClick: false,
  };

  return (
    <DndProvider backend={HTML5Backend}>
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
        {!imageUrls.length && !imageStatus.processing && (
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
        <Dragger {...draggerProps} style={{ padding: imageUrls.length ? '0' : '20px 0', background: 'transparent', border: 'none' }}>
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
          ) : imageUrls.length > 0 ? (
            <div style={{ padding: '20px' }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                gap: '16px' 
              }}>
                {imageUrls.map((url, index) => (
                  <DraggableImage
                    key={url}
                    url={url}
                    index={index}
                    moveImage={moveImage}
                    onRemove={() => handleRemoveImage(index)}
                  />
                ))}
              </div>
              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <Button 
                  type="primary" 
                  onClick={(e) => {
                    e.stopPropagation();
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.multiple = true;
                    input.onchange = (event) => {
                      const files = Array.from((event.target as HTMLInputElement).files || []);
                      if (files.length > 0) {
                        handleImagesChange(files);
                      }
                    };
                    input.click();
                  }}
                  icon={<UploadOutlined />}
                >
                  添加更多图片
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
                支持多图上传。也可以直接复制图片后，点击区域并按command+v粘贴。
              </p>
              <Button 
                type="primary" 
                icon={<UploadOutlined />} 
                onClick={(e) => {
                  e.stopPropagation();
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.multiple = true;
                  input.onchange = (event) => {
                    const files = Array.from((event.target as HTMLInputElement).files || []);
                    if (files.length > 0) {
                      handleImagesChange(files);
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
    </DndProvider>
  );
};

export default MultiImageUploader; 