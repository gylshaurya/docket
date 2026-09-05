---
name: Docket
description: A precise private desk for payment evidence review.
colors:
  ink: "#1d3037"
  muted: "#53656c"
  line: "#d8e0e3"
  rail: "#f0f4f5"
  paper: "#fff"
  canvas: "#f7f9fa"
  action: "#17655f"
  action-hover: "#104d48"
  selected: "#e1eeeb"
  control-border: "#aebfc4"
  focus: "#2479b0"
  warning: "#8b5018"
  warning-bg: "#fff5e7"
  warning-border: "#e6d0b4"
  error: "#a42d38"
  error-bg: "#fff0f1"
  error-border: "#e8c6ca"
  success: "#225e40"
  success-bg: "#e7f3ed"
  success-border: "#bcd5c5"
  notice-bg: "#e6f2ed"
typography:
  headline:
    fontFamily: "Public Sans, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Public Sans, system-ui, sans-serif"
    fontSize: "1.1rem"
    fontWeight: 600
  body:
    fontFamily: "Public Sans, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Public Sans, system-ui, sans-serif"
    fontSize: "0.88rem"
    fontWeight: 500
  code:
    fontFamily: "ui-monospace, monospace"
    fontSize: "0.82rem"
rounded:
  control: "6px"
  tag: "4px"
  step: "50%"
spacing:
  action-gap: "10px"
  field-gap: "18px"
  column-gap: "24px"
  mobile-inset: "20px"
  section-inset: "25px"
  review-block: "30px"
components:
  button-primary:
    backgroundColor: "{colors.action}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "10px 15px"
  button-primary-hover:
    backgroundColor: "{colors.action-hover}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 15px"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.action}"
    rounded: "{rounded.control}"
    padding: "10px 15px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 11px"
  record-row:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "15px 13px"
  record-row-selected:
    backgroundColor: "{colors.selected}"
  tag:
    backgroundColor: "{colors.rail}"
    textColor: "{colors.ink}"
    rounded: "{rounded.tag}"
    padding: "4px 9px"
  review-sheet:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    padding: "34px 42px"
  inline-error:
    backgroundColor: "{colors.error-bg}"
    textColor: "{colors.error}"
    rounded: "{rounded.control}"
    padding: "14px 18px"
---

# Design System: Docket

## Overview

**Creative North Star: "The Private Review Desk"**

A private working desk: mist surfaces hold navigation, white surfaces hold the evidence, and deep teal identifies useful actions. Public Sans gives amounts, labels and review notes a consistent, practical voice. Whitespace and thin dividers distinguish tasks without decorative cards or illustrations.

The visual character is professional, restrained and precise. Plain language accompanies every semantic color; pending, failed and verified states remain readable without interpreting color. This documents the implemented system, using the delegated direction rather than introducing a new identity.

**Key Characteristics:**
- White working surfaces and cool mist navigation.
- Compact, readable type with exact amounts and wrapping identifiers.
- Thin borders and tonal grouping, with no shadows.
- Visible labels, strong keyboard focus and feedback beside the action.

## Colors

A cool neutral working palette uses deep teal for action and restrained green, amber and red for evidence states. The frontmatter contains the normative source values extracted from `web/style.css`.

### Primary

- **Deep teal action:** primary controls, links and disclosure summaries. Its darker hover companion supplies a small, direct response.
- **Pale teal selection:** the selected record and the base pressed-control treatment.

### Secondary

- **Evidence green:** successful calls, matched payments, verified inclusion and reviewed decisions use green text, a pale fill and a quiet border. Those labels describe different facts even when they share a color.
- **Caution amber:** pending, unavailable and follow-up states; also synthetic-example notices.
- **Failure red:** failed calls, mismatches and error feedback.
- **Keyboard blue:** the focus outline. It denotes keyboard position, not record status.

### Neutral

- **Charcoal ink:** principal text and headings.
- **Slate muted ink:** supporting copy, references, field placeholders and metadata.
- **Cool mist rail:** navigation and neutral tags; **white paper** holds editable and review content.
- **Pale canvas:** outer app background. **Divider gray** separates sections; the stronger **control border** identifies inputs and secondary buttons.

**The Evidence Words Rule.** Color supports a named state; it never substitutes for one.

## Typography

Public Sans is self-hosted in four weights (400, 500, 600 and 700), with a system sans fallback. System monospace identifies hashes and commitments. There is no separate decorative display face.

The base text is compact and open, with a generous inherited line height. Record headings use the headline role; section headings use the title role. The brand is a bold wordmark (1.5rem, -0.03em tracking). The empty-state heading grows to 2rem; at mobile widths it becomes 1.7rem. Record headings become 1.5rem on mobile. Supporting copy ranges from 0.78rem to 0.92rem, while paragraphs stop at 72ch. These are observed role sizes, not a mathematical scale.

