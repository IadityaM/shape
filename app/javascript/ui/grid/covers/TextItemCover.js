import _ from 'lodash'
import PropTypes from 'prop-types'
import ReactDOM from 'react-dom'
import { computed } from 'mobx'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import ReactQuill from 'react-quill'
import styled from 'styled-components'

import { apiStore, routingStore, uiStore } from '~/stores'
import v from '~/utils/variables'
import { ShowMoreButton } from '~/ui/global/styled/forms'
import { QuillStyleWrapper } from '~/ui/global/styled/typography'
import InlineLoader from '~/ui/layout/InlineLoader'
import RealtimeTextItem from '~/ui/items/RealtimeTextItem'
import PaddedCardCover from '~/ui/grid/covers/PaddedCardCover'
const stripTags = str => str.replace(/(<([^>]+)>)/gi, '')

const StyledPaddedCover = styled(PaddedCardCover)`
  border-top: ${props =>
    !props.isEditing && props.hasTitleText ? '2px solid black' : 'none'};
  background: ${props => {
    const { hasTitleText, isTransparent, uneditable } = props
    if (hasTitleText && uneditable) {
      // for carousel covers w/ title text
      return `${v.colors.white}`
    }
    if (isTransparent || hasTitleText) {
      return `${v.colors.transparent}`
    }
    return `${v.colors.white}`
  }};
`

const StyledReadMore = styled(ShowMoreButton)`
  z-index: ${v.zIndex.gridCard};
  position: absolute;
  bottom: 0;
  left: 0;
  padding: 0.5rem;
  opacity: 0.975;
  background: ${props =>
    !props.isEditing && props.hasTitleText
      ? v.colors.transparent
      : v.colors.white};

  &:hover {
    background: ${v.colors.commonLightest};
  }
`
StyledReadMore.displayName = 'StyledReadMore'

@observer
class TextItemCover extends React.Component {
  constructor(props) {
    super(props)
    this.unmounted = false
  }

  state = {
    item: null,
    readMore: false,
    loading: false,
  }

  componentDidMount() {
    const { height, item } = this.props
    this.checkTextAreaHeight(height)
    this.setState({ item })
  }

  componentWillReceiveProps({ height }) {
    this.checkTextAreaHeight(height)
  }

  componentWillUnmount() {
    this.unmounted = true
  }

  @computed
  get isEditing() {
    const { item } = this.props
    return uiStore.textEditingItem === item
  }

  handleClick = async e => {
    if (this.props.handleClick) this.props.handleClick(e)
    e.stopPropagation()
    const { item, dragging, cardId, searchResult, uneditable } = this.props
    if (dragging || uiStore.dragging || this.isEditing || uneditable)
      return false
    // allow both editors/viewers to capture keyboard clicks
    if (uiStore.captureKeyboardGridClick(e, cardId)) {
      return false
    }

    if (!item.can_view) {
      uiStore.showPermissionsAlert()
      return false
    } else if (!item.can_edit_content || searchResult) {
      // if a viewer, there's nothing to do on the generic click action
      // likewise on search results, never pop open the inline editor
      return false
    }
    await apiStore.fetch('items', item.id, true)
    // entering edit mode should deselect all cards
    uiStore.deselectCards()
    uiStore.update('textEditingItem', this.state.item)
    return null
  }

  expand = () => {
    const { item } = this.props
    routingStore.routeTo('items', item.id)
  }

  clearTextEditingItem = () => {
    const { item } = this.state
    if (uiStore.textEditingItem && uiStore.textEditingItem.id === item.id) {
      uiStore.update('textEditingItem', null)
    }
  }

  // cancel should only ever be called for editors, since it is canceling out of edit view
  cancel = ({ item, ev } = {}) => {
    if (this.unmounted) {
      return
    }
    if (ev && ev.stopPropagation) ev.stopPropagation()
    this.clearTextEditingItem()
    const hasContent = stripTags(item.content).length
    if (!hasContent && !item.version) {
      // archive empty text item when you hit "X"
      const card = apiStore.find('collection_cards', this.props.cardId)
      card.API_archiveSelf({ undoable: false })
      return
    }
    // TODO figure out why ref wasn't working
    // eslint-disable-next-line react/no-find-dom-node
    try {
      const node = ReactDOM.findDOMNode(this)
      node.scrollTop = 0
    } catch {
      // console.warn('probably in jest test')
    }
  }

