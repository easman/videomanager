import React from 'react';
import { Tag, message, Tooltip } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import { getLastDirectory } from '../utils/path';

interface VideoFileTagProps {
  filePath: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  onClose?: () => void;
}

const VideoFileTag: React.FC<VideoFileTagProps> = ({
  filePath,
  style,
  onClick,
  onClose
}) => {
  const handleClick = async () => {
    if (onClick) {
      onClick();
      return;
    }

    try {
      const result = await window.electronAPI.showFileInFolder(filePath);
      if (!result.success) {
        message.error('打开视频所在文件夹失败：' + result.message);
      }
    } catch (error) {
      console.error('打开视频所在文件夹失败：', error);
    }
  };

  const fileName = getLastDirectory(filePath);

  return (
    <Tooltip title={filePath}>
      <Tag 
        icon={<PlayCircleOutlined />}
        style={{ 
          cursor: 'pointer',
          maxWidth: '100%',
          whiteSpace: 'normal',
          wordBreak: 'break-all',
          height: 'auto',
          paddingTop: 4,
          paddingBottom: 4,
          ...style 
        }}
        onClick={handleClick}
        closable={!!onClose}
        onClose={(e) => {
          e.stopPropagation();
          onClose?.();
        }}
      >
        {fileName}
      </Tag>
    </Tooltip>
  );
};

export default VideoFileTag; 