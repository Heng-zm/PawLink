import React from 'react';

export function Fox({ className = '', label = 'Animated fox mascot' }) {
  return (
    <svg className={`animal animal-fox ${className}`} viewBox="0 0 220 220" role="img" aria-label={label}>
      <g className="animal-float">
        <path className="tail" d="M168 151c36 3 45 38 14 49-20 7-45-6-43-24 2-15 14-27 29-25Z" fill="#ff9a62" stroke="#261d3a" strokeWidth="7"/>
        <path d="M169 166c19 3 24 18 8 26-11 5-24 1-30-7 5-11 11-17 22-19Z" fill="#fff5e8"/>
        <path d="m70 70-7-40 36 25M149 70l8-40-36 25" fill="#ff9a62" stroke="#261d3a" strokeWidth="7" strokeLinejoin="round"/>
        <path d="m72 57-3-17 17 12M147 57l4-17-17 12" fill="#ffd3b7"/>
        <path d="M110 48c45 0 72 37 66 84-5 43-27 69-66 69s-61-26-66-69c-6-47 21-84 66-84Z" fill="#ff9a62" stroke="#261d3a" strokeWidth="7"/>
        <path d="M58 127c8-18 26-21 52-4 26-17 44-14 52 4-2 36-19 61-52 61s-50-25-52-61Z" fill="#fff5e8"/>
        <g className="eyes" fill="#261d3a"><ellipse cx="84" cy="112" rx="7" ry="10"/><ellipse cx="136" cy="112" rx="7" ry="10"/></g>
        <path d="M102 137h16l-8 9-8-9Z" fill="#261d3a" stroke="#261d3a" strokeWidth="3" strokeLinejoin="round"/>
        <path d="M110 146c0 8-6 12-13 12M110 146c0 8 6 12 13 12" fill="none" stroke="#261d3a" strokeWidth="5" strokeLinecap="round"/>
        <circle cx="70" cy="137" r="8" fill="#ff7b8f" opacity=".52"/><circle cx="150" cy="137" r="8" fill="#ff7b8f" opacity=".52"/>
      </g>
    </svg>
  );
}

export function Bee({ className = '', label = 'Animated bee mascot' }) {
  return (
    <svg className={`animal animal-bee ${className}`} viewBox="0 0 140 140" role="img" aria-label={label}>
      <g className="bee-flight">
        <ellipse className="wing wing-left" cx="46" cy="55" rx="24" ry="15" transform="rotate(-35 46 55)" fill="#e8f7ff" stroke="#261d3a" strokeWidth="5"/>
        <ellipse className="wing wing-right" cx="95" cy="54" rx="24" ry="15" transform="rotate(35 95 54)" fill="#e8f7ff" stroke="#261d3a" strokeWidth="5"/>
        <ellipse cx="70" cy="78" rx="37" ry="31" fill="#ffd84d" stroke="#261d3a" strokeWidth="6"/>
        <path d="M46 66c13 8 35 9 49 0M39 82c17 9 46 10 63 0" fill="none" stroke="#261d3a" strokeWidth="9"/>
        <circle cx="58" cy="65" r="4" fill="#261d3a"/><circle cx="82" cy="65" r="4" fill="#261d3a"/>
        <path d="M63 75c4 4 10 4 14 0" fill="none" stroke="#261d3a" strokeWidth="4" strokeLinecap="round"/>
        <path d="M48 46 36 30M91 45l12-16" stroke="#261d3a" strokeWidth="5" strokeLinecap="round"/>
        <circle cx="34" cy="27" r="5" fill="#ff7b8f" stroke="#261d3a" strokeWidth="4"/><circle cx="106" cy="26" r="5" fill="#ff7b8f" stroke="#261d3a" strokeWidth="4"/>
      </g>
    </svg>
  );
}

export function Panda({ className = '', label = 'Animated panda mascot' }) {
  return (
    <svg className={`animal animal-panda ${className}`} viewBox="0 0 180 180" role="img" aria-label={label}>
      <g className="animal-float">
        <circle cx="51" cy="53" r="28" fill="#261d3a"/><circle cx="129" cy="53" r="28" fill="#261d3a"/>
        <circle cx="90" cy="93" r="67" fill="#fff" stroke="#261d3a" strokeWidth="7"/>
        <ellipse cx="62" cy="86" rx="19" ry="27" transform="rotate(25 62 86)" fill="#261d3a"/><ellipse cx="118" cy="86" rx="19" ry="27" transform="rotate(-25 118 86)" fill="#261d3a"/>
        <g className="eyes" fill="#fff"><ellipse cx="65" cy="84" rx="5" ry="7"/><ellipse cx="115" cy="84" rx="5" ry="7"/></g>
        <ellipse cx="90" cy="112" rx="10" ry="8" fill="#261d3a"/>
        <path d="M90 120c0 9-7 13-14 13M90 120c0 9 7 13 14 13" fill="none" stroke="#261d3a" strokeWidth="5" strokeLinecap="round"/>
        <circle cx="52" cy="116" r="8" fill="#ff98aa" opacity=".55"/><circle cx="128" cy="116" r="8" fill="#ff98aa" opacity=".55"/>
      </g>
    </svg>
  );
}

export function Animal({ name, className = '' }) {
  if (name === 'panda') return <Panda className={className} />;
  if (name === 'bee') return <Bee className={className} />;
  if (name === 'fox') return <Fox className={className} />;
  return null;
}
