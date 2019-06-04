import PropTypes from 'prop-types'
import { observable } from 'mobx'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'

import Emoji from '~/ui/icons/Emoji'
import { EmojiButton, EmojiHolder } from '~/ui/test_collections/ScaleQuestion'
import { QuestionText } from '~/ui/test_collections/shared'
import v from '~/utils/variables'
import { QuestionSpacingContainer } from './OpenQuestion'

@observer
class TermsQuestion extends React.Component {
  @observable
  answered = false

  handleClick = choice => ev => {
    const { onAnswer, user } = this.props

    if (user) {
      user.API_updateCurrentUser({
        respondent_terms_accepted: choice,
      })
    }
    this.answered = true
    // there was a user, or anon user answered "no", move on
    onAnswer(choice)
  }

  get backgroundColor() {
    const { backgroundColor } = this.props
    return backgroundColor ? backgroundColor : v.colors.primaryDark
  }

  render() {
    const { user } = this.props
    const { answered } = this
    return (
      <QuestionSpacingContainer editing={false}>
        <QuestionText>
          Before continuing, we ask that you read the following statement and
          select the appropriate response.
        </QuestionText>

        <QuestionText fontSizeEm={0.75}>
          The contents of the survey may ask you to provide personal data about
          yourself, including sensitive data such as race or health information.
          It is your choice whether to provide this information and it is
          entirely optional.
          <br />
          <br />
          Any personal data you choose to provide will be stored in the US and
          may be accessed by teams based in different countries, which have
          different personal data laws and may be less strict than the EU for
          example.
          <br />
        </QuestionText>
        <EmojiHolder data-cy="TermsEmojiHolder">
          <EmojiButton
            selected={
              !answered || (answered && user && !user.respondent_terms_accepted)
            }
            onClick={this.handleClick(false)}
          >
            <Emoji scale={1.375} name="Disagree" symbol="👎" />
          </EmojiButton>
          <EmojiButton
            data-cy="AcceptFeedbackTerms"
            selected={
              !answered || (answered && user && user.respondent_terms_accepted)
            }
            onClick={this.handleClick(true)}
          >
            <Emoji scale={1.375} name="Yes" symbol="👍" />
          </EmojiButton>
        </EmojiHolder>
      </QuestionSpacingContainer>
    )
  }
}

TermsQuestion.propTypes = {
  user: MobxPropTypes.objectOrObservableObject,
  onAnswer: PropTypes.func.isRequired,
  backgroundColor: PropTypes.string,
}
TermsQuestion.defaultProps = {
  user: null,
  backgroundColor: null,
}

export default TermsQuestion
