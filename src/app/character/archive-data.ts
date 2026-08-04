/**
 * 角色故事档案数据 — 暗色文学叙事版
 *
 * 修改方式：直接编辑此文件中的 STORY_CHAPTERS 和 PROFILE_ROWS
 * 每段故事对应一个分页章节，支持多段正文
 */

export interface StoryChapter {
  id: string;
  chapterNo: string;
  pageNo: string;
  title: string;
  body: string[];
  source: string;
}

export const STORY_CHAPTERS: StoryChapter[] = [
  {
    id: 'intro',
    chapterNo: '第 I 章',
    pageNo: '记忆页 01',
    title: '角色介绍',
    body: [
      '⏳ 此处填写达妮娅的整体介绍，包括背景定位、性格印象、在剧情中的角色等。',
      '建议 3-5 段文字，每段 ≤ 150 字，使用文学化的叙事语调。',
    ],
    source: '⏳ 资料来源：待补充鸣潮官方角色介绍页链接',
  },
  {
    id: 'profile',
    chapterNo: '第 II 章',
    pageNo: '记忆页 02',
    title: '共鸣者档案',
    body: [
      '⏳ 此处填写共鸣者档案，包括共鸣属性、武器类型、战斗定位等。',
      '建议分小节描述：技能介绍（被动/普攻/共鸣技能/解放）、配队建议、养成要点。',
    ],
    source: '⏳ 资料来源：待补充鸣潮官方角色档案页 / 官方 Wiki 链接',
  },
  {
    id: 'voices',
    chapterNo: '第 III 章',
    pageNo: '记忆页 03',
    title: '语音摘录',
    body: [
      '⏳ 此处填写语音摘录，按分类整理：',
      '· 闲置语音（登录/待机/触摸）',
      '· 战斗语音（入场/击杀/死亡/技能）',
      '· 好感/互动语音',
      '· 节日/活动限定语音',
    ],
    source: '⏳ 资料来源：待补充鸣潮游戏内录屏 / B 站 BV 号语音合集',
  },
];

export interface ProfileRow {
  label: string;
  value: string;
}

export const PROFILE_ROWS: ProfileRow[] = [
  { label: '称号', value: '⏳ 待补充官方称号' },
  { label: '武器', value: '⏳ 待补充（武器类型）' },
  { label: '属性', value: '⏳ 待补充（共鸣属性）' },
  { label: '稀有度', value: '⏳ 待补充（★5 / ★4）' },
  { label: '性别', value: '女' },
  { label: '所属', value: '⏳ 待补充（组织/阵营）' },
  { label: '实装版本', value: '⏳ 待补充（版本号 + 日期）' },
  { label: '声优', value: '⏳ 待补充（中配 / 日配）' },
  { label: '生日', value: '⏳ 待补充（MM-DD）' },
  { label: '身高', value: '⏳ 待补充（cm）' },
];

export const ARCHIVE_SOURCE_LINKS = [
  { label: '鸣潮官方角色介绍页', url: '⏳ 待补充链接' },
  { label: '鸣潮官方 Wiki / Fandom', url: '⏳ 待补充链接' },
  { label: '官方角色 PV（B站 BV 号）', url: '⏳ 待补充 BV 号链接' },
  { label: '共鸣者档案 / 设定集', url: '⏳ 待补充链接' },
];

export interface ReportField {
  label: string;
  value: string;
}

export interface ReportSubSection {
  title: string;
  fields?: ReportField[];
  body: string[];
  quotes?: string[];
}

export interface ResonanceReport {
  ability: string;
  subSections: ReportSubSection[];
}

export const RESONANCE_REPORT: ResonanceReport = {
  ability: '泡影视阈',
  subSections: [
    {
      title: '频谱检验报告',
      fields: [
        { label: '调自深空联合', value: '星炬学院学生档案' },
        { label: '共鸣能力检验报告', value: 'RA2499-G' },
        { label: '学生姓名', value: '达妮娅' },
        { label: '是否具有适格者资质', value: '否' },
      ],
      body: [
        '共鸣能力概述：受试样本拉贝尔曲线波动规律、具有显著周期性特征，检测结果判断为先天型共鸣者，声痕胸口。根据举荐方提供的档案，对象能够释放含有回音能量的泡泡，从而提供防护或战斗支援。必要情况下，也可以通过一次性释放泡泡中的回音能量进行爆破。',
        '此外，根据检测，这种泡泡有着独特的流体结构，除基本防护外，也能够起到类似隧者涂层的虚质隔绝作用。',
      ],
      quotes: [
        '她那用来释放泡泡的装置不是从鸣呜物流的广告里买的吗？我侄女也买过同款！那种泡泡怎么可能抵挡虚质？',
        '当初到底是怎么归档的！我的天……这份档案里有半句话是真的吗？',
      ],
    },
    {
      title: '超频诊断报告',
      fields: [],
      body: [
        '受试样本拉贝尔波形波形检测图呈椭圆形波动，时域表示稳定，未见任何异常波动倾向。检测结果判断为正常阶段。',
        '诊断结果：超频临界值正常，稳定性高，暂无超频风险。',
        '无过往超频史，拉贝尔曲线稳定。',
        '暂无需心理辅导。',
      ],
      quotes: [
        '无过往超频风险和过往超频史？你见过把虚质揉成方块拿来砸人的共鸣者吗？绯雪的战斗记录里她可是连声痕都裂开了！',
        '行了……你这档案我是一个字也不会信了，阿里曼，把黯原那边找到的记录发给我！',
      ],
    },
  ],
};
