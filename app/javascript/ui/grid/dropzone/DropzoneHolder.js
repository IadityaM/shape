import v from '~/utils/variables'
import styled from 'styled-components'
import PropTypes from 'prop-types'

import FilestackUpload from '~/utils/FilestackUpload'
import { DisplayText } from '~/ui/global/styled/typography'
import CloudIcon from '~/ui/icons/CloudIcon'
import IconHolder from '~/ui/icons/IconHolder'

const StyledDropzoneHolder = styled.div`
  width: 100%;
  height: 100%;
  background-color: ${v.colors.primaryLight};

  /* Override Filestack styling */
  .fsp-drop-pane__container {
    height: 100%;
    z-index: ${v.zIndex.gridCardBg + 1};
    /* must be transparent -- dropzone is transparent and content behind it is visible */
    background: ${v.colors.transparent};
    border: none;
    padding: 0px;
  }
`

StyledDropzoneHolder.displayName = 'DropzoneHolder'

const StyledIconAndHeadingHolder = styled(IconHolder)`
  width: 30%;
  height: auto;
  position: absolute;
  top: 20%;
  left: 35%;
  color: ${v.colors.secondaryMedium};
  pointer-events: none;
`

class DropzoneHolder extends React.Component {
  constructor(props) {
    super(props)
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.willUpload && this.props.willUpload) {
      this.createDropPane()
    }
  }

  handleDragLeave = e => {
    this.props.handleDragLeave()
  }

  handleDrop = e => {
    this.props.handleDrop(e)
  }

  handleSuccess = async res => {
    if (res.length > 0) {
      const files = await FilestackUpload.processFiles(res)
      this.props.handleAfterSuccess(files)
    }
  }

  createDropPane = () => {
    const uploadOpts = {}

    // CSS selector where the dropzone will be
    const container = 'dropzone'
    const dropPaneOpts = {
      onDragLeave: this.handleDragLeave,
      onDrop: this.handleDrop,
      onProgress: this.handleProgress,
      onSuccess: this.handleSuccess,
    }
    FilestackUpload.makeDropPane(container, dropPaneOpts, uploadOpts)
  }

  render() {
    const { willUpload, didUpload } = this.props
    const id = willUpload || didUpload ? 'dropzone' : ''
    return (
      <StyledDropzoneHolder id={id}>
        {(willUpload || didUpload) && (
          <StyledIconAndHeadingHolder display={'inline-block'}>
            <CloudIcon />
            <DisplayText fontSize={'.75em'} textTransform="uppercase">
              Drag & Drop
            </DisplayText>
          </StyledIconAndHeadingHolder>
        )}
      </StyledDropzoneHolder>
    )
  }
}

DropzoneHolder.propTypes = {
  handleDragLeave: PropTypes.func.isRequired,
  handleDrop: PropTypes.func.isRequired,
  handleAfterSuccess: PropTypes.func.isRequired,
  willUpload: PropTypes.bool.isRequired,
  didUpload: PropTypes.bool.isRequired,
}

export default DropzoneHolder