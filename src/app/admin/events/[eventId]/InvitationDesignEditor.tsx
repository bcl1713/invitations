'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import {
  DESIGN_BLOCKS,
  FONT_FAMILY_OPTIONS,
  fontCssFamily,
  type DesignBlock,
  type FontStyle,
  type FontWeight,
  type InvitationDesign,
  type TextAlign,
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

const VARIABLES = ['%guestname', '%hostname', '%eventtitle', '%location', '%date', '%time'];

export function InvitationDesignEditor({ initialDesign }: { initialDesign: InvitationDesign }) {
  const [design, setDesign] = useState(initialDesign);
  const [selectedBlock, setSelectedBlock] = useState<DesignBlock>('title');
  const fieldRefs = useRef<Partial<Record<DesignBlock, HTMLDivElement | null>>>({});
  const selectedStyle = design.typography[selectedBlock];
  const serialized = useMemo(() => JSON.stringify(design), [design]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('invitation-design-change', { detail: serialized }));
  }, [serialized]);

  function updateContent(block: DesignBlock, value: string) {
    setDesign((current) => ({
      ...current,
      content: { ...current.content, [block]: value },
    }));
  }

  function updateStyle(
    field: 'fontFamily' | 'fontSize' | 'fontWeight' | 'fontStyle' | 'textAlign',
    value: string,
  ) {
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

  function insertVariable(variable: string) {
    const field = fieldRefs.current[selectedBlock];
    if (!field) return;
    field.focus();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !field.contains(selection.anchorNode)) {
      const range = document.createRange();
      range.selectNodeContents(field);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
    document.execCommand('insertText', false, variable);
    updateContent(selectedBlock, field.textContent ?? '');
  }

  return (
    <section className="stack invitation-design-editor">
      <div className="row between wrap">
        <div>
          <h3>Postcard text editor</h3>
          <p className="muted">Edit any line directly. The canvas preview and saved card use the same text surface.</p>
        </div>
        <span className="badge">2:3 portrait postcard</span>
      </div>

      <div className="stack invitation-editor-toolbar" aria-label="Text formatting controls">
        <div className="row wrap">
          <label>
            Selected block
            <select value={selectedBlock} onChange={(event) => setSelectedBlock(event.target.value as DesignBlock)}>
              {DESIGN_BLOCKS.map((block) => <option key={block} value={block}>{BLOCK_LABELS[block]}</option>)}
            </select>
          </label>
          <label>
            Font family
            <select aria-label="Font family" value={selectedStyle.fontFamily} onChange={(event) => updateStyle('fontFamily', event.target.value)}>
              {FONT_FAMILY_OPTIONS.map((font) => <option key={font.key} value={font.key}>{font.label}</option>)}
            </select>
          </label>
          <label>
            Font size (px)
            <input aria-label="Font size" type="number" min={9} max={72} value={selectedStyle.fontSize} onChange={(event) => updateStyle('fontSize', event.target.value)} />
          </label>
        </div>
        <div className="row wrap">
          <label>
            Weight
            <select aria-label="Font weight" value={selectedStyle.fontWeight} onChange={(event) => updateStyle('fontWeight', event.target.value as FontWeight)}>
              <option value="normal">Regular</option>
              <option value="bold">Bold</option>
            </select>
          </label>
          <label>
            Style
            <select aria-label="Font style" value={selectedStyle.fontStyle} onChange={(event) => updateStyle('fontStyle', event.target.value as FontStyle)}>
              <option value="normal">Roman</option>
              <option value="italic">Italic</option>
            </select>
          </label>
          <label>
            Alignment
            <select aria-label="Text alignment" value={selectedStyle.textAlign} onChange={(event) => updateStyle('textAlign', event.target.value as TextAlign)}>
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </label>
        </div>
        <div className="row wrap invitation-variable-picker" aria-label="Insert variable">
          <span className="muted">Insert variable:</span>
          {VARIABLES.map((variable) => <button type="button" className="button-subtle" key={variable} onClick={() => insertVariable(variable)}>{variable}</button>)}
        </div>
        <p className="muted compact-info">Variables resolve for each guest at render time. Empty lines are intentional and remain empty.</p>
      </div>

      <div className="stack invitation-editor-fields">
        {DESIGN_BLOCKS.map((block) => {
          const style = design.typography[block];
          return (
            <label key={block} className={`invitation-editor-field ${selectedBlock === block ? 'is-selected' : ''}`}>
              <span>{BLOCK_LABELS[block]}</span>
              <div
                ref={(node) => {
                  fieldRefs.current[block] = node;
                  if (node && node.dataset.initialized !== 'true') {
                    node.textContent = design.content[block];
                    node.dataset.initialized = 'true';
                  }
                }}
                className="invitation-editable-text"
                contentEditable
                suppressContentEditableWarning
                role="textbox"
                aria-label={BLOCK_LABELS[block]}
                onFocus={() => setSelectedBlock(block)}
                onInput={(event) => updateContent(block, event.currentTarget.textContent ?? '')}
                style={{
                  fontFamily: fontCssFamily(style.fontFamily),
                  fontSize: `${style.fontSize}px`,
                  fontWeight: style.fontWeight,
                  fontStyle: style.fontStyle,
                  textAlign: style.textAlign,
                }}
              />
            </label>
          );
        })}
      </div>

      <input type="hidden" name="designConfig" value={serialized} />
    </section>
  );
}
