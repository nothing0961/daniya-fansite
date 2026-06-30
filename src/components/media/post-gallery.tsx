interface PostGalleryProps {
  images: string[];
}

/**
 * 作品图片展示区
 * 单图全宽，多图 2 列网格（手机 1 列）
 */
export function PostGallery({ images }: PostGalleryProps) {
  if (images.length === 0) return null;

  return (
    <div
      className={
        images.length === 1
          ? "w-full"
          : "grid grid-cols-1 sm:grid-cols-2 gap-4"
      }
    >
      {images.map((url, index) => (
        <a
          key={index}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-lg overflow-hidden border border-[var(--border)] hover:border-[var(--primary)]/40 transition-all duration-200 hover:shadow-lg"
        >
          <img
            src={url}
            alt={`作品配图 ${index + 1}`}
            className="w-full h-auto object-cover"
            loading={index === 0 ? "eager" : "lazy"}
          />
        </a>
      ))}
    </div>
  );
}
