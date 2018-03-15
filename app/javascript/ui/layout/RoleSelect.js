import PropTypes from 'prop-types'
import styled from 'styled-components'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import { withStyles } from 'material-ui/styles'
import { MenuItem } from 'material-ui/Menu'
import Select from 'material-ui/Select'
import v from '~/utils/variables'
import UserAvatar from './UserAvatar'

const materialStyles = {
  root: {
    fontFamily: 'Gotham',
    fontSize: '16px',
    fontWeight: 300,
  },
  selectMenu: {
    backgroundColor: 'transparent',
    '&:focus': { backgroundColor: 'transparent' },
    '&:hover': { backgroundColor: 'transparent' },
  }
}

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  width: 92%;
`
Row.displayName = 'Row'

const RowItemLeft = styled.span`
  margin-right: auto;
  margin-left: 14px;
`

const StyledText = styled.span`
  font-weight: 300;
  font-family: Gotham;
  font-size: 16px
`
StyledText.displayName = 'StyledText'

const StyledSmText = styled.span`
  vertical-align: super;
  font-family: Sentinel;
  font-size: 12px;
  color: ${v.colors.gray};
`
StyledSmText.displayName = 'StyledSmText'

class RoleSelect extends React.Component {
  onRoleSelect = (ev) => {
    ev.preventDefault()
    this.deleteRole().then(this.createRole(ev.target.value))
  }

  createRole(roleName) {
    const { onCreate, role } = this.props
    // TODO id here is strangely not used in the role data to create the role,
    // it's used to remove the old role from the client side. Maybe it should
    // be a second param
    const roleData = Object.assign({}, {
      name: roleName,
      users: role.users.map((user) => { return { id: user.id }})
    })
    onCreate(roleData, role.id)
  }

  deleteRole = () => {
    const { role, user } = this.props
    return this.props.onDelete(role, user)
  }

  render() {
    const { classes, role, user } = this.props
    return (
      <Row>
        <span>
          <UserAvatar
            key={user.id}
            user={user}
            size={38}
          />
        </span>
        <RowItemLeft>
          <StyledText>{user.name}</StyledText><br />
          <StyledSmText>{user.email}</StyledSmText>
        </RowItemLeft>
        <span>
          <Select
            classes={classes}
            displayEmpty
            disableUnderline
            name="role"
            onChange={this.onRoleSelect}
            value={role.name}
          >
            <MenuItem value="editor">Editor</MenuItem>
            <MenuItem value="viewer">Viewer</MenuItem>
          </Select>
        </span>
      </Row>
    )
  }
}

RoleSelect.propTypes = {
  role: MobxPropTypes.objectOrObservableObject.isRequired,
  user: MobxPropTypes.objectOrObservableObject.isRequired,
  onDelete: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
  classes: PropTypes.shape({
    paper: PropTypes.string,
  }).isRequired,
}

export default withStyles(materialStyles)(RoleSelect)
