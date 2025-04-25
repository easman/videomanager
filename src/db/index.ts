import Dexie, { Table } from 'dexie';

export interface Sku {
  id: number;
  name: string;
  image: string;
  type: string;
  brand: string;
  buyDate: string;
  buyPlatform: string;
  buyPrice: number;
  sizeInfo: string;
  extraInfo: string;
}

export interface VideoMaterial {
  id: number;
  name: string;
  filePath: string; // 本地路径
  thumbnails: string[]; // 视频文件缩略图Base64或路径
  skuIds: number[]; // 关联服饰
  createdAt: string;
}

export interface FinalVideo {
  id: number;
  name: string;
  description: string;
  materialIds: number[]; // 关联素材
  videoPath: string; // 最终视频文件路径
  publishStatus: '未发布' | '已发布' | '定时发布';
  publishTime?: string;
  createdAt: string;
}

class VideoManagerDB extends Dexie {
  skus!: Table<Sku, number>;
  videoMaterials!: Table<VideoMaterial, number>;
  finalVideos!: Table<FinalVideo, number>;

  constructor() {
    super('VideoManagerDB');
    this.version(4).stores({
      skus: '++id, name, type, brand',
      videoMaterials: '++id, name, filePath',
      finalVideos: '++id, name, publishStatus, videoPath',
    });
  }
}

export const db = new VideoManagerDB(); 