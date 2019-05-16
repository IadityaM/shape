import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import { CONTEXT_COMBO, CONTEXT_USER } from '~/ui/global/MainMenuDropdown'
import Avatar from '~/ui/global/Avatar'
import ClickWrapper from '~/ui/layout/ClickWrapper'
import MainMenuDropdown from '~/ui/global/MainMenuDropdown'
import StyledAvatarAndDropdown from '~/ui/layout/StyledAvatarAndDropdown'

@inject('apiStore', 'uiStore')
@observer
class UserDropdown extends React.Component {
  state = {
    dropdownOpen: false,
  }

  createClickHandler = ({ open }) => () => this.setState({ dropdownOpen: open })

  render() {
    const { dropdownOpen } = this.state
    const { apiStore, uiStore } = this.props
    const { currentUser } = apiStore
    const menuContext = uiStore.isMobile ? CONTEXT_COMBO : CONTEXT_USER

    return (
      <StyledAvatarAndDropdown className="userDropdown">
        {dropdownOpen && (
          <MainMenuDropdown
            context={menuContext}
            open={dropdownOpen}
            onItemClick={this.createClickHandler({ open: false })}
          />
        )}

        <button
          style={{ display: 'block' }}
          className="userBtn"
          onClick={this.createClickHandler({ open: true })}
        >
          <Avatar
            title={currentUser.name}
            url={currentUser.pic_url_square}
            className="user-avatar"
            responsive={false}
          />
        </button>

        {dropdownOpen && (
          <ClickWrapper
            clickHandlers={[this.createClickHandler({ open: false })]}
          />
        )}
      </StyledAvatarAndDropdown>
    )
  }
}

UserDropdown.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default UserDropdown
