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
  modifiedTimes: string[]; // 修改时间列表，第一个是创建时间
}

export interface VideoMaterial {
  id?: number;  // id 在创建时是可选的，Dexie 会自动生成
  name: string;
  filePath: string; // 本地路径
  thumbnails: string[]; // 视频文件缩略图Base64或路径
  skuIds: number[]; // 关联服饰
  modifiedTimes: string[]; // 修改时间列表，第一个是创建时间
}

export interface FinalVideo {
  id?: number;  // id 在创建时是可选的，Dexie 会自动生成
  name: string;
  description: string;
  materialIds: number[]; // 关联素材
  videoPath: string; // 最终视频文件路径
  publishStatus: '未发布' | '已发布' | '定时发布';
  publishTime?: string;
  extraInfo: string; // 额外信息
  modifiedTimes: string[]; // 修改时间列表，第一个是创建时间
}

class VideoManagerDB extends Dexie {
  skus!: Table<Sku, number>;
  videoMaterials!: Table<VideoMaterial, number>;
  finalVideos!: Table<FinalVideo, number>;

  constructor() {
    super('VideoManagerDB');
    this.version(5).stores({
      skus: '++id, name, type, brand',
      videoMaterials: '++id, name, filePath',
      finalVideos: '++id, name, publishStatus, videoPath',
    });
  }
}

export const db = new VideoManagerDB(); 