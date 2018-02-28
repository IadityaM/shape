import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import ReactQuill from 'react-quill'
import styled from 'styled-components'

import StyledCover from './StyledCover'

const StyledReadMore = styled.div`
  position: absolute;
  bottom: 0;
  width: 100%;
  text-align: center;
  padding: 0.5rem;
  opacity: 0.95;
  background: white;
  font-size: 0.9rem;

  &:hover {
    background: #f1f1f1;
  }
`

class TextItemCover extends React.Component {
  state = {
    readMore: false
  }

  componentDidMount() {
    if (!this.quillEditor) return
    const { height } = this.props
    const h = this.quillEditor.getEditingArea().offsetHeight
    if (height && h > height) {
      this.setState({ readMore: true })
    }
  }

  render() {
    const { item } = this.props
    // we have to convert the item to a normal JS object for Quill to be happy
    const textData = item.toJS().text_data
    const quillProps = {
      // ref is used to get the height of the div in componentDidMount
      ref: c => { this.quillEditor = c },
      readOnly: true,
      theme: null,
    }

    return (
      <div>
        <StyledCover>
          <ReactQuill
            {...quillProps}
            value={textData}
          />
        </StyledCover>
        {/* readMore is a sibling to the cover itself */}
        { this.state.readMore && <StyledReadMore>read more...</StyledReadMore> }
      </div>
    )
  }
}

TextItemCover.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
  height: PropTypes.number,
}

TextItemCover.defaultProps = {
  height: null,
}

export default TextItemCover
