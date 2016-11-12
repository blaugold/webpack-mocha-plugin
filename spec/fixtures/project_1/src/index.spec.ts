import { expect } from 'chai'

import { Foo } from './index'

describe('Foo', () => {
  it('.bar', () => {
    expect(new Foo().bar()).to.equal('Foo.bar')
  })
});