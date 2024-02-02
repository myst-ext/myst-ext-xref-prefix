import { beforeEach, describe, expect, it } from 'vitest';
import { VFile } from 'vfile';
import { crossReferencePrefixTransform } from './crossReferencePrefix';
import { u } from 'unist-builder';

let vfile: VFile;

beforeEach(() => {
  vfile = new VFile();
});

describe('crossReferencePrefixTransform', () => {
  it.each([
    ['figure', 'figure', 'Figure'],
    ['fig', 'figure', 'Figure'],
    ['FIGS.', 'figure', 'fig'],
    ['Eqn.', 'equation', '(1)'],
    ['Equations', 'equation', 'Equation'],
    ['Eqn.', 'subequation', '(1)'],
    ['Eq', 'subequation', 'eq.'],
    ['section', 'heading', '@@DOESNT MATTER@@'],
    ['table', 'table', 'table'],
    ['tables', 'table', 'tab.'],
  ])('Basic duplicated prefix "%s" is removed for kind "%s"', (prefix, kind, start) => {
    const mdast = u('root', [
      u('paragraph', [
        u('text', `Hello ${prefix} `),
        u(
          'crossReference',
          {
            identifier: 'my-fig',
            label: 'my-fig',
            kind,
            enumerator: '1',
            resolved: true,
          },
          [u('text', `${start} `), u('text', '1')],
        ),
      ]),
    ]);
    crossReferencePrefixTransform(mdast, vfile);
    expect((mdast as any).children[0].children[0].value).toEqual('Hello ');
  });
  it.each([
    ['figure', 'figure', 'Figure'],
    ['fig', 'figure', 'Figure'],
    ['FIGS.', 'figure', 'fig'],
    ['Eqn.', 'equation', '(1)'],
    ['Equations', 'equation', 'Equation'],
    ['Eqn.', 'subequation', '(1)'],
    ['Eq', 'subequation', 'eq.'],
    ['section', 'heading', '@@DOESNT MATTER@@'],
    ['table', 'table', 'table'],
    ['tables', 'table', 'tab.'],
  ])('Basic duplicated prefix "%s" is removed for kind "%s"', (prefix, kind, start) => {
    const mdast = u('root', [
      u('paragraph', [
        u('text', `Hello ${prefix} `),
        u(
          'crossReference',
          {
            identifier: 'my-fig',
            label: 'my-fig',
            kind,
            enumerator: '1',
            resolved: true,
          },
          [u('text', `${start} `), u('text', '1')],
        ),
      ]),
    ]);
    crossReferencePrefixTransform(mdast, vfile);
    expect((mdast as any).children[0].children[0].value).toEqual('Hello ');
  });
  it.each([
    ['figure', 'figure', 'My figure'],
    ['fig', 'table', 'Figure'],
    ['Eqn.', 'equation', 'E.'],
    ['Eqn.', 'subequation', ''],
  ])('Prefix "%s" is not removed for kind "%s" if not duplicated', (prefix, kind, start) => {
    const mdast = u('root', [
      u('paragraph', [
        u('text', `Hello ${prefix} `),
        u(
          'crossReference',
          {
            identifier: 'my-fig',
            label: 'my-fig',
            kind,
            enumerator: '1',
            resolved: true,
          },
          [u('text', `${start} `), u('text', '1')],
        ),
      ]),
    ]);
    crossReferencePrefixTransform(mdast, vfile);
    expect((mdast as any).children[0].children[0].value).toEqual(`Hello ${prefix} `);
  });
  it('Duplicated figure prefix is removed from nested child', () => {
    const mdast = u('root', [
      u('paragraph', [
        u('strong', [u('text', 'Hello figure ')]),
        u(
          'crossReference',
          {
            identifier: 'my-fig',
            label: 'my-fig',
            kind: 'figure',
            enumerator: '1',
            resolved: true,
          },
          [u('text', 'Figure '), u('text', '1')],
        ),
      ]),
    ]);
    crossReferencePrefixTransform(mdast, vfile);
    expect((mdast as any).children[0].children[0].children[0].value).toEqual('Hello ');
  });
  it('Duplicated figure prefix is removed when spread across multiple nodes', () => {
    const mdast = u('root', [
      u('paragraph', [
        u('strong', [u('text', 'Hello figure')]),
        u('text', ' '),
        u(
          'crossReference',
          {
            identifier: 'my-fig',
            label: 'my-fig',
            kind: 'figure',
            enumerator: '1',
            resolved: true,
          },
          [u('text', 'Figure '), u('text', '1')],
        ),
      ]),
    ]);
    crossReferencePrefixTransform(mdast, vfile);
    expect((mdast as any).children[0].children[0].children[0].value).toEqual('Hello ');
  });
  it('Duplicated figure prefix is not removed from code', () => {
    const mdast = u('root', [
      u('paragraph', [
        u('code', 'Hello figure '),
        u(
          'crossReference',
          {
            identifier: 'my-fig',
            label: 'my-fig',
            kind: 'figure',
            enumerator: '1',
            resolved: true,
          },
          [u('text', 'Figure '), u('text', '1')],
        ),
      ]),
    ]);
    crossReferencePrefixTransform(mdast, vfile);
    expect((mdast as any).children[0].children[0].value).toEqual('Hello figure ');
  });
});
