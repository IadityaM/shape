import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import { Flex, Box } from 'reflexbox'

import ChallengeSubHeader from '~/ui/layout/ChallengeSubHeader'
import TopRightChallengeButton from '~/ui/global/TopRightChallengeButton'
import { collectionTypeToIcon } from '~/ui/global/CollectionTypeIcon'
import EditableName from '~/ui/pages/shared/EditableName'
import IconHolder from '~/ui/icons/IconHolder'
import { MaxWidthContainer } from '~/ui/global/styled/layout'
import v from '~/utils/variables'

const ChallengeFixedHeader = ({
  collection,
  challengeNavigationHandler,
  handleShowSettings,
  handleReviewSubmissions,
}) => {
  const { name, collection_type } = collection
  const buttonProps = !collection.isSubmissionBox
    ? {
        name: 'Challenge Settings',
        onClick: handleShowSettings,
      }
    : {
        name: 'Review Submissions',
        color: `${v.colors.alert}`,
        onClick: handleReviewSubmissions,
      }
  return (
    <MaxWidthContainer>
      {/* Show subheader if a parent collection is a challenge */}
      {collection_type !== 'challenge' && (
        <ChallengeSubHeader
          challengeName={name}
          challengeNavigationHandler={challengeNavigationHandler}
        />
      )}
      <Flex
        data-empty-space-click
        align="center"
        style={{ minHeight: v.headerHeight }}
      >
        <Box>
          <EditableName
            name={name}
            updateNameHandler={e => e.preventDefault()}
            inline
          />
          <IconHolder
            height={32}
            width={32}
            display={'inline-block'}
            marginTop={8}
            marginLeft={10}
          >
            {collectionTypeToIcon({
              type: collection_type,
              size: 'lg',
            })}
          </IconHolder>
        </Box>

        <Box
          flex
          align="center"
          style={{ marginLeft: 'auto', marginRight: '168px' }}
        >
          <TopRightChallengeButton {...buttonProps} />
        </Box>
      </Flex>
    </MaxWidthContainer>
  )
}

ChallengeFixedHeader.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  handleShowSettings: PropTypes.func.isRequired,
  handleReviewSubmissions: PropTypes.func.isRequired,
  challengeNavigationHandler: PropTypes.func,
}

ChallengeFixedHeader.defaultProps = {
  challengeNavigationHandler: () => {},
}

export default ChallengeFixedHeader
