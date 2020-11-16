// eslint-disable-next-line no-unused-vars
import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import Loader from '~/ui/layout/Loader'
import v from '~/utils/variables'

const StyledFlex = styled.div`
  background: ${props =>
    props.background === 'commonDark' ? 'rgba(255, 255, 255, 0.5)' : 'none'};
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  left: 0;
  position: ${props => (props.fixed ? 'fixed' : 'absolute')};
  top: 0;
  width: 100%;
  z-index: ${v.zIndex.gridCard};
`

const InlineLoader = ({ fixed, background, animation }) => (
  <StyledFlex fixed={fixed} background={background}>
    <Loader fadeIn="half" animation={animation} height="30px" size={30} />
  </StyledFlex>
)
InlineLoader.displayName = 'InlineLoader'

InlineLoader.propTypes = {
  fixed: PropTypes.bool,
  background: PropTypes.string,
  animation: PropTypes.string,
}
InlineLoader.defaultProps = {
  fixed: false,
  background: 'commonDark',
  animation: 'circular',
}

export default InlineLoader
