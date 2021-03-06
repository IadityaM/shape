import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import v from '~/utils/variables'
import { StyledGridCard } from '~/ui/grid/shared'

const StyledAddSubmission = styled(StyledGridCard)`
  background: transparent;
  cursor: auto;
  position: relative;
  text-align: center;
  ${props =>
    props.zoomLevel &&
    `transform: translateZ(0) scale(${1 / props.zoomLevel});`}
`
StyledAddSubmission.displayName = 'StyledAddSubmission'

// width of card is constrained by gridW
// vertical position is adjusted by gridH / 2 if card is 2 rows tall
const StyledGridCardInner = styled.div`
  max-width: ${props => props.gridW}px;
  margin: 0 auto;
  position: relative;
  top: ${props => (props.height > 1 ? props.gridH / 2 : 0)}px;
`
StyledGridCardInner.displayName = 'StyledGridCardInner'

const StyledBlankCreationTool = styled.div`
  padding: 34px 42px;
  position: relative;
`
StyledBlankCreationTool.displayName = 'StyledBlankCreationTool'

const SubmissionButton = styled.button`
  background-color: ${v.colors.primaryDark};
  border-radius: 50%;
  color: white;
  font-size: 42px;
  font-weight: ${v.weights.book};
  height: 47px;
  line-height: 47px;
  margin-top: 34px;
  width: 47px;
  vertical-align: middle;
`
SubmissionButton.displayName = 'SubmissionButton'

@inject('uiStore', 'apiStore')
@observer
class AddSubmission extends React.Component {
  handleSubmission = ev => {
    ev.preventDefault()
    const { parent_id, submissionSettings, apiStore } = this.props
    apiStore.createSubmission(parent_id, submissionSettings)
  }

  renderInner = () => {
    const {
      uiStore,
      submissionSettings: { enabled },
    } = this.props
    const { viewingCollection } = uiStore
    if (!viewingCollection) return ''

    if (!enabled) {
      return (
        <StyledBlankCreationTool>
          <h3>Not accepting new ideas</h3>
          This submission box is now closed. It&apos;s no longer possible to
          submit new ideas.
        </StyledBlankCreationTool>
      )
    }

    return (
      <StyledBlankCreationTool>
        <h3>Create New Submission</h3>
        <SubmissionButton
          disabled={this.loading}
          onClick={this.handleSubmission}
        >
          &#43;
        </SubmissionButton>
      </StyledBlankCreationTool>
    )
  }

  render() {
    const { uiStore, zoomLevel } = this.props
    const { gridSettings, blankContentToolState } = uiStore

    return (
      <StyledAddSubmission zoomLevel={zoomLevel}>
        <StyledGridCardInner
          height={blankContentToolState.height}
          gridW={gridSettings.gridW}
          gridH={gridSettings.gridH}
        >
          {this.renderInner()}
        </StyledGridCardInner>
      </StyledAddSubmission>
    )
  }
}

AddSubmission.propTypes = {
  parent_id: PropTypes.string.isRequired,
  submissionSettings: PropTypes.shape({
    type: PropTypes.string,
    template: MobxPropTypes.objectOrObservableObject,
    enabled: PropTypes.bool,
  }).isRequired,
  zoomLevel: PropTypes.number,
}
AddSubmission.defaultProps = {
  zoomLevel: 1,
}

AddSubmission.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

// give a name to the injected component for unit tests
AddSubmission.displayName = 'AddSubmission'

export default AddSubmission
