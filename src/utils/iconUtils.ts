/**
 * Check if a string is a valid image URL or file path
 */
export const isImageUrl = (iconString?: string): boolean => {
  if (!iconString) return false;

  return (
    iconString.startsWith("http://") ||
    iconString.startsWith("https://") ||
    iconString.startsWith("/") || // Relative path
    iconString.startsWith("./") || // Relative path
    iconString.startsWith("../") || // Relative path
    iconString.endsWith(".jpg") ||
    iconString.endsWith(".jpeg") ||
    iconString.endsWith(".png") ||
    iconString.endsWith(".svg") ||
    iconString.endsWith(".webp") ||
    iconString.endsWith(".gif") ||
    iconString.endsWith(".ico") ||
    iconString.endsWith(".bmp")
  );
};

/**
 * Render an image icon with proper styling
 */
export const renderImageIcon = (src: string, alt: string = "Icon", className: string = "w-5 h-5 object-contain") => {
  return <img src={src} alt={alt} className={className} />;
};
