import React from 'react';
import { Tag, message } from 'antd';
import { getLastDirectory } from '../utils/path';

interface MaterialFolderTagProps {
  filePath: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  onClose?: () => void;
}

const MaterialFolderTag: React.FC<MaterialFolderTagProps> = ({
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
      const result = await window.electronAPI.openFolder(filePath);
      if (!result.success) {
        message.error('打开文件夹失败：' + result.message);
      }
    } catch (error) {
      console.error('打开文件夹失败：', error);
    }
  };

  return (
    <Tag 
      style={{ 
        cursor: 'pointer',
        ...style 
      }}
      onClick={handleClick}
      closable={!!onClose}
      onClose={(e) => {
        e.stopPropagation();
        onClose?.();
      }}
    >
      {getLastDirectory(filePath)}
    </Tag>
  );
};

export default MaterialFolderTag; 