  checkTextAreaHeight = height => {
    if (!this.reactQuillRef) return
    if (this.props.hideReadMore) return
    // The height of the editor is constrained to the container,
    // we must get the .ql-editor div to calculate text height
    const qlEditor = this.reactQuillRef.editingArea.getElementsByClassName(
      'ql-editor'
    )[0]
    const textAreaHeight = qlEditor ? qlEditor.scrollHeight : 0
    // render the Read More link if the text height exceeds viewable area
    if (height && textAreaHeight > height) {
      this.setState({ readMore: true })
    } else {
      this.setState({ readMore: false })
    }
  }

  get quillEditor() {
    const { reactQuillRef } = this
    if (!reactQuillRef) return

    return reactQuillRef.getEditor()
  }

  renderEditing() {
    const { item } = this.state
    const { initialFontTag, cardId } = this.props
    if (!item) return ''

    return (
      <RealtimeTextItem
        cardId={cardId}
        item={item}
        currentUserId={apiStore.currentUser.id}
        onExpand={item.id ? this.expand : null}
        onCancel={this.cancel}
        initialFontTag={initialFontTag}
        // if we are rendering editing then the item has been fetched
        fullyLoaded
      />
    )
  }

  renderDefault() {
    const { item, cardId } = this.props
    const textData = item.toJSON().quill_data
    const quillProps = {
      // ref is used to get the height of the div in checkTextAreaHeight
      ref: c => {
        this.reactQuillRef = c
      },
      readOnly: true,
      onChangeSelection: (range, source, editor) => {
        const { quillEditor } = this
        uiStore.selectTextRangeForCard({
          range,
          quillEditor,
          cardId,
        })
      },
      theme: null,
    }

    return <ReactQuill {...quillProps} value={textData} />
  }

  get hasTitleText() {
    const { props } = this
    const { item } = props
    const { quill_data } = item
    let hasTitle = false
    _.each(quill_data.ops, op => {
      if (op.attributes && op.attributes.header === 5) {
        hasTitle = true
      }
    })
    return hasTitle
  }

  render() {
    const { isEditing, hasTitleText, props } = this
    const { isTransparent, uneditable } = props
    const content = isEditing ? this.renderEditing() : this.renderDefault()

    return (
      <StyledPaddedCover
        data-cy="TextItemCover"
        style={{
          // account for padding: 1rem on both sides
          height: 'calc(100% - 2rem)',
        }}
        className="cancelGridClick"
        onClick={this.handleClick}
        hasTitleText={hasTitleText}
        isTransparent={isTransparent}
        uneditable={uneditable}
      >
        <QuillStyleWrapper
          notEditing={!isEditing}
          smallGrid={uiStore.isSmallGrid}
        >
          {this.state.loading && <InlineLoader />}
          {content}
          {this.state.readMore && !isEditing && (
            <StyledReadMore
              onClick={this.expand}
              isEditing={isEditing}
              hasTitleText={hasTitleText}
            >
              Read more...
            </StyledReadMore>
          )}
        </QuillStyleWrapper>
      </StyledPaddedCover>
    )
  }
}

TextItemCover.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
  dragging: PropTypes.bool.isRequired,
  cardId: PropTypes.string.isRequired,
  handleClick: PropTypes.func.isRequired,
  initialFontTag: PropTypes.string.isRequired,
  height: PropTypes.number,
  searchResult: PropTypes.bool,
  hideReadMore: PropTypes.bool,
  uneditable: PropTypes.bool,
  isTransparent: PropTypes.bool,
}

TextItemCover.defaultProps = {
  height: null,
  searchResult: false,
  hideReadMore: false,
  uneditable: false,
  isTransparent: false,
  handleClick: null,
}

export default TextItemCover
