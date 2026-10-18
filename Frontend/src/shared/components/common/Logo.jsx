export default function Logo({
  size = 'md',
  showText = true,
  animated = true,
  className = '',
  textClassName = ''
}) {
  const iconSizes = { sm: 28, md: 38, lg: 48, xl: 60 }
  const textSizes = { sm: '1.25rem', md: '1.6rem', lg: '2rem', xl: '2.5rem' }
  const dimension = typeof size === 'number' ? size : iconSizes[size] || 38
  const fontSize = typeof size === 'number'
    ? `${Math.round(size * 0.42)}px`
    : textSizes[size] || '1.6rem'

  return (
    <span className={`loopify-brand ${animated ? 'animated-brand' : ''} ${className}`}>
      <span className="loopify-logo-mark" style={{ width: dimension, height: dimension, fontSize: `${Math.round(dimension * 0.72)}px` }} aria-hidden="true">L</span>
      {showText && <span className={`loopify-wordmark ${textClassName}`} style={{ fontSize }}>loopify</span>}
    </span>
  )
}
