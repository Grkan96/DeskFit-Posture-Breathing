import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

// Basit, tek renkli çizgi ikonlar (feather-icons tarzı) — ErgonomicsTipsScreen
// kartlarında lib/ergonomicsTips.js'deki `icon` anahtar kelimesine göre seçilir.
// Yeni bir görsel dosya EKLEMEZ; screens/HomeScreen.js'teki CupIcon deseniyle
// aynı şekilde react-native-svg (mevcut bağımlılık) ile inline çizilir.

function Frame({ size, children }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {children}
    </Svg>
  );
}

function MonitorIcon({ size, color }) {
  return (
    <Frame size={size}>
      <Rect x="2" y="4" width="20" height="13" rx="2" stroke={color} strokeWidth={2} />
      <Line x1="8" y1="21" x2="16" y2="21" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1="12" y1="17" x2="12" y2="21" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Frame>
  );
}

function ElbowIcon({ size, color }) {
  return (
    <Frame size={size}>
      <Path d="M6 4v6a4 4 0 004 4h8" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="10" cy="14" r="1.6" fill={color} />
    </Frame>
  );
}

function FeetIcon({ size, color }) {
  return (
    <Frame size={size}>
      <Path
        d="M8 3c-2 0-3 2-3 4.5S6 15 6 17.5 7.3 21 9 21s2.5-1.5 2.5-4-1-6-1-9.5S10 3 8 3z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Path
        d="M16 3c-2 0-3 2-3 4.5S14 15 14 17.5 15.3 21 17 21s2.5-1.5 2.5-4-1-6-1-9.5S18 3 16 3z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </Frame>
  );
}

function ChairIcon({ size, color }) {
  return (
    <Frame size={size}>
      <Path d="M6 3v9a3 3 0 003 3h6a3 3 0 003-3V3" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="7" y1="15" x2="6" y2="21" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1="17" y1="15" x2="18" y2="21" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1="6" y1="9" x2="18" y2="9" stroke={color} strokeWidth={2} />
    </Frame>
  );
}

function EyeIcon({ size, color }) {
  return (
    <Frame size={size}>
      <Path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={2} />
    </Frame>
  );
}

function KeyboardIcon({ size, color }) {
  return (
    <Frame size={size}>
      <Rect x="2" y="6" width="20" height="12" rx="2" stroke={color} strokeWidth={2} />
      <Line x1="6" y1="10" x2="6" y2="10" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
      <Line x1="10" y1="10" x2="10" y2="10" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
      <Line x1="14" y1="10" x2="14" y2="10" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
      <Line x1="18" y1="10" x2="18" y2="10" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
      <Line x1="6" y1="14" x2="14" y2="14" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Frame>
  );
}

function BrightnessIcon({ size, color }) {
  return (
    <Frame size={size}>
      <Circle cx="12" cy="12" r="5" stroke={color} strokeWidth={2} />
      <Line x1="12" y1="1" x2="12" y2="3" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1="12" y1="21" x2="12" y2="23" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1="4.2" y1="4.2" x2="5.6" y2="5.6" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1="18.4" y1="18.4" x2="19.8" y2="19.8" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1="1" y1="12" x2="3" y2="12" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1="21" y1="12" x2="23" y2="12" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1="4.2" y1="19.8" x2="5.6" y2="18.4" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1="18.4" y1="5.6" x2="19.8" y2="4.2" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Frame>
  );
}

function WalkIcon({ size, color }) {
  return (
    <Frame size={size}>
      <Circle cx="13" cy="4" r="2" stroke={color} strokeWidth={2} />
      <Path
        d="M11 8l3 1 3 4M13 9l-2 5-4 3M11 14l3 1 1 6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Frame>
  );
}

function StandingDeskIcon({ size, color }) {
  return (
    <Frame size={size}>
      <Line x1="2" y1="8" x2="22" y2="8" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1="5" y1="8" x2="5" y2="21" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1="19" y1="8" x2="19" y2="21" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M12 1v4M10 3l2-2 2 2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Frame>
  );
}

function BagIcon({ size, color }) {
  return (
    <Frame size={size}>
      <Path d="M7 9V6a5 5 0 0110 0v3" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Rect x="4" y="9" width="16" height="12" rx="3" stroke={color} strokeWidth={2} />
      <Line x1="9" y1="13" x2="15" y2="13" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Frame>
  );
}

const ICONS = {
  monitor: MonitorIcon,
  elbow: ElbowIcon,
  feet: FeetIcon,
  chair: ChairIcon,
  eye: EyeIcon,
  keyboard: KeyboardIcon,
  brightness: BrightnessIcon,
  walk: WalkIcon,
  'standing-desk': StandingDeskIcon,
  bag: BagIcon,
};

export default function TipIcon({ icon, size = 22, color = '#000000' }) {
  const Component = ICONS[icon] || MonitorIcon;
  return <Component size={size} color={color} />;
}
