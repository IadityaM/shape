import ReactDOMServer from 'react-dom/server'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import v from '~/utils/variables'
import ExpandIcon from '~/ui/icons/ExpandIcon'
import LinkIcon from '~/ui/icons/LinkIcon'
import CommentIcon from '../icons/CommentIcon'
import ReactQuill from 'react-quill'

// see: https://github.com/zenoamaro/react-quill/issues/188#issuecomment-445272662
const icons = ReactQuill.Quill.import('ui/icons')
icons['link'] = () => ReactDOMServer.renderToString(<LinkIcon />)
icons['comment'] = () => ReactDOMServer.renderToString(<CommentIcon />)

const StyledButton = styled.button`
  color: ${v.colors.commonDark};
  &.ql-format-reg {
    font-family: ${v.fonts.sans};
  }
  &.ql-format-title {
    font-family: ${v.fonts.sans};
    font-size: 1.1rem;
    font-weight: bold;
    text-align: center;
  }
`

const IconButton = styled(StyledButton)`
  margin-bottom: 1px;
  margin-left: auto;
  width: 25px !important;
`

const TextItemToolbar = props => (
  <div id="quill-toolbar">
    <span className="ql-formats">
      <StyledButton className="ql-header ql-format-reg" value="">
        b
      </StyledButton>
      <StyledButton
        className="ql-header ql-format-large"
        value="2"
      ></StyledButton>
      <StyledButton
        className="ql-header ql-format-huge"
        value="1"
      ></StyledButton>
      {/* use h5 for title */}
      <StyledButton className="ql-header ql-format-title" value="5">
        T
      </StyledButton>
      {/* quill inserts ql-link SVG */}
      <StyledButton className="ql-link">
        <LinkIcon />
      </StyledButton>

      <StyledButton onClick={props.onComment}>
        <CommentIcon />
      </StyledButton>
      {props.onExpand && (
        <IconButton onClick={props.onExpand} className="ql-expand">
          <ExpandIcon />
        </IconButton>
      )}
    </span>
  </div>
)
TextItemToolbar.propTypes = {
  onExpand: PropTypes.func,
  onComment: PropTypes.func,
}
TextItemToolbar.defaultProps = {
  onExpand: null,
  onComment: null,
}

export default TextItemToolbar
