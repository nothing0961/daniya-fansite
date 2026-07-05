/**
 * 达妮娅粉丝站 · 固定背景音乐歌单
 * ─────────────────────────────────
 * 修改方式：
 *   1. 在下方 PLAYLIST 数组中增删曲目
 *   2. src 字段：可使用 public/ 目录下的本地文件（如 "/music/song1.mp3"）
 *                或外链直链（如 "https://xxx.com/song.mp3"）
 *   3. title / artist 为可选展示字段，后续升级面板时会用到
 *
 * 注意：首次部署时先放 3 首占位曲目，待用户提供真实 mp3 后替换 src 即可。
 */

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  src: string;
  /** 封面图 URL（可选，缺省时面板显示粉色渐变占位） */
  coverUrl?: string;
}

/** 达妮娅角色 BGM · 循环歌单（track-1 已接入真实音频+封面，后续替换 track-2/3） */
export const DANIYA_PLAYLIST: MusicTrack[] = [
  {
    id: "track-1",
    title: "最初和最后的礼物",
    artist: "鸣潮先约电台 · YUE_STEVEN · 陆可儿Kirby",
    src: "/music/鸣潮先约电台 _ YUE_STEVEN _ 陆可儿Kirby - 最初和最后的礼物_H.ogg",
    coverUrl: "/492b30d224bf47429e8aa73a9cfd104a20260521.jpg",
  },
  {
    id: "track-2",
    title: "星空下的悄悄话",
    artist: "达妮娅的瞌睡小屋",
    src: "/music/playlist-placeholder-2.mp3",
    // 缺 coverUrl → 面板自动显示粉色渐变占位
  },
  {
    id: "track-3",
    title: "粉白糖果色日常",
    artist: "达妮娅的瞌睡小屋",
    src: "/music/playlist-placeholder-3.mp3",
    // 缺 coverUrl → 面板自动显示粉色渐变占位
  },
];
