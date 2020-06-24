import PropTypes from 'prop-types'
import styled from 'styled-components'
import v from '~/utils/variables'
import Icon from './Icon'

export const PinIconHolder = styled.div`
  background-color: ${props => {
    if (props.locked || (!props.locked && !props.pinnedFromMasterTemplate)) {
      return 'transparent'
    } else {
      return v.colors.black
    }
  }};
  border-radius: 50%;
  height: 24px;
  margin-left: 10px;
  margin-bottom: 5px;
  text-align: center;
  width: 24px;
  border: ${props =>
    !props.pinnedFromMasterTemplate && !props.locked
      ? `2px solid ${v.colors.commonMedium}`
      : 'none'};

  .icon {
    height: 25px;
    width: 25px;

    svg {
      margin-right: 1px;
      width: 80%;
    }
  }
`

export const PinnedInnerIcon = () => (
  <Icon fill>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50">
      <path
        d="M39,27.9c-1.5-3.3-4.1-5.9-7.7-7.6l-0.9-10.2c1.9-1.8,2.3-4,2.3-4.5c0-0.5-0.1-0.8-0.5-1.2
      c-0.2-0.2-0.7-0.5-1.2-0.5L18.4,4c-0.5,0-0.8,0.2-1,0.4l-0.2,0.2c-0.3,0.3-0.6,0.9-0.3,1.5c0.3,2,1.5,3.4,2.2,4.1l-0.6,10.4
      c-2.2,1.2-5.7,3.6-7.7,7.7c-0.2,0.6-0.1,1.1,0.1,1.4c0.1,0.2,0.2,0.4,0.4,0.5c0.2,0.2,0.6,0.4,1,0.4l10.9-0.1v13.9
      c0,0.6,0.3,0.9,0.5,1.1C24,45.7,24.5,46,25,46c0.8,0,1.6-0.7,1.6-1.6V30.3l10.9-0.1c0.6,0,1.1-0.2,1.3-0.7c0.2-0.2,0.3-0.5,0.4-0.6
      C39.2,28.7,39.2,28.3,39,27.9z M20.7,23c0.2,0,0.3-0.1,0.5-0.2c0.4-0.2,0.6-0.7,0.6-1.1l0.9-12.1c0-0.6-0.2-1-0.6-1.3l-0.1-0.1
      c0,0-0.4-0.3-0.9-0.9l7.7-0.2c-0.2,0.3-0.5,0.6-0.8,0.9c-0.6,0.3-0.8,0.9-0.7,1.5l1,11.9c0,0.6,0.5,1.3,1.2,1.4
      c0.5,0.2,3.3,1.2,5.3,4L15.4,27c1.8-2.3,4.2-3.6,5.1-4C20.6,23,20.6,23,20.7,23z"
      />
    </svg>
  </Icon>
)

const PinnedIcon = ({ className, locked, pinnedFromMasterTemplate }) => (
  <PinIconHolder
    className={className}
    locked={locked}
    pinnedFromMasterTemplate={pinnedFromMasterTemplate}
    data-cy="PinnedIcon"
  >
    <PinnedInnerIcon />
  </PinIconHolder>
)

PinnedIcon.propTypes = {
  className: PropTypes.string,
  locked: PropTypes.bool,
  pinnedFromMasterTemplate: PropTypes.bool,
}
PinnedIcon.defaultProps = {
  className: '',
  locked: false,
  pinnedFromMasterTemplate: false,
}

export default PinnedIcon
