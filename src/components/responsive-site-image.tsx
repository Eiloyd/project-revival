import type { ImgHTMLAttributes } from 'react';

type Props = ImgHTMLAttributes<HTMLImageElement> & { mobile: string; light?: string };

/** Picture with a phone crop; an optional bright artwork replaces it in the light theme on every screen size (CSS switches them, so there is no flash). */
export function ResponsiveSiteImage({ mobile, src, className, light, ...props }: Props) {
  const dark = <picture className={`${className ?? ''}${light ? ' art-dark' : ''}`}><source media="(max-width: 767px)" srcSet={mobile} /><img {...props} src={src} className="h-full w-full object-cover [object-position:inherit]" /></picture>;
  if (!light) return dark;
  return <>{dark}<picture className={`${className ?? ''} art-light`}><img {...props} fetchPriority="auto" loading="lazy" src={light} className="h-full w-full object-cover [object-position:inherit]" /></picture></>;
}
