import type { Plugin } from 'unified';
import { fileInfo, toText } from 'myst-common';
import type { GenericNode, GenericParent } from 'myst-common';
import { findBefore } from 'unist-util-find-before';
import { remove } from 'unist-util-remove';
import { select, selectAll } from 'unist-util-select';
import type { VFile } from 'vfile';

/**
 * Regex for words that fall before cross references
 *
 * For example, with figure cross references, this includes:
 * Fig, Figs, figure, figures, fig., figs. (all case insensitive)
 */
const XREF_PREFIX_RE: Record<string, string> = {
  figure: 'fig(s|(ures{0,1})|(s{0,1}\\.)){0,1} {0,1}$',
  equation: 'eq(s|(ns{0,1})|(uations{0,1})|(n{0,1}s{0,1}\\.)){0,1} {0,1}$',
  heading: 'sections{0,1} {0,1}$',
};
XREF_PREFIX_RE.subequation = XREF_PREFIX_RE.equation;

/**
 * Generic case captures just the kind, singular and plural
 *
 * For example, with table cross references:
 * table and tables
 */
const XREF_PREFIX_RE_NO_KIND = 's{0,1} {0,1}$';

/**
 * Prefix text will only be removed if cross reference text starts with the equivalent
 *
 * For most cases, this is the kind. For example, "Figure 1" for kind figure.
 *
 * However, for equations, the cross reference text is "(1)" so we must look for a different pattern.
 * Headings should always remove the prefix.
 */
const ALT_XREF_START: Record<string, string> = {
  equation: '(',
  heading: '',
};
ALT_XREF_START.subequation = ALT_XREF_START.equation;

const XREF_NUMBER_ONLY_RE = '^[0-9]+[a-z0-9\\.]*$';

enum Action {
  move = 'move',
  trim = 'trim',
}

/**
 * Traverse mdast tree and remove any redundant text before cross references
 *
 * For example, since the cross reference fills "Figure" text,
 *
 * "See Figure [](#my-fig)"
 *
 * will resolve to
 *
 * "See [](#my-fig)"
 */
export function crossReferencePrefixTransform(mdast: GenericParent, vfile: VFile) {
  const paragraphs = selectAll('paragraph', mdast) as GenericParent[];
  paragraphs.forEach((paragraph) => {
    // Treat each paragraph individually
    const xrefs = selectAll('crossReference', paragraph) as GenericParent[];
    xrefs.forEach((xref) => {
      const { kind } = xref;
      if (!kind) return;
      const xrefPrefix = XREF_PREFIX_RE[kind] ?? `${kind}${XREF_PREFIX_RE_NO_KIND}`;
      const xrefStart = kind === 'subequation' ? 'eq' : kind.slice(0, 2);
      const altXrefStart = ALT_XREF_START[kind];
      const xrefText = toText(xref);
      if (!xrefPrefix || !xrefStart || !xrefText) return;
      // First see if xref has placeholder text we don't want duplicated
      const lowerXrefText = xrefText.toLowerCase();
      const numberRegex = new RegExp(XREF_NUMBER_ONLY_RE, 'gi');
      let action: Action;
      if (lowerXrefText.startsWith(xrefStart) || lowerXrefText.startsWith(altXrefStart)) {
        action = Action.trim;
      } else if (numberRegex.exec(lowerXrefText)) {
        action = Action.move;
      } else {
        return;
      }
      // Then find the last node before the cross reference
      let previousNode = findBefore(paragraph, xref);
      if (previousNode?.children) {
        previousNode = select(':last-child', previousNode) as GenericNode;
      }
      if (previousNode?.type !== 'text' || !previousNode.value) return;
      // If this node is just a space, find the next one (this happens with, like: "_figure_ [](#my-fig)")
      let spaceNode: GenericNode | undefined;
      if (previousNode.value === ' ') {
        spaceNode = previousNode;
        previousNode = findBefore(paragraph, spaceNode);
        if (previousNode?.children) {
          previousNode = select(':last-child', previousNode) as GenericNode;
        }
        if (previousNode?.type !== 'text' || !previousNode.value) return;
      }
      // If it is text and ends with an unwanted cross reference prefix, remove the prefix
      const regex = new RegExp(xrefPrefix, 'gi');
      const match = regex.exec(previousNode.value);
      if (match) {
        const messageIndex = previousNode.value.length < 30 ? 0 : previousNode.value.length - 30;
        const beforeXref = `[${toText(xref)}]` + (xref.identifier ? `(${xref.identifier})` : '');
        const before = `${previousNode.value.slice(messageIndex)}${spaceNode ? ' ' : ''}${beforeXref}`;
        if (action === Action.move) {
          xref.children = [
            { type: 'text', value: `${match[0]}${spaceNode ? ' ' : ''}` },
            ...xref.children,
          ];
        }
        previousNode.value = previousNode.value.replace(regex, '');
        const afterXref = `[${toText(xref)}]` + (xref.identifier ? `(${xref.identifier})` : '');
        const after = `${previousNode.value.slice(messageIndex)}${afterXref}`;
        fileInfo(
          vfile,
          `Rewrote cross-reference prefix:\n    Before: ...${before}\n    After:  ...${after}`,
        );
        if (spaceNode) spaceNode.type = '__delete__';
        if (!previousNode.value) previousNode.type = '__delete__';
      }
    });
  });
  remove(mdast, '__delete__');
}

export const crossReferencePrefixPlugin: Plugin<[], GenericParent, GenericParent> =
  () => (tree, vfile) => {
    crossReferencePrefixTransform(tree, vfile);
  };
