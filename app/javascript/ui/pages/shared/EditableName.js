import PropTypes from 'prop-types'
import AutosizeInput from 'react-input-autosize'
import styled from 'styled-components'
import _ from 'lodash'

import v from '~/utils/variables'
import { Heading1 } from '~/ui/global/styled/typography'
import ClickWrapper from '~/ui/layout/ClickWrapper'

const StyledName = styled.div`
  h1 {
    overflow: hidden;
    text-overflow: ellipsis;
  }
`
StyledName.displayName = 'StyledName'

const StyledEditableName = styled.div`
  display: inline-block;
  .input__name {
    width: 30vw;
    margin-bottom: 0.5rem;
    margin-top: 0.5rem;
    input {
      z-index: ${v.zIndex.aboveClickWrapper};
      position: relative;
      font-size: 2.25rem;
      font-family: ${v.fonts.sans};
      font-weight: ${v.weights.medium};
      letter-spacing: 0.125rem;
      padding: 0.15rem 0 0.5rem 0;
      background-color: transparent;
      border-left: none;
      border-top: none;
      border-right: none;
      border-bottom: 1px solid ${v.colors.blackLava};
      &:focus {
        outline: 0;
      }
    }
  }
`
StyledEditableName.displayName = 'StyledEditableName'

class EditableName extends React.Component {
  constructor(props) {
    super(props)
    this.saveName = _.debounce(this._saveName, 1000)
    this.state = {
      name: props.name,
      editing: props.editing,
    }
  }

  onNameFieldKeypress = (e) => {
    if (e.key === 'Enter') {
      this.stopEditingName()
    }
  }

  onNameChange = (e) => {
    const name = e.target.value
    this.setState({ name }, () => this.saveName())
  }

  startEditingName = (e) => {
    e.stopPropagation()
    this.setState({ editing: true })
  }

  stopEditingName = () => {
    // Ensure that save is called if user presses enter
    this.saveName.flush()
    this.setState({ editing: false })
  }

  _saveName = () => {
    const { updateNameHandler } = this.props
    const { name } = this.state
    updateNameHandler(name)
  }

  render() {
    const { canEdit } = this.props
    const { name, editing } = this.state
    if (canEdit && editing) {
      const clickHandlers = [
        () => this.stopEditingName()
      ]
      return (
        <StyledEditableName>
          <AutosizeInput
            maxLength={40}
            className="input__name"
            style={{ fontSize: '2.25rem' }}
            value={name}
            onChange={this.onNameChange}
            onKeyPress={this.onNameFieldKeypress}
          />
          <ClickWrapper clickHandlers={clickHandlers} />
        </StyledEditableName>
      )
    }
    return (
      <StyledName>
        <Heading1
          onClick={canEdit ? this.startEditingName : null}
        >
          {name}
        </Heading1>
      </StyledName>
    )
  }
}

EditableName.propTypes = {
  name: PropTypes.string.isRequired,
  updateNameHandler: PropTypes.func.isRequired,
  editing: PropTypes.bool,
  canEdit: PropTypes.bool,
}

EditableName.defaultProps = {
  editing: false,
  canEdit: false
}

export default EditableName
