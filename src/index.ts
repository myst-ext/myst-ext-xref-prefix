import type { MystPlugin, TransformSpec } from 'myst-common';
import { crossReferencePrefixPlugin } from './crossReferencePrefix.js';

const crossReferencePrefixTransformSpec: TransformSpec = {
  name: 'Cross-Reference Prefix Transform',
  stage: 'project',
  plugin: crossReferencePrefixPlugin,
};

const plugin: MystPlugin = {
  name: 'Cross-Reference Prefix Plugin',
  author: 'Franklin Koch',
  license: 'MIT',
  transforms: [crossReferencePrefixTransformSpec],
  directives: [],
  roles: [],
};

export default plugin;
