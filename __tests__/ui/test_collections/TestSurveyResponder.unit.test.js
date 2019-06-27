import TestSurveyResponder from '~/ui/test_collections/TestSurveyResponder'
import { fakeTestCollection, fakeQuestionItem } from '#/mocks/data'

import fakeApiStore from '#/mocks/fakeApiStore'

let wrapper, props, component
const testCollection = {
  ...fakeTestCollection,
  test_status: 'live',
  // NOTE: weird error when using fakeCollectionCards...
  // would get "maximum call stack", so we just create a simpler data set here
  question_cards: [
    {
      id: '1',
      card_question_type: 'question_useful',
      record: { ...fakeQuestionItem },
    },
  ],
}

describe('TestSurveyResponder', () => {
  beforeEach(() => {
    props = {
      collection: testCollection,
      apiStore: fakeApiStore(),
    }
    wrapper = shallow(<TestSurveyResponder.wrappedComponent {...props} />)
    component = wrapper.instance()
  })

  describe('with a live survey', () => {
    it('has 3 answerable questions', () => {
      expect(component.answerableCards.length).toEqual(3)
      expect(component.answerableCards.map(c => c.card_question_type)).toEqual([
        'question_welcome',
        'question_terms',
        'question_useful',
      ])
    })

    it('renders ProgressDots', () => {
      // should be 3 + 1 more for "You're done!"
      expect(wrapper.find('ProgressDots').props().totalAmount).toEqual(
        component.answerableCards.length + 1
      )
    })

    it('renders the first viewable question', () => {
      expect(wrapper.find('TestQuestion').length).toEqual(1)
      expect(
        wrapper.find('TestQuestion').get(0).props.card.card_question_type
      ).toEqual('question_welcome')
    })

    describe('with inline = false', () => {
      it('renders the ThemeProvider with primary theme', () => {
        expect(component.theme).toEqual('primary')
        expect(wrapper.find('ThemeProvider').exists()).toBe(true)
      })
    })

    describe('with inline = true', () => {
      beforeEach(() => {
        wrapper.setProps({
          ...props,
          inline: true,
        })
      })

      it('renders the ThemeProvider with secondary theme', () => {
        expect(component.theme).toEqual('secondary')
        expect(wrapper.find('ThemeProvider').exists()).toBe(true)
      })
    })
  })

  describe('with a closed survey', () => {
    beforeEach(() => {
      wrapper.setProps({
        ...props,
        collection: {
          ...props.collection,
          test_status: 'closed',
        },
      })
    })

    it('renders the ClosedSurvey', () => {
      expect(wrapper.find('ClosedSurvey').exists()).toBe(true)
    })
  })
})
