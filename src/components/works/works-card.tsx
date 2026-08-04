/**
 * WorksCard — 作品集卡片（瀑布流单元）
 * 封面图 + 标题 + 作者 + 点赞数
 * hover 显示覆盖层（操作按钮）
 */
import Link from "next/link";
import { Heart, Eye } from "lucide-react";
import type { PostMeta } from "@/lib/posts";
import { POST_TYPE_LABELS } from "@/lib/works-constants";

interface WorksCardProps {
  post: PostMeta;
}

export function WorksCard({ post }: WorksCardProps) {
  const cover = post.images[0];
  const formattedDate = new Date(post.publishedAt).toLocaleDateString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
  });

  return (
    <Link href={`/post/${post.slug}`} className="wp-card">
      {/* 封面图 */}
      <div className="wp-card-cover">
        {cover ? (
          <img
            src={cover}
            alt={post.title}
            loading="lazy"
            className="wp-card-img"
          />
        ) : post.videoId ? (
          <div className="wp-card-placeholder wp-card-video">
            <span>▶</span>
          </div>
        ) : (
          <div className="wp-card-placeholder">
            <span>暂无图</span>
          </div>
        )}

        {/* 类型角标 */}
        <span className={`wp-card-badge wp-badge--${post.type}`}>
          {typeToLabel(post.type)}
        </span>

        {/* Hover 覆盖层 */}
        <div className="wp-card-overlay">
          <div className="wp-card-actions">
            <button className="wp-card-btn" title="收藏">
              <Heart size={16} />
            </button>
            <button className="wp-card-btn" title="预览">
              <Eye size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 底部信息 */}
      <div className="wp-card-info">
        <h3 className="wp-card-title">{post.title}</h3>
        <div className="wp-card-meta">
          <span className="wp-card-author">{post.originalCreator}</span>
          <span className="wp-card-date">{formattedDate}</span>
        </div>
      </div>
    </Link>
  );
}

function typeToLabel(type: string): string {
  return POST_TYPE_LABELS[type] || type;
}
