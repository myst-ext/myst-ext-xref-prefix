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
  it('Duplicated figure prefix is removed when space is separate node', () => {
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
  it('Duplicated figure prefix is not removed when word is spread across multiple nodes', () => {
    const mdast = u('root', [
      u('paragraph', [
        u('text', 'Hello fig'),
        u('text', 'ure '),
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
    expect((mdast as any).children[0].children[0].value).toEqual('Hello fig');
    expect((mdast as any).children[0].children[1].value).toEqual('ure ');
  });
  it('Duplicated figure prefix node is deleted if empty', () => {
    const mdast = u('root', [
      u('paragraph', [
        u('text', 'figure '),
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
    expect((mdast as any).children[0].children[0].type).toEqual('crossReference');
  });
  it('Duplicated figure prefix node and space node are deleted if empty', () => {
    const mdast = u('root', [
      u('paragraph', [
        u('text', 'figure'),
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
    expect((mdast as any).children[0].children[0].type).toEqual('crossReference');
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
  it('Figure prefix is added to number-only xref', () => {
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
          [u('text', '1')],
        ),
      ]),
    ]);
    crossReferencePrefixTransform(mdast, vfile);
    expect((mdast as any).children[0].children[0].children[0].value).toEqual('Hello ');
    expect((mdast as any).children[0].children[1].children[0].value).toEqual('figure ');
    expect((mdast as any).children[0].children[1].children[1].value).toEqual('1');
  });
  it('Figure prefix is added to number/letter/period-only xref', () => {
    const mdast = u('root', [
      u('paragraph', [
        u('strong', [u('text', 'Hello eq ')]),
        u(
          'crossReference',
          {
            identifier: 'my-fig',
            label: 'my-fig',
            kind: 'subequation',
            enumerator: '1',
            resolved: true,
          },
          [u('text', '1'), u('text', 'a'), u('text', '.5')],
        ),
      ]),
    ]);
    crossReferencePrefixTransform(mdast, vfile);
    expect((mdast as any).children[0].children[0].children[0].value).toEqual('Hello ');
    expect((mdast as any).children[0].children[1].children[0].value).toEqual('eq ');
    expect((mdast as any).children[0].children[1].children[1].value).toEqual('1');
    expect((mdast as any).children[0].children[1].children[2].value).toEqual('a');
    expect((mdast as any).children[0].children[1].children[3].value).toEqual('.5');
  });
});
