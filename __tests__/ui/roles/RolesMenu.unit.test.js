import { observable } from 'mobx'
import RolesMenu from '~/ui/roles/RolesMenu'
import fakeUiStore from '#/mocks/fakeUiStore'

import { fakeUser, fakeRole, fakeCollection } from '#/mocks/data'

const apiStore = observable({
  request: jest.fn().mockReturnValue(Promise.resolve({ data: [] })),
  searchRoles: jest.fn().mockReturnValue(Promise.resolve({ data: [] })),
  fetchAll: jest.fn(),
  find: jest.fn().mockReturnValue(Promise.resolve({ roles: [] })),
  remove: jest.fn(),
  add: jest.fn(),
  currentUser: fakeUser,
  currentUserOrganizationId: 1,
  uiStore: fakeUiStore,
})

let props

jest.mock('../../../app/javascript/stores/jsonApi/Role')
let wrapper

describe('RolesMenu', () => {
  let component

  beforeEach(() => {
    const routingStore = {
      pathTo: jest.fn(),
      routeTo: jest.fn(),
    }
    const record = {
      ...fakeCollection,
      roles: [{ pendingCount: 0, activeCount: 0, users: [] }],
    }
    props = {
      record,
      ownerId: 1,
      ownerType: 'collections',
      apiStore,
      routingStore,
      canEdit: false,
    }
    apiStore.searchRoles.mockClear()
    wrapper = shallow(<RolesMenu.wrappedComponent {...props} />)
    component = wrapper.instance()
  })

  describe('deleteRoles', () => {
    const role = fakeRole
    const user = { id: 4, internalType: 'users' }
    const res = { data: [] }

    beforeEach(async () => {
      apiStore.request.mockReturnValue(Promise.resolve(res))
      await component.deleteRoles(role, user, { isSwitching: true })
    })

    describe('when switching a role', () => {
      it('should make a call to delete role with the correct data', () => {
        const { ownerId, ownerType } = props
        expect(role.API_delete).toHaveBeenCalledWith(user, ownerId, ownerType, {
          isSwitching: true,
        })
      })
    })

    describe('when is not switching', () => {
      const fakeData = {}
      beforeEach(async () => {
        component.filterSearchableItems = jest.fn()
        role.API_delete.mockReturnValue = Promise.resolve(fakeData)
        await component.deleteRoles(role, user, { isSwitching: false })
      })

      it('should call apiStore.searchRoles after the request is done', () => {
        expect(apiStore.searchRoles).toHaveBeenCalled()
      })
    })
  })

  describe('createRoles', () => {
    describe('with users', () => {
      let users
      let opts

      beforeEach(async () => {
        users = [
          { id: 3, internalType: 'users' },
          { id: 5, internalType: 'users' },
        ]
        opts = { isSwitching: true }
        apiStore.request.mockReturnValue(Promise.resolve({ data: [] }))
        apiStore.fetchAll.mockReturnValue(Promise.resolve({ data: [] }))
        component.filterSearchableItems = jest.fn()
        await component.createRoles(users, 'editor', opts)
      })

      it('should send a request to create roles with role and user ids', () => {
        expect(apiStore.request).toHaveBeenCalledWith(
          'collections/1/roles',
          'POST',
          {
            role: { name: 'editor' },
            user_ids: [3, 5],
            group_ids: [],
            is_switching: true,
          }
        )
      })

      it('should call apiStore.searchRoles after the request is done', () => {
        expect(apiStore.searchRoles).toHaveBeenCalled()
      })

      describe('when not switching roles', () => {
        beforeEach(async () => {
          opts.isSwitching = false
          apiStore.request.mockClear()
          await component.createRoles(users, 'editor', opts)
        })

        it('should pass is switching as false', () => {
          expect(apiStore.request.mock.calls[0][2].is_switching).toBeFalsy()
        })
      })
    })
  })

  describe('notCurrentUser', () => {
    describe('on a role that belongs to the current user', () => {
      it('should return false', () => {
        apiStore.currentUser.id = 3
        const user = { id: 3 }
        expect(component.notCurrentUser(user)).toBeFalsy()
      })
    })

    describe('on a role that belongs to another user', () => {
      it('should return true', () => {
        apiStore.currentUser.id = 4
        const user = { id: 3 }
        expect(component.notCurrentUser(user)).toBeTruthy()
      })
    })
  })

  it('if not editor, does not show viewable by anyone toggle', () => {
    expect(props.canEdit).toEqual(false)
    expect(
      wrapper.find('[data-cy="viewable-by-anyone-checkbox"]').exists()
    ).toEqual(false)
  })

  describe('handleViewableByAnyoneToggle when anyone_can_view is false', () => {
    beforeEach(() => {
      props.record.anyone_can_view = false
      props.apiStore.uiStore.confirm.mockClear()
      props.canEdit = true
      wrapper = shallow(<RolesMenu.wrappedComponent {...props} />)
    })

    it('defaults to show no one can view', () => {
      expect(
        wrapper
          .find('[data-cy="viewable-by-anyone-checkbox"]')
          .first()
          .props().control.props.checked
      ).toEqual(false)
    })

    it('toggles anyone_can_view', () => {
      wrapper.instance().handleViewableByAnyoneToggle()

      expect(props.apiStore.uiStore.confirm).toHaveBeenCalledWith({
        prompt:
          'This content will be available to anyone with this link. Are you sure you want to share this content?',
        iconName: 'Alert',
        confirmText: 'Continue',
        onConfirm: expect.any(Function),
      })
    })
  })

  describe('handleViewableByAnyoneToggle when anyone_can_view is true', () => {
    beforeEach(() => {
      props.record.anyone_can_view = true
      props.apiStore.uiStore.confirm.mockClear()
      props.canEdit = true
      wrapper = shallow(<RolesMenu.wrappedComponent {...props} />)
    })

    it('has checked checkbox', () => {
      expect(
        wrapper
          .find('[data-cy="viewable-by-anyone-checkbox"]')
          .first()
          .props().control.props.checked
      ).toEqual(true)
    })

    it('toggles anyone_can_view without confirmation', () => {
      wrapper.instance().handleViewableByAnyoneToggle()
      expect(props.apiStore.uiStore.confirm).not.toHaveBeenCalled()
      expect(props.record.save).toHaveBeenCalled()
    })

    it('enables clicking to copy link', () => {
      wrapper.find('ViewableByAnyoneLink').simulate('click')
      expect(props.apiStore.uiStore.popupSnackbar).toHaveBeenCalledWith({
        message: 'Link Copied',
      })
    })
  })
})
