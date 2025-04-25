import Dexie, { Table } from 'dexie';

export interface Sku {
  id?: number;
  name: string;
  type: string;
  brand: string;
  image: string; // 图片本地路径或Base64
  buyDate: string;
  buyInfo: string;
}

export interface VideoMaterial {
  id?: number;
  name: string;
  filePath: string; // 本地路径
  thumbnail: string; // 缩略图Base64或路径
  createdAt: string;
}

export interface FinalVideo {
  id?: number;
  name: string;
  description: string;
  clothesIds: number[]; // 关联服饰
  materialIds: number[]; // 关联素材
  publishStatus: '未发布' | '已发布' | '定时发布';
  publishInfo?: string;
  publishTime?: string;
  publishLink?: string;
  createdAt: string;
}

class VideoManagerDB extends Dexie {
  clothes!: Table<Sku, number>;
  videoMaterials!: Table<VideoMaterial, number>;
  finalVideos!: Table<FinalVideo, number>;

  constructor() {
    super('VideoManagerDB');
    this.version(1).stores({
      clothes: '++id, name, type, brand',
      videoMaterials: '++id, name, filePath',
      finalVideos: '++id, name, publishStatus',
    });
  }
}

export const db = new VideoManagerDB(); 