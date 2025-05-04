import Dexie, { Table, Transaction } from 'dexie';

export interface Sku {
  id?: number;
  name: string;
  fullName: string;
  image: string;
  type: string;
  brand: string;
  color: string;
  buyDate: string;
  buyPlatform: string;
  buyPrice: number;
  sizeInfo: string;
  extraInfo: string;
  returned: boolean; // 是否退货
  modifiedTimes: string[]; // 修改时间列表，第一个是创建时间
}

export interface VideoMaterial {
  id?: number;  // id 在创建时是可选的，Dexie 会自动生成
  name: string;
  filePath: string; // 本地路径
  skuIds: number[]; // 关联服饰
  modifiedTimes: string[]; // 修改时间列表，第一个是创建时间
  extraInfo: string; // 额外信息
}

export interface Project {
  id?: number;  // id 在创建时是可选的，Dexie 会自动生成
  name: string;
  description: string;
  tags: string; // 标签
  materialIds: number[]; // 关联素材
  videoPath: string; // 最终视频文件路径
  publishStatus: '未编辑' | '编辑中' | '待发布' | '已发布';
  publishTime?: string;
  extraInfo: string; // 额外信息
  modifiedTimes: string[]; // 修改时间列表，第一个是创建时间
}

export interface BodyRecord {
  id?: number;
  recordDate: string; // 记录日期
  height: number; // 身高(cm)
  weight: number; // 体重(斤)
  shoulderWidth: number; // 肩宽(cm)
  chestCircumference: number; // 胸围(cm)
  waistCircumference: number; // 腰围(cm)
  hipCircumference: number; // 臀围(cm)
  thighCircumference: number; // 大腿围(cm)
  armCircumference: number; // 大臂围(cm)
  measurementTime: string; // 测量时间描述
  extraInfo: string; // 额外信息
  modifiedTimes: string[]; // 修改时间列表，第一个是创建时间
}

class VideoManagerDB extends Dexie {
  skus!: Table<Sku, number>;
  videoMaterials!: Table<VideoMaterial, number>;
  projects!: Table<Project, number>;
  bodyRecords!: Table<BodyRecord, number>;

  constructor() {
    super('VideoManagerDB');
    
    // 更新到版本7，添加 returned 字段
    this.version(6).stores({
      skus: '++id, name, type, brand, color',
      videoMaterials: '++id, name, filePath',
      finalVideos: '++id, name, publishStatus, videoPath',
    });

    this.version(7).stores({
      skus: '++id, name, type, brand, color, returned',  // 添加 returned 索引
      videoMaterials: '++id, name, filePath',
      finalVideos: '++id, name, publishStatus, videoPath',
    }).upgrade(async (trans: Transaction) => {
      // 获取 skus 表
      const skuTable = trans.table('skus');
      
      // 获取所有记录
      const allSkus = await skuTable.toArray();
      
      // 更新每条记录
      for (const sku of allSkus) {
        await skuTable.update(sku.id as number, {
          returned: sku.returned === undefined ? false : sku.returned
        });
      }
    });

    // 添加版本8，确保所有记录都有 returned 字段
    this.version(8).stores({
      skus: '++id, name, type, brand, color, returned',
      videoMaterials: '++id, name, filePath',
      finalVideos: '++id, name, publishStatus, videoPath',
    }).upgrade(async (trans: Transaction) => {
      const skuTable = trans.table('skus');
      
      // 强制更新所有记录的 returned 字段
      await skuTable.toCollection().modify(sku => {
        if (sku.returned === undefined || sku.returned === null) {
          sku.returned = false;
        } else {
          // 确保类型为 boolean
          sku.returned = Boolean(sku.returned);
        }
      });
    });

    // 添加版本9，将图片路径转换为文件名
    this.version(9).stores({
      skus: '++id, name, type, brand, color, returned',
      videoMaterials: '++id, name, filePath',
      finalVideos: '++id, name, publishStatus, videoPath',
    }).upgrade(async (trans: Transaction) => {
      const skuTable = trans.table('skus');
      
      // 获取所有记录
      const allSkus = await skuTable.toArray();
      
      // 更新每条记录的图片路径
      for (const sku of allSkus) {
        if (sku.image) {
          // 从完整路径中提取文件名
          const fileName = sku.image.split('/').pop() || sku.image.split('\\').pop() || sku.image;
          await skuTable.update(sku.id as number, {
            image: fileName
          });
        }
      }
    });

    // 添加版本10，增加 videoMaterials 的 extraInfo 字段
    this.version(10).stores({
      skus: '++id, name, type, brand, color, returned',
      videoMaterials: '++id, name, filePath',
      finalVideos: '++id, name, publishStatus, videoPath',
    }).upgrade(async (trans: Transaction) => {
      const materialTable = trans.table('videoMaterials');
      
      // 为所有记录添加 extraInfo 字段
      await materialTable.toCollection().modify(material => {
        if (!material.extraInfo) {
          material.extraInfo = '';
        }
      });
    });

    // 添加版本11，将 finalVideos 表重命名为 projects
    this.version(11).stores({
      skus: '++id, name, type, brand, color, returned',
      videoMaterials: '++id, name, filePath',
      projects: '++id, name, publishStatus, videoPath',
    }).upgrade(async (trans: Transaction) => {
      // 获取旧表数据
      const finalVideosTable = trans.table('finalVideos');
      const projectsTable = trans.table('projects');
      
      // 获取所有记录
      const allFinalVideos = await finalVideosTable.toArray();
      
      // 将数据迁移到新表，确保所有必要字段都存在
      for (const video of allFinalVideos) {
        await projectsTable.add({
          ...video,
          description: video.description || '',
          materialIds: video.materialIds || [],
          publishStatus: video.publishStatus || '待编辑',
          publishTime: video.publishTime,
          extraInfo: video.extraInfo || '',
          modifiedTimes: video.modifiedTimes || [new Date().toISOString()]
        });
      }
      
      // 删除旧表
      await finalVideosTable.clear();
    });

    // 添加版本12，增加身材记录表
    this.version(12).stores({
      skus: '++id, name, type, brand, color, returned',
      videoMaterials: '++id, name, filePath',
      projects: '++id, name, publishStatus, videoPath',
      bodyRecords: '++id, recordDate'
    });
  }
}

export const db = new VideoManagerDB(); 