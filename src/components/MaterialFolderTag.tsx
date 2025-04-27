import React from 'react';
import { Tag, message, Tooltip } from 'antd';
import { getLastDirectory } from '../utils/path';
import { FolderOutlined } from '@ant-design/icons';

interface MaterialFolderTagProps {
  filePath: string;
  name: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  onClose?: () => void;
}

const MaterialFolderTag: React.FC<MaterialFolderTagProps> = ({
  filePath,
  name,
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
    <Tooltip title={filePath}>
      <Tag 
        icon={<FolderOutlined />}
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
        <span style={{ fontWeight: 500 }}>{name}</span>
        <span style={{ 
          marginLeft: 4,
          color: '#8c8c8c',
          fontSize: '12px'
        }}>
          ({getLastDirectory(filePath)})
        </span>
      </Tag>
    </Tooltip>
  );
};

export default MaterialFolderTag; 