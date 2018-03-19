import Routes from '~/ui/Routes'
import fakeApiStore from '#/mocks/fakeApiStore'

let props, requestResult, apiStore, uiStore, history
beforeEach(() => {
  requestResult = { data: { id: 1 } }
  history = {}
  apiStore = fakeApiStore({
    requestResult
  })
  uiStore = {}
  props = { apiStore, uiStore, history }
  shallow(
    <Routes.wrappedComponent {...props} />
  )
})

describe('Routes', () => {
  it('makes an API call to fetch the user', () => {
    expect(apiStore.request).toBeCalledWith('users/me')
    expect(apiStore.setCurrentUserId).toBeCalledWith(requestResult.data.id)
  })
})
