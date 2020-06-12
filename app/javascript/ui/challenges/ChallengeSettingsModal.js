import React from 'react'
import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'

import ModalWithNavigation from '~/ui/global/modals/ModalWithNavigation'
import PeopleSettings from '~/ui/challenges/PeopleSettings'
import SubmissionsSettings from '~/ui/challenges/SubmissionsSettings'

class ChallengeSettingsModal extends React.Component {
  get contents() {
    const { collection, onClose } = this.props
    return [
      {
        name: 'Submission settings',
        component: (
          <SubmissionsSettings collection={collection} closeModal={onClose} />
        ),
      },
      { name: 'Phases', component: <div></div> },
      {
        name: 'People',
        component: (
          <PeopleSettings collection={collection} closeModal={onClose} />
        ),
      },
      { name: 'Topics', component: <div></div> },
      { name: 'Styles', component: <div></div> },
    ]
  }

  render() {
    const { open, onClose } = this.props
    return (
      <ModalWithNavigation
        title="Challenge settings"
        contents={this.contents}
        open={open}
        onClose={onClose}
      />
    )
  }
}

ChallengeSettingsModal.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool,
}

ChallengeSettingsModal.defaultProps = {
  open: false,
}

export default ChallengeSettingsModal
