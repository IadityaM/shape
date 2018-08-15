import _ from 'lodash'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import Modal from '~/ui/global/modals/Modal'
import RolesMenu from '~/ui/roles/RolesMenu'

@inject('apiStore', 'uiStore')
@observer
class RolesModal extends React.Component {
  componentDidMount() {
    this.fetchRoles()
  }

  componentDidUpdate() {
    this.fetchRoles()
  }

  fetchRoles() {
    const { apiStore, roles, record } = this.props
    if (!roles.length) {
      apiStore.fetch(record.internalType, record.id)
    }
  }

  handleClose = (ev) => {
    const { uiStore } = this.props
    uiStore.closeRolesMenu()
  }

  onSave = (res) => {
    const { apiStore, record } = this.props
    // TODO why is the API sometimes returning an {} vs [] here?
    let formattedRes = res.data
    if (!_.isArray(res.data)) formattedRes = [res.data]
    apiStore.find(record.internalType, record.id).roles = formattedRes
  }

  render() {
    const { roles, uiStore, record } = this.props
    const title = `Sharing: ${record.name}`

    return (
      <Modal
        title={title}
        onClose={this.handleClose}
        open={!!uiStore.rolesMenuOpen}
      >
        <RolesMenu
          canEdit={record.can_edit}
          ownerId={record.id}
          ownerType={record.internalType}
          title="Shared with"
          roles={roles}
          onSave={this.onSave}
        />
      </Modal>
    )
  }
}

RolesModal.propTypes = {
  record: MobxPropTypes.objectOrObservableObject.isRequired,
  roles: MobxPropTypes.arrayOrObservableArray,
}
RolesModal.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}
RolesModal.defaultProps = {
  roles: [],
}

export default RolesModal