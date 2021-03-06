import { observable } from "mobx"

const fakeUiStore = {
  gridSettings: {
    cols: 4,
    gutter: 20,
    gridW: 312,
    gridH: 250,
  },
  defaultGridSettings: {
    cols: 4,
    gutter: 20,
    gridW: 312,
    gridH: 250,
  },
  blankContentToolState: {
    order: null,
    width: null,
    height: null,
    replacingId: null,
    placeholderCard: null,
  },
  dialogConfig: {
    open: null,
    prompt: null,
    onConfirm: null,
    onCancel: null,
    iconName: null,
    confirmText: 'OK',
    cancelText: 'Cancel',
    onClose: jest.fn(),
  },
  activityLogOpen: false,
  activityLogPosition: {
    x: 0,
    y: 0,
    h: 1,
    w: 1,
  },
  activityLogMoving: false,
  cardMenuOpen: {
    id: false,
    x: 0,
    y: 0,
    offsetX: 0,
    offsetY: 0,
  },
  selectedArea: { minX: null, maxX: null, minY: null, maxY: null },
  openBlankContentTool: jest.fn(),
  closeBlankContentTool: jest.fn(),
  setBctPlaceholderCard: jest.fn(),
  closeCardMenu: jest.fn(),
  openCardMenu: jest.fn(),
  closeMoveMenu: jest.fn(),
  resetSelectionAndBCT: jest.fn(),
  rolesMenuOpen: false,
  isLoading: false,
  dismissedMoveHelper: false,
  selectedAreaEnabled: false,
  setSelectedArea: jest.fn(),
  selectedCardIds: [],
  selectCardId: jest.fn(),
  deselectCards: jest.fn(),
  setViewingRecord: jest.fn(),
  viewingCollection: null,
  isViewingHomepage: false,
  viewingItem: null,
  movingFromCollectionId: null,
  movingCardIds: [],
  openMoveMenu: jest.fn(),
  update: jest.fn(),
  alert: jest.fn(),
  alertOk: jest.fn(),
  defaultAlertError: jest.fn(),
  confirm: jest.fn(),
  closeDialog: jest.fn(),
  cardAction: 'move',
  blurContent: false,
  organizationMenuPage: 'organizationMenuPage',
  organizationMenuGroupId: null,
  organizationMenuOpen: false,
  expandedThreadKey: null,
  zoomLevel: 1,
  expandThread: jest.fn(),
  openGroup: jest.fn(),
  openOptionalMenus: jest.fn(),
  trackEvent: jest.fn(),
  trackedRecords: {},
  editingName: observable([]),
  activityLogPage: 'comments',
  pageMenuOpen: false,
  searchText: '',
  collectionCardSortOrder: '',
  addNewCard: jest.fn(),
  removeNewCard: jest.fn(),
  isNewCard: jest.fn(),
  autocompleteMenuClosed: jest.fn(),
  captureKeyboardGridClick: jest.fn(),
  popupAlert: jest.fn(),
  stopDragging: jest.fn(),
  multiMoveCardIds: [],
  setSnoozeChecked: jest.fn(),
  scrollToTop: jest.fn(),
  scrollToBottom: jest.fn(),
  scrollToBottomOfComments: jest.fn(),
  scrollToBottomOfModal: jest.fn(),
  popupSnackbar: jest.fn(),
  showPermissionsAlert: jest.fn(),
  gridHeightFor: jest.fn().mockReturnValue(250),
  performActionAfterRoute: jest.fn(),
  linkedBreadcrumbTrailForRecord: jest
    .fn()
    .mockImplementation(x => x.breadcrumb),
  addEmptySpaceClickHandler: jest.fn(),
  removeEmptySpaceClickHandler: jest.fn(),
  setEditingCardCover: jest.fn(),
  adminAudienceMenuOpen: false,
  actionMenuOpenForCard: jest.fn(true).mockImplementation(x => false),
  textMenuOpenForCard: jest.fn(true).mockImplementation(x => false),
  replyingToCommentId: false,
  setReplyingToComment: jest.fn(),
  setCommentingOnRecord: jest.fn(),
  setActivityLogPage: jest.fn(),
  setBodyBackgroundImage: jest.fn(),
  setBodyFontColor: jest.fn(),
  selectedTextRangeForCard: jest.fn(),
  reselectCardIds: jest.fn(),
  reselectOnlyEditableRecords: jest.fn(),
  reselectOnlyMovableCards: jest.fn(),
  reselectWithoutPlaceholders: jest.fn(),
  setMovingCards: jest.fn(),
  setVisibleRows: jest.fn(),
  setResizeSpot: jest.fn(),
  setDroppingFilesCount: jest.fn(),
  drag: jest.fn(),
  startDragging: jest.fn(),
  adjustZoomLevel: jest.fn(),
  zoomIn: jest.fn(),
  zoomOut: jest.fn(),
  determineZoomLevels: jest.fn(),
  maxCols: jest.fn(),
  maxGridWidth: jest.fn().mockReturnValue(1384),
  pageMargins: jest.fn().mockReturnValue({ left: 100, top: 50 }),
  openTextEditingItem: jest.fn(),
  relativeZoomLevel: 2,
  zoomLevels: [],
  isSelected: jest.fn(),
  toggleSelectedCardId: jest.fn(),
  openContextMenu: jest.fn(),
  clearTextEditingCard: jest.fn(),
  clearTempTextCardItems: jest.fn(),
  setTextEditingCard: jest.fn(),
  positionForCoordinates: jest.fn().mockReturnValue({ x:0, y:0, xPos: 0, yPos: 0, width: 1, height: 1 }),
  coordinatesForPosition: jest.fn().mockReturnValue({ row: 0, col: 0 }),
  dragGridSpot: new Map(),
  droppingFilesCount: 0,
  foamcoreBoundingRectangle: {
    left: 0,
    top: 0,
  }
}

export default fakeUiStore
