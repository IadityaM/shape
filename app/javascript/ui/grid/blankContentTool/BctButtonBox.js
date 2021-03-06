import PropTypes from 'prop-types'
import { Box } from 'reflexbox'

import BctButton from '~/ui/global/BctButton'
import Tooltip from '~/ui/global/Tooltip'

const BctButtonBox = ({ type, tooltip, size, creating, onClick, Icon }) => (
  <Box className="BctButtonBox">
    <Tooltip
      classes={{ tooltip: 'Tooltip' }}
      title={tooltip}
      placement="bottom"
    >
      <BctButton
        // easier for cypress if this matches up with quadrant selectors
        data-cy={`HotCellQuadrant-${type}`}
        creating={creating === type}
        onClick={onClick}
        style={{ marginTop: '20px' }}
      >
        <Icon width={size} height={size} color="white" />
      </BctButton>
    </Tooltip>
  </Box>
)

BctButtonBox.propTypes = {
  type: PropTypes.string,
  tooltip: PropTypes.string,
  size: PropTypes.number.isRequired,
  creating: PropTypes.string,
  onClick: PropTypes.func,
  Icon: PropTypes.func.isRequired,
}
BctButtonBox.defaultProps = {
  onClick: () => null,
  tooltip: '',
  creating: '',
  type: '',
}

export default BctButtonBox
