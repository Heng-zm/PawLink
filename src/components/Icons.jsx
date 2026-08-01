import React from 'react';

const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

const icon = (children) => function Icon(props) {
  return <svg {...base} {...props}>{children}</svg>;
};

export const ArrowUpRightIcon = icon(<><path d="M7 17 17 7"/><path d="M7 7h10v10"/></>);
export const ArrowLeftIcon = icon(<path d="m15 18-6-6 6-6"/>);
export const CheckIcon = icon(<path d="m5 12 4 4L19 6"/>);
export const CheckCircleIcon = icon(<><circle cx="12" cy="12" r="9"/><path d="m8 12 2.6 2.6L16.5 9"/></>);
export const CopyIcon = icon(<><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>);
export const MenuIcon = icon(<path d="M4 6h16M4 12h16M4 18h16"/>);
export const XIcon = icon(<path d="M18 6 6 18M6 6l12 12"/>);
export const SparkleIcon = icon(<><path d="m12 3-1.6 4.4L6 9l4.4 1.6L12 15l1.6-4.4L18 9l-4.4-1.6L12 3Z"/><path d="m5 16-.8 2.2L2 19l2.2.8L5 22l.8-2.2L8 19l-2.2-.8L5 16Z"/></>);
export const LinkIcon = icon(<><path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.1-1.1"/></>);
export const PaletteIcon = icon(<><path d="M12 3a9 9 0 0 0 0 18h1.5a1.5 1.5 0 0 0 0-3H12a2 2 0 0 1 0-4h2a7 7 0 0 0 0-14h-2Z"/><circle cx="7.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="10" cy="7.5" r=".5" fill="currentColor"/><circle cx="14" cy="7.5" r=".5" fill="currentColor"/><circle cx="16.5" cy="10.5" r=".5" fill="currentColor"/></>);
export const ChartIcon = icon(<><path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-6"/></>);
export const HomeIcon = icon(<><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></>);
export const SettingsIcon = icon(<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21h-4v-.1A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H3v-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3.1V3h4v.1A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9A1.7 1.7 0 0 0 20.9 10h.1v4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></>);
export const LogOutIcon = icon(<><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M21 19V5a2 2 0 0 0-2-2h-6"/></>);
export const PlusIcon = icon(<path d="M12 5v14M5 12h14"/>);
export const TrashIcon = icon(<><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="m19 6-1 14H6L5 6"/></>);
export const ChevronUpIcon = icon(<path d="m18 15-6-6-6 6"/>);
export const ChevronDownIcon = icon(<path d="m6 9 6 6 6-6"/>);
export const ExternalIcon = ArrowUpRightIcon;
export const EyeIcon = icon(<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>);
export const MouseIcon = icon(<><rect x="7" y="2" width="10" height="20" rx="5"/><path d="M12 6v4"/></>);
export const MoreIcon = icon(<><circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/></>);
export const SaveIcon = icon(<><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/></>);
export const ShareIcon = icon(<><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4"/></>);
export const MailIcon = icon(<><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></>);
export const UserIcon = icon(<><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>);
export const SearchIcon = icon(<><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>);
export const EditIcon = icon(<><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></>);
export const DuplicateIcon = icon(<><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></>);
export const GripIcon = icon(<><circle cx="9" cy="6" r="1" fill="currentColor"/><circle cx="15" cy="6" r="1" fill="currentColor"/><circle cx="9" cy="12" r="1" fill="currentColor"/><circle cx="15" cy="12" r="1" fill="currentColor"/><circle cx="9" cy="18" r="1" fill="currentColor"/><circle cx="15" cy="18" r="1" fill="currentColor"/></>);
export const UploadIcon = icon(<><path d="M12 3v12"/><path d="m7 8 5-5 5 5"/><path d="M5 21h14a2 2 0 0 0 2-2v-4M3 15v4a2 2 0 0 0 2 2"/></>);
export const GlobeIcon = icon(<><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></>);
export const PlayIcon = icon(<><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10 9 5 3-5 3Z" fill="currentColor" stroke="none"/></>);
export const ShoppingBagIcon = icon(<><path d="M6 8h12l1 13H5L6 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></>);
export const MessageIcon = icon(<><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"/><path d="M8 9h8M8 13h5"/></>);
export const MusicIcon = icon(<><path d="M9 18V5l10-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/></>);
export const CameraIcon = icon(<><path d="M4 7h3l2-3h6l2 3h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"/><circle cx="12" cy="13" r="4"/></>);
export const CoffeeIcon = icon(<><path d="M4 7h12v7a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5Z"/><path d="M16 9h2a3 3 0 0 1 0 6h-2M6 3v2M10 3v2M14 3v2"/></>);
export const CalendarIcon = icon(<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>);
export const DownloadIcon = icon(<><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></>);
export const FileIcon = icon(<><path d="M6 2h8l4 4v16H6Z"/><path d="M14 2v5h5M9 13h6M9 17h6"/></>);
export const HeartIcon = icon(<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>);
export const StarIcon = icon(<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z"/>);
export const PhoneIcon = icon(<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.3 19.3 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z"/>);
export const MapPinIcon = icon(<><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/></>);
export const BookIcon = icon(<><path d="M4 4h6a3 3 0 0 1 3 3v13a3 3 0 0 0-3-3H4Z"/><path d="M20 4h-6a3 3 0 0 0-3 3v13a3 3 0 0 1 3-3h6Z"/></>);
export const LayersIcon = icon(<><path d="m12 2 9 5-9 5-9-5Z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/></>);
export const LayoutIcon = icon(<><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></>);
export const TypeIcon = icon(<><path d="M4 6V4h16v2M9 20h6M12 4v16"/></>);
export const WandIcon = icon(<><path d="m15 4 5 5L9 20l-5-5Z"/><path d="m14 5 5 5M6 4v3M4.5 5.5h3M19 15v4M17 17h4"/></>);
export const ShieldIcon = icon(<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></>);
export const ZapIcon = icon(<path d="M13 2 3 14h9l-1 8 10-12h-9Z"/>);
export const SmartphoneIcon = icon(<><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/></>);
export const TabletIcon = icon(<><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M11 18h2"/></>);
export const DesktopIcon = icon(<><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></>);
export const FilterIcon = icon(<path d="M4 5h16M7 12h10M10 19h4"/>);
export const InfoIcon = icon(<><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></>);
export const AlertIcon = icon(<><path d="M10.3 3.7 2.2 18a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></>);

export const InstagramIcon = icon(<><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none"/></>);
export const TikTokIcon = icon(<><path d="M14 4v10.5a4.5 4.5 0 1 1-4-4.47"/><path d="M14 4c1.2 2.1 2.8 3.2 5 3.3"/></>);
export const YouTubeIcon = PlayIcon;
export const FacebookIcon = icon(<path d="M14 21v-8h3l.5-4H14V7c0-1.2.4-2 2.1-2H18V1.5c-.8-.1-1.8-.2-2.8-.2-3 0-5.2 1.9-5.2 5.3V9H7v4h3v8"/>);
export const TelegramIcon = icon(<><path d="m21 4-4 16-6-5-4 3 1-6 10-6-13 5-3-1Z"/><path d="m8 12 9-6"/></>);
export const XSocialIcon = icon(<path d="M4 4l16 16M20 4 4 20"/>);
export const LinkedinIcon = icon(<><rect x="3" y="9" width="4" height="11"/><path d="M5 4.5v.01M11 20V9h4v2c1-2 6-2.2 6 3v6h-4v-5c0-2-2-2-2 0v5Z"/></>);
export const GithubIcon = icon(<><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3.3-.4 6.8-1.6 6.8-7.4A5.8 5.8 0 0 0 19.3 3 5.4 5.4 0 0 0 19.1.1S17.9-.3 15 1.6a13.4 13.4 0 0 0-6 0C6.1-.3 4.9.1 4.9.1A5.4 5.4 0 0 0 4.7 3a5.8 5.8 0 0 0-1.5 4.1c0 5.8 3.5 7 6.8 7.4A4.8 4.8 0 0 0 9 18v4"/><path d="M9 19c-3 .9-3-1.5-4.2-2"/></>);

export const BrandIcon = icon(<><rect x="3" y="3" width="18" height="18" rx="6"/><path d="M8.5 12h7M12 8.5v7"/><circle cx="12" cy="12" r="4.5"/></>);

export const ICON_OPTIONS = [
  ['link', 'Link', LinkIcon],
  ['globe', 'Website', GlobeIcon],
  ['play', 'Video', PlayIcon],
  ['shop', 'Shop', ShoppingBagIcon],
  ['message', 'Community', MessageIcon],
  ['music', 'Music', MusicIcon],
  ['camera', 'Gallery', CameraIcon],
  ['coffee', 'Support', CoffeeIcon],
  ['calendar', 'Booking', CalendarIcon],
  ['mail', 'Email', MailIcon],
  ['download', 'Download', DownloadIcon],
  ['file', 'Document', FileIcon],
  ['heart', 'Favorite', HeartIcon],
  ['star', 'Featured', StarIcon],
  ['phone', 'Phone', PhoneIcon],
  ['map', 'Location', MapPinIcon],
  ['book', 'Read', BookIcon],
];

export const SOCIAL_ICON_OPTIONS = [
  ['instagram', 'Instagram', InstagramIcon],
  ['tiktok', 'TikTok', TikTokIcon],
  ['youtube', 'YouTube', YouTubeIcon],
  ['facebook', 'Facebook', FacebookIcon],
  ['telegram', 'Telegram', TelegramIcon],
  ['x', 'X', XSocialIcon],
  ['linkedin', 'LinkedIn', LinkedinIcon],
  ['github', 'GitHub', GithubIcon],
  ['globe', 'Website', GlobeIcon],
  ['mail', 'Email', MailIcon],
  ['link', 'Other', LinkIcon],
];

const iconMap = Object.fromEntries([...ICON_OPTIONS, ...SOCIAL_ICON_OPTIONS].map(([name, , Component]) => [name, Component]));

export function BuiltInIcon({ name = 'link', ...props }) {
  const Component = iconMap[name] || LinkIcon;
  return <Component {...props} />;
}

export function BrandMark({ className = '' }) {
  return <span className={`brand-mark ${className}`} aria-hidden="true"><BrandIcon /></span>;
}
