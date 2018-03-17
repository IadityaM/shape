import _ from 'lodash'

import RolesSummary from '~/ui/layout/RolesSummary'

import {
  fakeRole,
  fakeUser,
} from '#/mocks/data'

const emptyProps = {
  editors: [],
  viewers: [],
  handleClick: jest.fn()
}

const editorsAndViewersProps = {
  editors: [fakeRole, fakeRole],
  viewers: [fakeRole, fakeRole],
  handleClick: jest.fn()
}

const tooManyEditorsProps = _.merge({}, editorsAndViewersProps, {
  editors: [fakeRole, fakeRole, fakeRole, fakeRole, fakeRole, fakeRole]
})

const onlyViewersProps = _.merge({}, emptyProps, { viewers: [fakeRole, fakeRole] })

const onlyEditorsProps = _.merge({}, emptyProps, { editors: [fakeRole, fakeRole] })

let wrapper
describe('RolesSummary', () => {
  describe('with editors and viewers', () => {
    beforeEach(() => {
      wrapper = shallow(
        <RolesSummary {...editorsAndViewersProps} />
      )
    })

    it('renders editors', () => {
      expect(wrapper.render().text()).toMatch(/editors/i)
      expect(wrapper.find('[className="editor"]').length).toEqual(2)
    })

    it('renders viewers', () => {
      expect(wrapper.render().text()).toMatch(/viewers/i)
      expect(wrapper.find('[className="viewer"]').length).toEqual(2)
    })

    it('renders manage roles button with onClick', () => {
      expect(wrapper.find('StyledAddUserBtn').exists()).toBe(true)
      expect(wrapper.find('StyledAddUserBtn').props().onClick).toEqual(editorsAndViewersProps.handleClick)
    })
  })

  describe('with only viewers', () => {
    beforeEach(() => {
      wrapper = shallow(
        <RolesSummary {...onlyViewersProps} />
      )
    })

    it('renders 2 viewers and label', () => {
      expect(wrapper.find('[className="viewer"]').length).toEqual(2)
      expect(wrapper.render().text()).toMatch(/viewers/i)
    })

    it('does not render editors label', () => {
      expect(wrapper.render().text()).not.toMatch(/editors/i)
    })

    it('renders manage roles button', () => {
      expect(wrapper.find('StyledAddUserBtn').exists()).toBe(true)
    })
  })

  describe('with only editors', () => {
    beforeEach(() => {
      wrapper = shallow(
        <RolesSummary {...onlyEditorsProps} />
      )
    })

    it('renders 2 editors and label', () => {
      expect(wrapper.find('[className="editor"]').length).toEqual(2)
      expect(wrapper.render().text()).toMatch(/editors/i)
    })

    it('does not render viewers', () => {
      expect(wrapper.render().text()).not.toMatch(/viewers/i)
      expect(wrapper.find('[className="viewer"]').exists()).toBe(false)
    })

    it('renders manage roles button', () => {
      expect(wrapper.find('StyledAddUserBtn').exists()).toBe(true)
    })
  })

  describe('with more editors than should show', () => {
    beforeEach(() => {
      wrapper = shallow(
        <RolesSummary {...tooManyEditorsProps} />
      )
    })

    it('renders only 5 editors', () => {
      expect(wrapper.find('[className="editor"]').length).toEqual(5)
    })

    it('does not render any viewers or viewer label', () => {
      expect(wrapper.find('[className="viewer"]').exists()).toBe(false)
      expect(wrapper.render().text()).not.toMatch(/viewer/i)
    })
  })

  describe('with no viewers or editors', () => {
    beforeEach(() => {
      wrapper = shallow(
        <RolesSummary {...emptyProps} />
      )
    })

    it('renders editor label', () => {
      expect(wrapper.render().text()).toMatch(/editors/i)
    })

    it('does not render viewer label', () => {
      expect(wrapper.render().text()).not.toMatch(/viewers/i)
    })

    it('does not render editors or viewers', () => {
      expect(wrapper.find('[className="editor"]').exists()).toBe(false)
      expect(wrapper.find('[className="viewer"]').exists()).toBe(false)
    })

    it('renders manage roles button', () => {
      expect(wrapper.find('StyledAddUserBtn').exists()).toBe(true)
    })
  })
})
