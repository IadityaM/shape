import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import Modal from '~/ui/global/modals/Modal'
import {
  FormButton,
  FieldContainer,
  FormActionsContainer,
  Label,
  TextField,
} from '~/ui/global/styled/forms'
import Audience from '~/stores/jsonApi/Audience'

@inject('apiStore')
@observer
class AddAudienceModal extends React.Component {
  state = {
    name: '',
    valid: false,
  }

  handleNameChange = ev => {
    this.setState({ name: ev.target.value })
    this.validateForm()
  }

  handleSave = async () => {
    const { apiStore, close } = this.props

    const audience = new Audience({ name: this.state.name }, apiStore)
    await audience.API_create()

    close()
    this.setState({ name: '', valid: false })
  }

  validateForm() {
    const valid = this.state.name.length > 0
    this.setState({ valid })
  }

  render() {
    const { open, close } = this.props

    return (
      <Modal title="Create New Audience" onClose={close} open={open} noScroll>
        <FieldContainer>
          <Label htmlFor="audienceName">Audience Name</Label>
          <TextField
            id="audienceName"
            type="text"
            value={this.state.name}
            onChange={this.handleNameChange}
            placeholder={'enter audience name'}
          />
        </FieldContainer>
        <FormActionsContainer style={{ paddingBottom: '32px' }}>
          <FormButton
            onClick={this.handleSave}
            width={190}
            type="submit"
            disabled={!this.state.valid}
          >
            Submit
          </FormButton>
        </FormActionsContainer>
      </Modal>
    )
  }
}

AddAudienceModal.propTypes = {
  open: PropTypes.bool.isRequired,
  close: PropTypes.func.isRequired,
}
AddAudienceModal.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default AddAudienceModal
