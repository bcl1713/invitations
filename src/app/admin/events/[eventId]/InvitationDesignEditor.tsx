'use client';

import { useMemo, useState } from 'react';

import {
  DESIGN_BLOCKS,
  FONT_FAMILY_OPTIONS,
  fontCssFamily,
  type DesignBlock,
  type InvitationDesign,
} from '@/modules/invitations/invitation-design';

const BLOCK_LABELS: Record<DesignBlock, string> = {
  eyebrow: 'Eyebrow',
  introTitle: 'Intro title',
  title: 'Main title',
  hostLine: 'Host line',
  guestLine: 'Guest line',
  whenLabel: 'When label',
  whenValue: 'When value',
  whereLabel: 'Where label',
  whereValue: 'Where value',
  aboutHeading: 'About heading',
  description: 'About text',
  rsvpHeading: 'RSVP heading',
  rsvpIntro: 'RSVP introduction',
  plusOneText: 'Plus-one note',
  rsvpStatusLabel: 'RSVP status label',
  headcountLabel: 'Headcount label',
  noteLabel: 'Note label',
  saveRsvpLabel: 'Save RSVP button',
};

export function InvitationDesignEditor({ initialDesign }: { initialDesign: InvitationDesign }) {
  const [design, setDesign] = useState(initialDesign);
  const [selectedBlock, setSelectedBlock] = useState<DesignBlock>('title');
  const selectedStyle = design.typography[selectedBlock];

  const serialized = useMemo(() => JSON.stringify(design), [design]);

  function updateContent(block: DesignBlock, value: string) {
    setDesign((current) => ({
      ...current,
      content: { ...current.content, [block]: value },
    }));
  }

  function updateStyle(field: 'fontFamily' | 'fontSize', value: string) {
    setDesign((current) => ({
      ...current,
      typography: {
        ...current.typography,
        [selectedBlock]: {
          ...current.typography[selectedBlock],
          [field]: field === 'fontSize' ? Number(value) : value,
        },
      },
    }));
  }

  return (
    <section className="stack invitation-design-editor">
      <div className="row between wrap">
        <div>
          <h3>Postcard text editor</h3>
          <p className="muted">Select a block, edit it directly, then choose its font and size. All changes save with the event.</p>
        </div>
        <span className="badge">2:3 portrait postcard</span>
      </div>

      <div className="row wrap invitation-editor-toolbar" aria-label="Text formatting controls">
        <label>
          Selected block
          <select value={selectedBlock} onChange={(event) => setSelectedBlock(event.target.value as DesignBlock)}>
            {DESIGN_BLOCKS.map((block) => <option key={block} value={block}>{BLOCK_LABELS[block]}</option>)}
          </select>
        </label>
        <label>
          Font family
          <select value={selectedStyle.fontFamily} onChange={(event) => updateStyle('fontFamily', event.target.value)}>
            {FONT_FAMILY_OPTIONS.map((font) => <option key={font.key} value={font.key}>{font.label}</option>)}
          </select>
        </label>
        <label>
          Size (px)
          <input type="number" min={9} max={72} value={selectedStyle.fontSize} onChange={(event) => updateStyle('fontSize', event.target.value)} />
        </label>
      </div>

      <div className="stack invitation-editor-fields">
        {DESIGN_BLOCKS.map((block) => {
          const style = design.typography[block];
          return (
            <label key={block} className={`invitation-editor-field ${selectedBlock === block ? 'is-selected' : ''}`}>
              <span>{BLOCK_LABELS[block]}</span>
              <div
                className="invitation-editable-text"
                contentEditable
                suppressContentEditableWarning
                role="textbox"
                aria-label={BLOCK_LABELS[block]}
                onFocus={() => setSelectedBlock(block)}
                onInput={(event) => updateContent(block, event.currentTarget.textContent ?? '')}
                style={{ fontFamily: fontCssFamily(style.fontFamily), fontSize: `${style.fontSize}px` }}
              >
                {design.content[block]}
              </div>
            </label>
          );
        })}
      </div>

      <input type="hidden" name="designConfig" value={serialized} />
    </section>
  );
}
