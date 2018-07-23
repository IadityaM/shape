import PropTypes from 'prop-types'
import mime from 'mime-types'
import styled from 'styled-components'

import PptSvg from '~/ui/icons/files/ppt.svg'
import DocSvg from '~/ui/icons/files/doc.svg'
import AiSvg from '~/ui/icons/files/ai.svg'
import PsSvg from '~/ui/icons/files/ps.svg'
import SketchSvg from '~/ui/icons/files/sketch.svg'
import XlsSvg from '~/ui/icons/files/xls.svg'
import FileSvg from '~/ui/icons/files/file.svg'
import PdfSvg from '~/ui/icons/files/pdf.svg'
import v from '~/utils/variables'

const IconHolder = styled.div`
  background-color: ${v.colors.cararra};
  border-radius: 50%;
  box-sizing: content-box;
  color: black;
  height: 18px;
  margin-right: 22px;
  padding: 7px;
  width: 18px;
`

class FileIcon extends React.PureComponent {
  get svg() {
    const { mimeType } = this.props
    const ext = mime.extension(mimeType)

    switch (ext) {
    case 'pdf':
      return <PdfSvg />
    case 'ppt':
      return <PptSvg />
    case 'doc':
    case 'docx':
      return <DocSvg />
    case 'xls':
    case 'xlsx':
      return <XlsSvg />
    case 'sketch':
      return <SketchSvg />
    case 'ai':
      return <AiSvg />
    case 'ps':
      return <PsSvg />
    default:
      return <FileSvg />
    }
  }

  render() {
    return (
      <IconHolder>{this.svg}</IconHolder>
    )
  }
}
FileIcon.propTypes = {
  mimeType: PropTypes.string.isRequired,
}

export default FileIcon