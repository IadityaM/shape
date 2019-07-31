import Routes from '~/ui/Routes'
import fakeApiStore from '#/mocks/fakeApiStore'
import fakeUiStore from '#/mocks/fakeUiStore'
import fakeUndoStore from '#/mocks/fakeUndoStore'
import { fakeUser } from '#/mocks/data'

jest.mock('~shared/utils/countryOptions')
jest.mock('firebase/auth')
jest.mock('firebase/app', () => ({
  firestore: jest.fn().mockReturnValue({ settings: jest.fn() }),
  initializeApp: jest.fn(),
  auth: jest.fn().mockReturnValue({
    signInWithCustomToken: jest.fn(),
    onAuthStateChanged: jest.fn(),
  }),
}))

let props, wrapper, requestResult, apiStore, uiStore, routingStore, undoStore
beforeEach(() => {
  requestResult = { data: fakeUser }
  routingStore = { pathContains: jest.fn() }
  apiStore = fakeApiStore({
    requestResult,
  })
  uiStore = fakeUiStore
  undoStore = fakeUndoStore
  props = { apiStore, uiStore, routingStore, undoStore }
})

describe('Routes', () => {
  describe('with terms accepted', () => {
    beforeEach(() => {
      props.apiStore.currentUser.current_org_terms_accepted = true
      wrapper = shallow(<Routes.wrappedComponent {...props} />)
    })
    it('makes an API call to fetch the user', () => {
      expect(apiStore.loadCurrentUser).toHaveBeenCalled()
    })

    it('does not blur the content if terms have been accepted', () => {
      expect(wrapper.find('AppWrapper').props().blur).toBeFalsy()
    })

    it('does not display the TermsOfUseModal', () => {
      expect(wrapper.find('TermsOfUseModal').exists()).toBeFalsy()
    })
  })

  describe('with terms not yet accepted', () => {
    beforeEach(() => {
      requestResult = {
        data: { ...fakeUser, current_org_terms_accepted: false },
      }
      props.apiStore.request = jest
        .fn()
        .mockReturnValue(Promise.resolve(requestResult))
      props.routingStore.pathContains = jest.fn().mockReturnValue(false)
      props.apiStore.currentUser.current_org_terms_accepted = false
      wrapper = shallow(<Routes.wrappedComponent {...props} />)
    })
    it('blurs the content if terms have not been accepted', () => {
      expect(wrapper.find('AppWrapper').props().blur).toBeTruthy()
    })
    it('displays the TermsOfUseModal', () => {
      expect(wrapper.find('TermsOfUseModal').exists()).toBeTruthy()
    })
  })

  describe('if session has not loaded', () => {
    beforeEach(() => {
      props.apiStore.sessionLoaded = false
      wrapper = shallow(<Routes.wrappedComponent {...props} />)
    })

    it('returns loader without app wrapper', () => {
      expect(wrapper.find('AppWrapper').exists()).toEqual(false)
      expect(wrapper.find('Loader').exists()).toEqual(true)
    })
  })
})
