export function getLastDirectory(filePath: string): string {
  // 移除末尾的斜杠（如果有）
  const normalizedPath = filePath.replace(/[\/\\]$/, '');
  
  // 分割路径并获取最后一个目录名
  const parts = normalizedPath.split(/[\/\\]/);
  return parts[parts.length - 1] || '';
}

export function getFileName(filePath: string): string {
  // 移除末尾的斜杠（如果有）
  const normalizedPath = filePath.replace(/[\/\\]$/, '');
  
  // 分割路径并获取最后一个部分（文件名）
  const parts = normalizedPath.split(/[\/\\]/);
  return parts[parts.length - 1] || '';
} 