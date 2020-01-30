import { action, observable } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import PropTypes from 'prop-types'
import AutosizeInput from 'react-input-autosize'
import styled from 'styled-components'
import _ from 'lodash'

import v from '~/utils/variables'
import { Heading1, Heading1TypographyCss } from '~/ui/global/styled/typography'
import ClickWrapper from '~/ui/layout/ClickWrapper'

const StyledName = styled.div`
  display: block;
  margin-top: 0;
  vertical-align: top;

  .editable-name-heading {
    margin-bottom: 0;
    padding: 0;
  }
`
StyledName.displayName = 'StyledName'

const StyledEditableName = styled.div`
  display: block;
  .input__name {
    margin-top: ${props => props.editingMarginTop};
    input {
      ${props => props.typographyCss};
      z-index: ${v.zIndex.aboveClickWrapper};
      position: relative;
      background-color: transparent;
      border-left: none;
      border-top: none;
      border-right: none;
      border-bottom: 1px solid ${v.colors.black};
      &:focus {
        outline: 0;
      }
    }
  }
`
StyledEditableName.displayName = 'StyledEditableName'

@inject('uiStore')
@observer
class EditableName extends React.Component {
  @observable
  name = ''

  constructor(props) {
    super(props)
    this.saveName = _.debounce(this._saveName, 1000)
    const { name } = props
    this.setName(name)
  }

  // navigating between collections may trigger this instead of didMount
  componentWillReceiveProps({ name }) {
    this.setName(name)
  }

  componentWillUnmount() {
    const { uiStore, fieldName } = this.props
    uiStore.editingName.remove(fieldName)
  }

  onNameFieldKeypress = e => {
    if (e.key === 'Enter') {
      this.stopEditingName()
    }
  }

  @action
  setName(name) {
    this.name = name
  }

  onNameChange = e => {
    this.setName(e.target.value)
    this.saveName()
  }

  @action
  startEditingName = e => {
    e.stopPropagation()
    const { fieldName, uiStore } = this.props
    if (uiStore.editingName.includes(fieldName)) return
    uiStore.editingName.push(fieldName)
  }

  @action
  stopEditingName = () => {
    // Ensure that save is called if user presses enter
    this.saveName.flush()
    const { fieldName, uiStore } = this.props
    uiStore.editingName.remove(fieldName)
  }

  _saveName = () => {
    this.props.updateNameHandler(this.name)
  }

  truncateName() {
    const { extraWidth, uiStore } = this.props
    if (!this.name) return ''
    // 64 == account for 32px padding x2
    const screenWidth = Math.min(uiStore.windowWidth - 64, v.maxWidth)
    // Estimation of width based on current font size
    const fontSizeMultiplier =
      screenWidth > v.responsive.smallBreakpoint ? 25 : 10
    const marginRightPadding = 30 + (extraWidth || 0)
    let width = this.name.length * fontSizeMultiplier
    // NOTE: this isn't really doing anything yet, but could be used to
    // calculate the "true width" of the H1
    if (this.textRef && this.name === this.truncatedName) {
      width = this.textRef.offsetWidth
    }
    const diff = width - (screenWidth - marginRightPadding)
    const truncateAmount = parseInt(diff / fontSizeMultiplier)
    // check if there is more than 1 letter to truncate
    if (truncateAmount > 1) {
      const mid = parseInt((this.name.length - truncateAmount) / 2)
      const firstPart = this.name.slice(0, mid)
      const secondPart = this.name.slice(mid + truncateAmount, this.name.length)
      this.truncatedName = `${firstPart}…${secondPart}`
      return this.truncatedName
    }
    return this.name
  }

  render() {
    const {
      canEdit,
      fontSize,
      uiStore,
      TypographyComponent,
      typographyCss,
      fieldName,
      editingMarginTop,
    } = this.props
    if (canEdit && uiStore.editingName.includes(fieldName)) {
      const clickHandlers = [() => this.stopEditingName()]
      return (
        <StyledEditableName
          typographyCss={typographyCss}
          className="styled-name"
          fontSize={fontSize}
          editingMarginTop={editingMarginTop}
        >
          <AutosizeInput
            maxLength={v.maxTitleLength}
            className="input__name"
            style={{ fontSize }}
            value={this.name}
            onChange={this.onNameChange}
            onKeyPress={this.onNameFieldKeypress}
            data-cy={`EditableNameInput-${fieldName}`}
          />
          <ClickWrapper clickHandlers={clickHandlers} />
        </StyledEditableName>
      )
    }
    return (
      <StyledName className="styled-name">
        <TypographyComponent
          className="editable-name-heading"
          data-cy={`EditableNameHeading-${fieldName}`}
          ref={ref => {
            this.textRef = ref
          }}
          onClick={canEdit ? this.startEditingName : null}
        >
          {this.truncateName()}
        </TypographyComponent>
      </StyledName>
    )
  }
}

EditableName.propTypes = {
  name: PropTypes.string.isRequired,
  updateNameHandler: PropTypes.func.isRequired,
  canEdit: PropTypes.bool,
  fontSize: PropTypes.number,
  extraWidth: PropTypes.number,
  TypographyComponent: PropTypes.object,
  typographyCss: PropTypes.array,
  fieldName: PropTypes.string,
  editingMarginTop: PropTypes.string,
}

EditableName.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

EditableName.defaultProps = {
  canEdit: false,
  fontSize: 2.25,
  extraWidth: 0,
  editingMarginTop: '0.5rem',
  TypographyComponent: Heading1,
  typographyCss: Heading1TypographyCss,
  fieldName: 'name',
}

EditableName.displayName = 'EditableName'

export default EditableName
