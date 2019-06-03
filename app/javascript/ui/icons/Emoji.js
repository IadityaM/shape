import PropTypes from 'prop-types'
import styled from 'styled-components'

import EmojiDarkSunglasses from '~/assets/emoji/dark-sunglasses.png'
import EmojiEyeglasses from '~/assets/emoji/eyeglasses.png'
import EmojiExplodingHead from '~/assets/emoji/exploding-head_1f92f.png'
import EmojiSlightlySmilingFace from '~/assets/emoji/slightly-smiling-face.png'
import EmojiWomanShrugging from '~/assets/emoji/woman-shrugging.png'
import EmojiError from '~/assets/emoji/error.png'
import trackError from '~/utils/trackError'

const emojiFallbackMap = {
  '🤯': EmojiExplodingHead,
  '🤷‍♀️': EmojiWomanShrugging,
  '🕶': EmojiDarkSunglasses,
  '👓': EmojiEyeglasses,
  '🙂': EmojiSlightlySmilingFace,
}

function emojiFallback(symbol) {
  const fallback = emojiFallbackMap[symbol]
  if (!fallback) {
    trackError(new Error(`Missing emoji: ${symbol}`), {
      source: 'Emoji',
      name: 'emojiFallback',
    })
    return EmojiError
  }
  return fallback
}
function emojiSupported() {
  const ctx = document.createElement('canvas').getContext('2d')
  ctx.fillText('😗', -2, 4)
  return ctx.getImageData(0, 0, 1, 1).data[3] > 0
}

const EmojiImage = styled.img`
  display: inline-block;
  vertical-align: bottom;
`

const Emoji = props => {
  const { name, symbol, scale } = props
  return emojiSupported(symbol) ? (
    <span
      className="emoji"
      role="img"
      aria-label={name || ''}
      aria-hidden={name ? 'false' : 'true'}
      style={{
        fontSize: `${parseInt(32 * scale)}px`,
        fontFamily: 'Segoe UI Emoji',
      }}
    >
      {symbol}
    </span>
  ) : (
    <EmojiImage
      style={{ width: `${parseInt(32 * scale)}px` }}
      src={emojiFallback(symbol)}
      alt={name}
    />
  )
}

Emoji.propTypes = {
  name: PropTypes.string,
  symbol: PropTypes.string,
  scale: PropTypes.number,
}
Emoji.defaultProps = {
  name: null,
  symbol: null,
  scale: 1,
}

export default Emoji
