import { QuestionText } from '~/ui/test_collections/shared'
import Emoji from '~/ui/icons/Emoji'

const GreetingMessage = () => {
  return (
    <div style={{ textAlign: 'center' }}>
      <QuestionText fontSizeEm={1.25}>Hey there!</QuestionText>
      <Emoji name="Woman raising hand in greeting" symbol="🙋‍♀️" scale={2} />
    </div>
  )
}

export default GreetingMessage
