export function GallerySymbol({ name, filled = false }: { name: string; filled?: boolean }) {
  return <span className="gallery-symbol" aria-hidden="true" style={{ fontVariationSettings: `'FILL' ${filled ? 1 : 0}` }}>{name}</span>
}
