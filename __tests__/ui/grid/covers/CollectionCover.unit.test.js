import CollectionCover from '~/ui/grid/covers/CollectionCover'
import fakeUiStore from '#/mocks/fakeUiStore'
import {
  fakeCollection,
} from '#/mocks/data'

const props = {
  collection: fakeCollection,
  width: 2,
  height: 1,
  uiStore: fakeUiStore,
}
const { cover } = fakeCollection

let wrapper
describe('CollectionCover', () => {
  beforeEach(() => {
    wrapper = shallow(
      <CollectionCover.wrappedComponent {...props} />
    )
  })

  it('renders the cover image_url', () => {
    expect(wrapper.find('StyledCollectionCover').props().url).toEqual(cover.image_url)
  })

  it('renders the cover name and text', () => {
    expect(wrapper.find('Dotdotdot').at(0).children().text()).toContain(cover.name)
    expect(wrapper.find('Dotdotdot').at(1).children().text()).toContain(cover.text)
  })
})
