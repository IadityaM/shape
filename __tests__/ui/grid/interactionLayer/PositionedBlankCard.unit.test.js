import fakeUiStore from '#/mocks/fakeUiStore'
import { fakeCollection } from '#/mocks/data'
import PositionedBlankCard from '~/ui/grid/interactionLayer/PositionedBlankCard'

let wrapper, component, props, rerender
describe('PositionedBlankCard', () => {
  beforeEach(() => {
    props = {
      uiStore: fakeUiStore,
      collection: fakeCollection,
      col: 0,
      row: 0,
      position: {
        xPos: 0,
        yPos: 0,
        height: 250,
        width: 316,
      },
      emptyRow: false,
      isFourWideBoard: false,
      handleBlankCardClick: jest.fn(),
      handleInsertRowClick: jest.fn(),
      handleRemoveRowClick: jest.fn(),
      onCloseHtc: jest.fn(),
      zoomLevel: 1,
    }
    rerender = props => {
      wrapper = shallow(<PositionedBlankCard.wrappedComponent {...props} />)
      component = wrapper.instance()
      component.onClickHotspot = jest.fn()
    }
  })

  describe('with drag interaction', () => {
    beforeEach(() => {
      props.interactionType = 'drag'
      rerender(props)
    })

    it('should not render GridCardEmptyHotspot', () => {
      expect(wrapper.find('BlankCardContainer').exists()).toBe(true)
      expect(wrapper.find('GridCardEmptyHotspot').exists()).toBe(false)
    })
  })

  describe('with hover interaction', () => {
    beforeEach(() => {
      props.uiStore.blankContentToolIsOpen = true
      props.interactionType = 'hover'
      rerender(props)
    })

    it('should render GridCardEmptyHotspot', () => {
      rerender(props)
      expect(wrapper.find('BlankCardContainer').exists()).toBe(true)
      expect(
        wrapper.find('GridCardEmptyHotspot').props().interactionType
      ).toEqual('hover')
    })
  })

  describe('creating a bct', () => {
    beforeEach(() => {
      props.uiStore.blankContentToolIsOpen = true
      props.interactionType = 'bct'
      rerender(props)
    })

    it('should render GridCardBlank', () => {
      expect(wrapper.find('BlankCardContainer').exists()).toBe(true)
      expect(
        wrapper.find('GridCardEmptyHotspot').props().interactionType
      ).toEqual('bct')
    })
  })

  describe('blocked movement (red hover state)', () => {
    beforeEach(() => {
      props.interactionType = 'drag'
      props.blocked = true
      rerender(props)
    })

    it('should render GridCardBlank', () => {
      expect(wrapper.find('BlankCardContainer').props().blocked).toBe(true)
    })
  })
})
