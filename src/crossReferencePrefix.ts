import type { Plugin } from 'unified';
import { fileInfo, toText } from 'myst-common';
import type { GenericNode, GenericParent } from 'myst-common';
import { findBefore } from 'unist-util-find-before';
import { select, selectAll } from 'unist-util-select';
import type { VFile } from 'vfile';

/**
 * Regex for words that fall before cross references
 *
 * For example, with figure cross references, this includes:
 * Fig, Figs, figure, figures, fig., figs. (all case insensitive)
 */
const XREF_PREFIX_RE: Record<string, string> = {
  figure: 'fig(s|(ures{0,1})|(s{0,1}\\.)){0,1} {0,2}$',
  equation: 'eq(s|(ns{0,1})|(uations{0,1})|(n{0,1}s{0,1}\\.)){0,1} {0,2}$',
  heading: 'sections{0,1} {0,2}$',
};
XREF_PREFIX_RE.subequation = XREF_PREFIX_RE.equation;

/**
 * Generic case captures just the kind, singular and plural
 *
 * For example, with table cross references:
 * table and tables
 */
const XREF_PREFIX_RE_NO_KIND = 's{0,1} {0,2}$';

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
      const xrefText = select('text', xref) as GenericNode;
      if (!xrefPrefix || !xrefStart || !xrefText.value) return;
      // First see if xref has placeholder text we don't want duplicated
      const lowerXrefValue = xrefText.value.toLowerCase();
      if (!lowerXrefValue.startsWith(xrefStart) && !lowerXrefValue.startsWith(altXrefStart)) return;
      // Then find the last node before the cross reference
      let previousNode = findBefore(paragraph, xref);
      if (previousNode?.children) {
        previousNode = select(':last-child', previousNode) as GenericNode;
      }
      // If it is text and ends with an unwanted cross reference prefix, remove the prefix
      if (previousNode?.type !== 'text' || !previousNode.value) return;
      const regex = new RegExp(xrefPrefix, 'gi');
      if (regex.exec(previousNode.value)) {
        const messageIndex = previousNode.value.length < 30 ? 0 : previousNode.value.length - 30;
        const messageXref = `[${toText(xref)}]` + (xref.identifier ? `(${xref.identifier})` : '');
        const before = `${previousNode.value.slice(messageIndex)}${messageXref}`;
        previousNode.value = previousNode.value.replace(regex, '');
        const after = `${previousNode.value.slice(messageIndex)}${messageXref}`;
        fileInfo(
          vfile,
          `Rewrote cross-reference prefix:\n    Before: ...${before}\n    After:  ...${after}`,
        );
      }
    });
  });
}

export const crossReferencePrefixPlugin: Plugin<[], GenericParent, GenericParent> =
  () => (tree, vfile) => {
    crossReferencePrefixTransform(tree, vfile);
  };
