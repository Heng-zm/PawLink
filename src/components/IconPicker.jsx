import React from 'react';
import { BuiltInIcon, ICON_OPTIONS, SOCIAL_ICON_OPTIONS } from './Icons.jsx';

export function IconPreview({ name = 'link', className = '' }) {
  return <span className={`built-in-icon-preview ${className}`}><BuiltInIcon name={name} /></span>;
}

export default function IconPicker({ value = 'link', onChange, social = false, label = 'Built-in icon' }) {
  const options = social ? SOCIAL_ICON_OPTIONS : ICON_OPTIONS;
  return (
    <fieldset className="icon-picker">
      <legend>{label}</legend>
      <div className="icon-picker-grid">
        {options.map(([name, text, Component]) => (
          <button
            key={name}
            type="button"
            className={value === name ? 'selected' : ''}
            onClick={() => onChange(name)}
            aria-label={text}
            title={text}
          >
            <Component />
            <span>{text}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
