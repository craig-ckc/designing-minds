/* -------------------------------------------------------------------------
   Composed class strings for the admin.

   These exist so a measurement can only be written once. The workspace is the
   same few shapes repeated — a 40px chrome bar, a 32px row, a 24px control, a
   4px-radius surface — and when every call site spelled its own padding out,
   the "same" band measured 48px in the top bar and 12px-padded in the
   toolbar, and the "same" small text arrived in nineteen sizes.

   Raw values belong in ../index.css (`@theme`). Anything a component would
   otherwise copy-paste belongs here. Reach for a one-off arbitrary value only
   when the shape genuinely occurs once.
   ------------------------------------------------------------------------- */

/** Raised surface: card, dialog, framed table. */
export const CARD = 'rounded-card border border-line bg-surface'

/**
 * Recessed neutral fill — the slug preview, a read-only value, a key/value
 * block. Filled, not outlined: the reference marks "this is derived, not
 * editable" with a flat grey wash and no border, which reads differently from
 * an input at a glance. That's the point.
 */
export const SUNK = 'rounded-control bg-surface-sunk'

/**
 * A chrome band. The top bar, the records toolbar, the editor header and the
 * sidebar's Dashboard row are one 40px rule across the whole app — that is
 * what makes the panes line up when a record opens beside the list.
 */
export const BAR = 'flex h-bar flex-none items-center gap-2 border-b border-line bg-surface px-2.5'

/** The count/status strip under a table. Shorter than a BAR: it holds no controls. */
export const STATUSBAR =
  'flex h-statusbar flex-none items-center gap-2 border-t border-line px-2.5 text-ui text-muted'

/**
 * Every text-entry control: input, textarea, select trigger, combobox, and the
 * read-only displays that must line up with them. 24px tall at 12px type. The
 * inner shadow is what stops a control this short from reading as a flat
 * outlined box.
 */
export const FIELD =
  'w-full min-h-field rounded-control border border-line-strong bg-surface px-2.5 py-1 text-ui text-ink shadow-field-inset transition placeholder:text-muted focus:border-primary focus:outline focus:outline-2 focus:outline-primary/20 focus:-outline-offset-1'

/** Floating surface: menu, select list, popover, combobox list. */
export const POPUP = 'rounded-control border border-line bg-surface text-ui shadow-popup'

/** A row inside a POPUP — menu item, select option, combobox option. */
export const POPUP_ROW =
  'flex cursor-default items-center gap-2 px-2.5 py-1.5 outline-none data-[highlighted]:bg-surface-alt'

/**
 * Table head cell. Sentence case, not uppercase micro-caps: at 12px semibold
 * a column name is legible as a name, and the uppercase treatment was
 * spending the row's whole height on decoration.
 */
export const TH = 'whitespace-nowrap px-2.5 py-1.5 text-left text-ui font-semibold text-ink border-b border-line'

/** Table body cell. With `text-ui` this lands a row at ~32px, matching `h-row`. */
export const TD = 'px-2.5 py-1.5 align-middle'

/** A non-interactive state chip, e.g. "Read only". */
export const CHIP_DASHED =
  'rounded-control border border-dashed border-line-strong px-1.5 py-0.5 text-meta font-medium uppercase text-muted'

/**
 * A field's caption and its help text.
 *
 * The label is deliberately NOT bold. It was 15px semibold, which made every
 * label compete with the section heading above it; the reference sets labels
 * at control size and regular weight so the eye goes to the *value*, which is
 * the thing the editor is actually there to read.
 */
export const FIELD_LABEL = 'text-ui text-ink'
export const FIELD_HELP = 'text-ui text-muted'
