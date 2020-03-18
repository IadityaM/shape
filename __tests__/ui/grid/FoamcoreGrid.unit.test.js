import CollectionCard from '~/stores/jsonApi/CollectionCard'
import FoamcoreGrid from '~/ui/grid/FoamcoreGrid'
import CardMoveService from '~/utils/CardMoveService'
import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'
import { fakeCollectionCard, fakeCollection } from '#/mocks/data'
import v from '~/utils/variables'

// because of mdlPlaceholder... without this mock it blows up
jest.mock('../../../app/javascript/stores/jsonApi/CollectionCard')
// also allows us to mock + test that the model constructor was called
CollectionCard.mockImplementation((data, apiStore) => {
  return data
})

let props, wrapper, component, rerender, cards, cardA, cardB, cardC
let idCounter = 0

// NOTE: jest window.innerWidth is 1024px
const jestInnerWidth = 1024

function createCard(data) {
  idCounter += 1
  const id = idCounter.toString()
  return {
    ...fakeCollectionCard,
    ...data,
    id,
    record: { internalType: 'items' },
  }
}

describe('FoamcoreGrid', () => {
  beforeEach(() => {
    cardA = createCard({ row: 1, col: 5 })
    cardB = createCard({ row: 0, col: 1, width: 2, height: 2 })
    cardC = createCard({ row: 2, col: 0, width: 2 })
    const collection = fakeCollection

    collection.num_columns = 16
    collection.cardMatrix = [[], [], []]
    collection.cardMatrix[1][5] = cardA
    collection.cardMatrix[0][1] = cardB
    collection.cardMatrix[1][1] = cardB
    collection.cardMatrix[2][0] = cardC
    collection.cardMatrix[2][1] = cardC

    collection.collection_cards = [cardA, cardB, cardC]
    collection.confirmEdit = jest.fn()

    props = {
      collection,
      canEditCollection: true,
      gridW: 200,
      gridH: 200,
      gutter: 10,
      sortBy: 'order',
      selectedArea: { minX: null, minY: null, maxX: null, maxY: null },
      minX: null,
      loadCollectionCards: jest.fn(() => Promise.resolve()),
      updateCollection: jest.fn(),
      cardProperties: [],
      blankContentToolState: {},
      apiStore: fakeApiStore(),
      uiStore: fakeUiStore,
      routingStore: {
        routeTo: jest.fn(),
        push: jest.fn(),
      },
    }
    rerender = () => {
      props.collection.API_batchUpdateCardsWithUndo.mockClear()
      wrapper = shallow(<FoamcoreGrid.wrappedComponent {...props} />)
      component = wrapper.instance()
    }
    rerender()
    cards = props.collection.collection_cards
    component.gridRef = { scrollLeft: 0, scrollTop: 0 }
  })

  it('renders MovableGridCards', () => {
    expect(wrapper.find('MovableGridCard').length).toEqual(3)
  })

  describe('findOverlap', () => {
    it('finds filledSpot (or not) where a card is trying to be dragged', () => {
      // similar to calculateFilledSpots, but given a card (needs width and height >= 1)
      let fakeCard = { row: 1, col: 5, width: 1, height: 1 }
      let overlap = component.findOverlap(fakeCard)
      expect(overlap.card).toEqual(cardA)
      // 2x2 should stick out and overlap cardA
      fakeCard = { row: 0, col: 4, width: 2, height: 2 }
      overlap = component.findOverlap(fakeCard)
      expect(overlap.card).toEqual(cardA)
    })
  })

  describe('onDragStart', () => {
    describe('when dragging multiple cards', () => {
      let fakeDragMap, cardId, card
      beforeEach(() => {
        card = cards[0]
        cardId = card.id
        fakeDragMap = [
          {
            card,
            col: 0,
            row: 0,
          },
          {
            card: cards[1],
            col: 1,
            row: 0,
          },
        ]
        component.draggingMap = []
        component.originalCard = jest.fn().mockReturnValue(card)
        component.determineDragMap = jest.fn().mockReturnValue(fakeDragMap)
        component.onDragStart(cardId)
      })

      it('should determine the drag map with card id', () => {
        expect(component.originalCard).toHaveBeenCalledWith(cardId)
        expect(component.determineDragMap).toHaveBeenCalledWith(cardId)
      })

      it('should set the dragging map if dragging multiple cards', () => {
        expect(component.draggingMap).toEqual(fakeDragMap)
      })
    })
  })

  describe('resetCardPositions', () => {
    beforeEach(() => {
      component.moveCards = jest.fn().mockReturnValue()
      component.resizeCard = jest.fn().mockReturnValue()
      component.dragging = true
      props.uiStore.multiMoveCardIds = [cards[0].id]
    })

    it('should stop all dragging', () => {
      component.resetCardPositions()
      expect(component.dragGridSpot.size).toEqual(0)
      expect(component.dragging).toEqual(false)
      expect(props.uiStore.setMovingCards).toHaveBeenCalledWith([])
    })
  })

  describe('coordinatesForPosition', () => {
    it('should calculate the appropriate coordinates', () => {
      const { gridW, gutter } = v.defaultGridSettings
      const zoom = component.relativeZoomLevel
      let x = (gridW + gutter) / zoom
      const y = 0
      let width = 1
      expect(component.coordinatesForPosition({ x, y, width })).toEqual({
        col: 1,
        outsideDraggableArea: false,
        row: 0,
      })
      x = (16 * (gridW + gutter)) / zoom
      width = 4
      expect(component.coordinatesForPosition({ x, y, width })).toEqual({
        // this will get bumped back to 12 (where it fits)
        col: 12,
        outsideDraggableArea: true,
        row: 0,
      })
    })
  })

  describe('onDragOrResizeStop', () => {
    let cardId

    beforeEach(() => {
      cardId = cards[0].id
      component.moveCards = jest.fn().mockReturnValue()
      component.resizeCard = jest.fn().mockReturnValue()
      component.dragging = true
      props.uiStore.multiMoveCardIds = [cards[0].id]
      props.uiStore.selectedCardIds = [cards[0].id]
    })

    describe('when moving', () => {
      beforeEach(() => {
        component.onDragOrResizeStop(cardId, 'move')
      })

      it('calls moveCards', () => {
        expect(component.moveCards).toHaveBeenCalledWith(cards[0])
      })
    })

    describe('when resizing', () => {
      beforeEach(() => {
        component.resizing = true
        component.onDragOrResizeStop(cardId, 'resize')
      })

      it('calls resizeCard', () => {
        expect(component.resizeCard).toHaveBeenCalledWith(cards[0])
      })
    })
  })

  describe('onResize', () => {
    let cardId

    beforeEach(() => {
      component.resizing = false
      cardId = cards[0].id
      component.throttledSetResizeSpot = jest.fn().mockReturnValue()
      component.onResize(cardId, { width: 2, height: 1 })
    })

    it('should set resizing to true', () => {
      expect(component.resizing).toBe(true)
    })

    it('should call to set the resize spot with dimensions and position', () => {
      expect(component.throttledSetResizeSpot).toHaveBeenCalledWith({
        row: cards[0].row,
        col: cards[0].col,
        width: 2,
        height: 1,
      })
    })
  })

  describe('resizeCard', () => {
    beforeEach(() => {
      component.placeholderSpot = { width: 2, height: 2 }
    })

    it('calls collection.API_batchUpdateCardsWithUndo', () => {
      component.resizeCard(cards[0])
      expect(
        props.collection.API_batchUpdateCardsWithUndo
      ).toHaveBeenCalledWith({
        updates: [
          {
            card: cards[0],
            width: 2,
            height: 2,
          },
        ],
        undoMessage: 'Card resize undone',
        onConfirm: expect.any(Function),
      })
    })

    it('calls resetCardPositions', () => {
      component.resetCardPositions = jest.fn()
      component.resizeCard(cards[0])
      expect(component.resetCardPositions).toHaveBeenCalled()
    })
  })

  describe('moveCards', () => {
    const card = { id: '1', row: 0, col: 0, record: { internalType: 'items' } }
    const card2 = { ...card, id: '2' }
    describe('when moving a single card', () => {
      beforeEach(() => {
        component.dragGridSpot.set('6,7', { col: 6, row: 7, card })
        component.moveCards(card)
      })

      it('calls collection.API_batchUpdateCardsWithUndo', () => {
        expect(
          props.collection.API_batchUpdateCardsWithUndo
        ).toHaveBeenCalledWith({
          updates: [
            {
              card,
              col: 6,
              row: 7,
            },
          ],
          undoMessage: 'Card move undone',
          onConfirm: expect.any(Function),
          onCancel: expect.any(Function),
        })
      })
    })

    describe('when moving multiple cards', () => {
      beforeEach(() => {
        props.uiStore.multiMoveCardIds = [card.id, card2.id]
        rerender()
        component.dragGridSpot.set('6,7', { col: 6, row: 7, card })
        component.dragGridSpot.set('8,9', { col: 8, row: 9, card: card2 })
        component.draggingMap = [
          { card, row: 6, col: 7 },
          { card: card2, row: 8, col: 9 },
        ]
        component.moveCards(cards[0])
      })

      it('calls collection.API_batchUpdateCardsWithUndo', () => {
        expect(
          props.collection.API_batchUpdateCardsWithUndo
        ).toHaveBeenCalledWith({
          updates: [
            {
              card,
              col: 6,
              row: 7,
            },
            {
              card: card2,
              col: 8,
              row: 9,
            },
          ],
          undoMessage: 'Card move undone',
          onConfirm: expect.any(Function),
          onCancel: expect.any(Function),
        })
      })
    })

    describe('when dragging from MDL', () => {
      beforeEach(() => {
        CardMoveService.moveCards = jest.fn()
        props.uiStore.draggingFromMDL = true
        component.movingCards = [card, card2]
        component.dragGridSpot.set('6,7', { col: 6, row: 7, card })
        component.moveCards(card)
      })

      it('calls CardMoveService with the drag spot row/col', () => {
        expect(CardMoveService.moveCards).toHaveBeenCalledWith(
          {
            col: 6,
            row: 7,
          },
          { collection_card_ids: [] },
          // should pass in card as the "topLeftCard"
          card
        )
      })
    })

    describe('when the MoveSnackbar is open', () => {
      beforeEach(() => {
        props.uiStore.movingCardIds = [card.id, card2.id]
        props.apiStore = fakeApiStore({ findResult: card })
        rerender()
      })

      afterEach(() => {
        props.uiStore.movingCardIds = []
        props.apiStore.find.mockClear()
        CollectionCard.mockClear()
      })

      it('renders the MDL placeholder', () => {
        // 3 collection_cards + 1 MDL
        expect(wrapper.find('MovableGridCard').length).toEqual(4)
        // it creates a new CollectionCard
        expect(CollectionCard).toHaveBeenCalledTimes(1)
        const placeholderId = `${card.id}-mdlPlaceholder`
        expect(props.apiStore.updateModelId).toHaveBeenCalledWith(
          expect.any(Object),
          placeholderId
        )
        expect(wrapper.find('MovableGridCard').get(0).props.card.id).toEqual(
          placeholderId
        )
      })
    })
  })

  describe('calcEdgeCol/Row', () => {
    beforeEach(() => {
      cardA = createCard({ row: 1, col: 1 })
      cardB = createCard({ row: 1, col: 8 })
      cardC = createCard({ row: 1, col: 9 })
      const { collection } = props
      collection.cardMatrix = [[], [], [], []]
      collection.cardMatrix[1][1] = cardA
      collection.cardMatrix[1][8] = cardB
      collection.cardMatrix[1][9] = cardC

      props.collection.collection_cards = [cardA, cardB, cardC]
    })

    afterEach(() => {
      props.collection.cardMatrix = [[], [], [], []]
    })

    describe('with a card that has no cards around it', () => {
      it('should set the max column as the max card width', () => {
        const edgeCol = component.calcEdgeCol(cardA, cardA.id)
        expect(edgeCol).toEqual(4)
      })

      it('sets the max row as the max card height', () => {
        const edgeRow = component.calcEdgeRow(cardA, cardA.id)
        expect(edgeRow).toEqual(2)
      })
    })

    describe('with a card that has horizontal constraints, 2 spaces apart', () => {
      beforeEach(() => {
        cardB.row = 1
        cardB.col = 3
        const { collection } = props
        collection.cardMatrix[1][1] = cardA
        collection.cardMatrix[1][3] = cardB
        collection.cardMatrix[1][9] = cardC
      })

      it('has a maxResizeCol of 2', () => {
        const edgeCol = component.calcEdgeCol(cardA, cardA.id)
        expect(edgeCol).toEqual(2)
      })
    })

    describe('with a card that has vertical constraints, 1 space apart', () => {
      beforeEach(() => {
        cardA.row = 2
        cardB.row = 3
        cardB.col = 1
        const { collection } = props
        collection.cardMatrix[2][1] = cardA
        collection.cardMatrix[3][1] = cardB
        collection.cardMatrix[1][9] = cardC
      })

      it('has maxResizeRow of 1', () => {
        const edgeRow = component.calcEdgeRow(cardA, cardA.id)
        expect(edgeRow).toEqual(1)
      })
    })
  })

  describe('loadAfterScroll', () => {
    beforeEach(() => {
      const { collection, uiStore } = props
      collection.loadedRows = 9
      collection.loadedCols = 9
      component.loadCards = jest.fn()
      // zoomed out one level (this affects visibleRows)
      uiStore.zoomLevel = 2
    })

    describe('scrolling in loaded bounds', () => {
      beforeEach(() => {
        component.visibleCols = { min: 0, max: 4, num: 5 }
        component.visibleRows = { min: 1, max: 4, num: 4 }
      })

      it('does not call loadCards if all in view', () => {
        component.loadAfterScroll()
        expect(component.loadCards).not.toHaveBeenCalled()
      })
    })

    describe('scrolling out of bounds vertically', () => {
      it('calls loadMoreRows', () => {
        component.computeVisibleRows()
        component.loadAfterScroll()
        const minRow = props.collection.loadedRows + 1
        const expectedRows = {
          // ceil needed because visibleRows.num may be fractional
          rows: [minRow, Math.ceil(minRow + component.visibleRows.num + 3)],
        }
        expect(props.loadCollectionCards).toHaveBeenCalledWith(expectedRows)
      })
    })
  })

  describe('updateSelectedArea', () => {
    beforeEach(() => {
      cardA = createCard({ row: 0, col: 1 })
      cardB = createCard({ row: 1, col: 2 })
      cardC = createCard({ row: 3, col: 3 })
      props.collection.collection_cards = [cardA, cardB, cardC]
    })

    describe('selected area not matching any cards', () => {
      beforeEach(() => {
        props.collection.cardIdsWithinRectangle = jest.fn().mockReturnValue([])
        rerender()
        props.uiStore.selectedCardIds = []
        props.selectedArea = { minX: 500, minY: 10, maxX: 550, maxY: 20 }
        // It would be nice if we could use the real Collection class
        // instead of having to mock the return value:
        component.componentDidUpdate(props)
      })

      it('does not set uiStore.selectedCardIds', () => {
        expect(props.uiStore.selectedCardIds).toEqual([])
      })
    })

    describe('selected area matching two cards', () => {
      beforeEach(() => {
        props.selectedArea = { minX: 40, minY: 150, maxX: 550, maxY: 450 }
        // It would be nice if we could use the real Collection class
        // instead of having to mock the return value:
        props.collection.cardIdsWithinRectangle = jest
          .fn()
          .mockReturnValue([cardA.id, cardB.id])
        rerender()
        component.componentDidUpdate(props)
      })

      it('sets uiStore.selectedCardIds', () => {
        expect(props.uiStore.reselectCardIds).toHaveBeenCalledWith([
          cardA.id,
          cardB.id,
        ])
      })
    })
  })

  describe('maxCols', () => {
    describe('on touchDevice', () => {
      beforeEach(() => {
        props.collection.num_columns = 16
        props.uiStore.isTouchDevice = true
        props.uiStore.isMobile = true
        rerender()
      })
      it('should return the minimum of num_columns and 8', () => {
        expect(component.maxCols).toEqual(8)
      })
    })
    describe('on desktop', () => {
      beforeEach(() => {
        props.collection.num_columns = 4
        props.uiStore.isTouchDevice = false
        props.uiStore.isMobile = false
        rerender()
      })
      it('should return the minimum of num_columns and 16', () => {
        expect(component.maxCols).toEqual(4)
      })
    })
  })

  describe('relativeZoomLevel', () => {
    beforeEach(() => {
      props.collection.num_columns = 16
      props.collection.maxZoom = 3
      props.uiStore.zoomLevel = 3
      rerender()
    })
    describe('when zoomed all the way out', () => {
      it('should return the ratio that shows the entire grid by default', () => {
        const maxGridWidth = 5472
        expect(component.maxGridWidth({ zoomLevel: 3 })).toEqual(maxGridWidth)
        expect(component.relativeZoomLevel).toEqual(
          maxGridWidth / jestInnerWidth
        )
      })
    })
    describe('when zoomed in', () => {
      it('should return the zoomLevel', () => {
        props.uiStore.zoomLevel = 2
        expect(component.relativeZoomLevel).toEqual(2)
      })
    })
  })

  describe('handleZoomIn/Out', () => {
    it('should call the respective uiStore function', () => {
      const { uiStore } = props
      component.handleZoomIn()
      expect(uiStore.zoomIn).toHaveBeenCalled()
      component.handleZoomOut()
      expect(uiStore.zoomOut).toHaveBeenCalled()
    })
  })

  describe('showZoomControls', () => {
    beforeEach(() => {
      props.collection.num_columns = 4
      props.collection.isFourWideBoard = true
      rerender()
    })
    it('should return true if the innerWidth < maxGridWidth at zoomLevel 1', () => {
      const maxGridWidth = 1384
      expect(component.maxGridWidth({ zoomLevel: 1 })).toEqual(maxGridWidth)
      expect(maxGridWidth > jestInnerWidth).toEqual(true)
      // 1384 > 1024 so this will be true
      expect(component.showZoomControls).toEqual(true)
    })
  })

  describe('with different board sizes', () => {
    beforeEach(() => {
      props.collection.num_columns = 4
      props.collection.isFourWideBoard = true
      rerender()
    })
    it('should call uiStore.adjustZoomLevel to ensure zoom is correct', () => {
      expect(props.uiStore.adjustZoomLevel).toHaveBeenCalledWith({
        collection: props.collection,
      })
    })
  })
})
