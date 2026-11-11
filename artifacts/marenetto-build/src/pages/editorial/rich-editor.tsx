import { useEffect, useRef, useState } from 'react';
import { Bold, Code2, Heading2, Heading3, Italic, Link2, List, ListOrdered, Quote, RemoveFormatting, Unlink } from 'lucide-react';
import { urlError } from './shared';
import DOMPurify from 'dompurify';

type Props = { value: string; onChange: (html: string) => void; dir: 'ltr' | 'rtl'; lang: string; disabled?: boolean; labelId: string };

const tools = [
  { id: 'bold', label: 'Grassetto', icon: Bold, run: () => document.execCommand('bold') },
  { id: 'italic', label: 'Corsivo', icon: Italic, run: () => document.execCommand('italic') },
  { id: 'h2', label: 'Titolo di sezione', icon: Heading2, run: () => document.execCommand('formatBlock', false, 'h2') },
  { id: 'h3', label: 'Sottotitolo', icon: Heading3, run: () => document.execCommand('formatBlock', false, 'h3') },
  { id: 'ul', label: 'Elenco puntato', icon: List, run: () => document.execCommand('insertUnorderedList') },
  { id: 'ol', label: 'Elenco numerato', icon: ListOrdered, run: () => document.execCommand('insertOrderedList') },
  { id: 'quote', label: 'Citazione', icon: Quote, run: () => document.execCommand('formatBlock', false, 'blockquote') },
  { id: 'unlink', label: 'Rimuovi collegamento', icon: Unlink, run: () => document.execCommand('unlink') },
  { id: 'clear', label: 'Rimuovi formattazione', icon: RemoveFormatting, run: () => { document.execCommand('removeFormat'); document.execCommand('formatBlock', false, 'p'); } },
];

export function RichEditor({ value, onChange, dir, lang, disabled, labelId }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<'visual' | 'html'>('visual');
  const [linkError, setLinkError] = useState('');
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const valueRef = useRef(value);
  valueRef.current = value;

  // Only write innerHTML on mount / mode switch — never while typing.
  useEffect(() => { if (mode === 'visual' && ref.current) ref.current.innerHTML = DOMPurify.sanitize(valueRef.current, { USE_PROFILES: { html: true }, FORBID_TAGS: ['style','form','input','button','iframe'], FORBID_ATTR: ['style'] }); }, [mode]);

  const emit = () => { if (ref.current) onChangeRef.current(ref.current.innerHTML); };
  const exec = (run: () => void) => { if (disabled) return; ref.current?.focus(); run(); emit(); };
  const addLink = () => {
    const url = window.prompt('Indirizzo del collegamento (https://…)');
    if (!url) return;
    const err = urlError(url);
    setLinkError(err);
    if (!err) exec(() => document.execCommand('createLink', false, url.trim()));
  };

  return <div className={`ed-rich ${disabled ? 'disabled' : ''}`}>
    <div className="ed-rich-toolbar" role="toolbar" aria-label="Formattazione del testo" aria-controls={`${labelId}-area`}>
      {mode === 'visual' && <>{tools.map(t => <button key={t.id} type="button" disabled={disabled} aria-label={t.label} title={t.label} onMouseDown={e => e.preventDefault()} onClick={() => exec(t.run)} data-testid={`button-format-${t.id}`}><t.icon size={15} /></button>)}
        <button type="button" disabled={disabled} aria-label="Inserisci collegamento" title="Inserisci collegamento" onMouseDown={e => e.preventDefault()} onClick={addLink} data-testid="button-format-link"><Link2 size={15} /></button></>}
      <span className="ed-rich-spacer" />
      <button type="button" className={`ed-rich-mode ${mode === 'html' ? 'on' : ''}`} aria-pressed={mode === 'html'} onClick={() => setMode(m => (m === 'visual' ? 'html' : 'visual'))} data-testid="button-toggle-html"><Code2 size={14} /> {mode === 'html' ? 'Editor visivo' : 'Codice HTML'}</button>
    </div>
    {linkError && <div className="ed-field-error" role="alert">{linkError}</div>}
    {mode === 'visual'
      ? <div id={`${labelId}-area`} ref={ref} className="ed-rich-area" contentEditable={!disabled} suppressContentEditableWarning role="textbox" aria-multiline="true" aria-labelledby={labelId} dir={dir} lang={lang} onInput={emit} onBlur={emit} onPaste={e => { e.preventDefault(); if (!disabled) { document.execCommand('insertText', false, e.clipboardData.getData('text/plain')); emit(); } }} onDrop={e => e.preventDefault()} data-testid="input-body-visual" />
      : <textarea id={`${labelId}-area`} className="ed-rich-html" value={value} onChange={e => onChange(e.target.value)} disabled={disabled} aria-labelledby={labelId} dir="ltr" spellCheck={false} data-testid="input-body-html" />}
    <small className="ed-hint">Il corpo viene ripulito dal server a ogni salvataggio: script, stili inline e attributi non ammessi vengono rimossi.</small>
  </div>;
}