Amounts use tabular numerals and semibold weight. Identifiers and record names wrap when necessary; keep exact values available rather than visually truncating the evidence.

## Layout

The reusable spatial grammar is a navigation surface beside a white working surface. The current review desk is capped at 1440px, with a 310px rail and a flexible review column. Its desktop header is 80px tall. Review padding is 34px vertically and 42px horizontally; the rail uses 30px by 20px. Thin rules separate sections inside one continuous sheet.

At 1050px and below, the rail narrows to 260px, review padding becomes 30px by 28px and the review form stacks. At 760px and below, navigation sits above the selected record, the list scrolls within a 190px maximum height, and a visible jump link reaches the selected record. Review and rail use 20px horizontal insets. Form grids collapse to one column; check headers and actions wrap. Header and footer content reflow without shrinking the reading type.

Invoice definition lists use a fixed label column (130px desktop, 95px mobile) and a flexible value column. Form rows use 18px vertical spacing and up to 24px between columns. Numbered check rows pair a narrow marker column with one flexible content column.

The current first-surface composition and evidence order live in `docs/direction.md` and the direction contract in `web/index.html`; they are not templates for unrelated future surfaces.

## Elevation & Depth

There are no box shadows, blur layers or gradients. White paper, mist navigation, selected-row tint and one-pixel borders provide all surface separation. Focus is an explicit blue outline (3px, offset 3px), not a glow. Controls change background over 0.16s with ease-out; reduced-motion preferences disable transitions. No movement animation is implemented.

**The Flat Surface Rule.** Use tonal surfaces and dividers to organize work; do not add floating-card elevation to this system.

## Shapes

Controls, selected rows and feedback boxes use modest rounded corners from the control radius. Status tags have tighter corners. Small outlined circles identify sequential checks (28px desktop, 24px mobile). The document-outline brand mark is the only illustrative element. Large working surfaces remain square and continuous.

## Components

### Buttons

Semibold, compact and direct. Primary actions use deep teal with white text; secondary actions use white with a stronger neutral border; quiet actions remove the visible border. Base buttons use 10px by 15px padding, with smaller rail actions using 8px by 11px. Hover adjusts the background. Base pressed buttons use selection tint; the primary hover rule retains its dark teal background during pointer presses. Disabled buttons use 0.55 opacity and a waiting cursor. Every keyboard-focusable control inherits the visible focus outline.

### Inputs / Fields

Visible labels precede white fields with a neutral border and the control radius. Inputs and selects have a 43px minimum height; textareas start at 100px and resize vertically. Placeholder text uses the same muted ink as supporting copy. Native constraints cover required fields and address/hash formats. Conditional token fields appear only for ERC20. Request processing disables fields and buttons and exposes the busy state. Drafts restore after navigation and rendering, with successful saves clearing the corresponding draft.

### Navigation

Record rows show payee, invoice reference and review state in that order. The selected row uses a pale teal fill and `aria-pressed`; search uses a visible label. Switching records focuses the review region. The desktop skip link appears on focus, while the mobile jump link remains visible. The navigation list becomes a compact scrolling region on narrow screens.

### Chips

Tags are compact status labels, not filters or buttons. Neutral, successful, warning and failure appearances share the same border and shape. Text distinguishes source receipt success, payment match, inclusion verification and reviewer decisions. Tags do not have hover or selected interactions.

### Cards / Containers

The review sheet is a continuous white container with ruled sections, not a grid of cards. The invoice expectation uses a definition list; numbered check sections group title, status, explanation, result and action. Long identifiers and secondary evidence sit in native disclosure elements with teal summaries. Preserve those native keyboard interactions.

### Feedback

A page-level polite status announces progress and save results. Action feedback also appears inside the relevant form or check. Errors use the failure fill and text, expose an alert role, and receive focus; successful responses use a local status. Error placement retains the reviewer note and explains the prerequisite or recovery next to the action. Synthetic-example warnings remain explicit and disable live check controls.

## Do's and Don'ts

### Do:

- **Do** keep evidence states explicit in words as well as color.
- **Do** keep one primary next action within each workflow stage.
- **Do** retain drafts through navigation and network checks, and focus feedback near the action.
- **Do** keep synthetic examples visibly labelled and separate from live evidence.
- **Do** use visible field labels and the same muted ink for placeholders and supporting text.

### Don't:

- **Don't** use gradients, glows, decorative metrics, hype or generic AI decoration.
- **Don't** imply that inclusion proves payment or that read-only verification publishes a registry record.
- **Don't** hide a failed save only in a page-top notice.
- **Don't** add remote font requests or imagery without a concrete task need.
