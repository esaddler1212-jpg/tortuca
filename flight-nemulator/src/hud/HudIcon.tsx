import './hud.css';

const ICONS = {
  objective: './hud/icons/objective.svg',
  home: './hud/icons/home-base.svg',
  energy: './hud/icons/energy.svg'
} as const;

export type HudIconName = keyof typeof ICONS;

type Props = {
  name: HudIconName;
  title?: string;
  className?: string;
};

/** Tier 4 HUD glyphs — swap SVGs for [game-icons.net](https://game-icons.net) (CC BY) per CREDITS. */
export function HudIcon({ name, title, className = '' }: Props) {
  return (
    <img
      src={ICONS[name]}
      alt=""
      className={`hud-icon ${className}`.trim()}
      title={title}
      width={16}
      height={16}
      draggable={false}
    />
  );
}