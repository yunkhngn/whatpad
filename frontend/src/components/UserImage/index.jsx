import './UserImage.css'

export default function UserImage({
    size,
    className,
    src,
    style,
    placeholder,
    alt
}) {
    const innerSize = {
        sm: 'image-sm',
        md: 'image-md',
        lg: 'image-lg',
        xl: 'image-xl'
    }

    return <img
        src={src}
        alt={alt}
        className={`user-image ${innerSize[size]} ${className}`}
        style={style}
    />
}