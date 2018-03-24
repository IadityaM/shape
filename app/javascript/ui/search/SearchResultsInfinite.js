import { Fragment } from 'react'
import PropTypes from 'prop-types'
import { action, observable } from 'mobx'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import InfiniteScroll from 'react-infinite-scroller'
import FlipMove from 'react-flip-move'
import VisibilitySensor from 'react-visibility-sensor'

import v from '~/utils/variables'
import Breadcrumb from '~/ui/layout/Breadcrumb'
import Loader from '~/ui/layout/Loader'
import CollectionCover from '~/ui/grid/covers/CollectionCover'
import CollectionIcon from '~/ui/icons/CollectionIcon'
import { StyledTopRightActions, StyledBottomLeftIcon } from '~/ui/grid/GridCard'

const StyledSearchResult = styled.div`
  height: ${props => props.gridH}px;
  max-width: ${props => props.gridMaxW}px;
  background: white;
  margin-bottom: ${props => props.gutter}px;
  position: relative;
  cursor: pointer;
`
StyledSearchResult.displayName = 'StyledSearchResult'

const StyledBreadcrumb = styled.div`
  margin-top: 16px;
  margin-bottom: 1px;
`

const StyledScrollIndicator = styled.div`
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 60px;
  height: 60px;
  color: white;
  font-size: 1rem;
  font-family: 'Gotham';
  text-align: center;
  line-height: 3.5rem;
  background: ${props => (props.active ? v.colors.gray : v.colors.cloudy)};
  z-index: ${v.zIndex.scrollIndicator};
`

@observer
class SearchResultsInfinite extends React.Component {
  visibleItems = observable.map({})
  @observable firstVisible = 1
  @observable hovering = false

  routeToCollection = id => () => {
    this.props.routeTo('collections', id)
  }

  @action markFirstVisible = (index) => {
    this.firstVisible = index
  }

  @action setVisible = (index, isVisible) => (
    this.visibleItems.set(index, isVisible)
  )

  @action setHovering = (val) => (
    this.hovering = val
  )

  computeFirstVisible() {
    let first = 0
    this.visibleItems.forEach((isVisible, idx) => {
      if (isVisible && !first) {
        first = idx
      }
    })
    this.markFirstVisible(first)
  }

  handleVisibilityChange = index => isVisible => {
    this.setVisible(index, isVisible)
    this.computeFirstVisible()
  }

  handleMouseOver = (index, enter = true) => (ev) => {
    if (enter) {
      this.setHovering(true)
      this.markFirstVisible(index)
    } else {
      this.setHovering(false)
      this.computeFirstVisible()
    }
  }

  render() {
    const {
      searchResults,
      gridSettings,
      gridMaxW,
      hasMore,
      loadMore,
      total,
    } = this.props

    const results = (
      searchResults.map((collection, i) => (
        <FlipMove
          appearAnimation="elevator"
          key={collection.id}
        >
          <VisibilitySensor
            // minTopValue={1} // consider visible even if we only see top 25px
            partialVisibility
            scrollCheck
            scrollThrottle={250}
            intervalDelay={5000}
            onChange={this.handleVisibilityChange(i + 1)}
            offset={{
              top: v.headerHeightCompact + (gridSettings.gridH / 2),
            }}
          >
            <div>
              <StyledBreadcrumb>
                <Breadcrumb items={collection.breadcrumb} />
              </StyledBreadcrumb>
              <StyledSearchResult
                {...gridSettings}
                gridMaxW={gridMaxW}
                onClick={this.routeToCollection(collection.id)}
                onMouseEnter={this.handleMouseOver(i + 1)}
                onMouseLeave={this.handleMouseOver(i + 1, false)}
                // onFocus={this.handleMouseOver(i + 1)}
              >
                <StyledTopRightActions className="show-on-hover">
                  {/* NOTE: once linking is enabled, should setup CardMenu here */}
                </StyledTopRightActions>
                <StyledBottomLeftIcon>
                  <CollectionIcon />
                </StyledBottomLeftIcon>
                <CollectionCover
                  collection={collection}
                  width={gridSettings.cols}
                  height={1}
                />
              </StyledSearchResult>
            </div>
          </VisibilitySensor>
        </FlipMove>
      ))
    )
    return (
      <Fragment>
        <StyledScrollIndicator active={this.hovering}>
          {this.firstVisible}/{total}
        </StyledScrollIndicator>
        <InfiniteScroll
          useWindow
          pageStart={1}
          threshold={200} // px from bottom
          loader={
            <Loader height={'200px'} key="loader" />
          }
          loadMore={loadMore}
          hasMore={hasMore}
        >
          {results}
        </InfiniteScroll>
      </Fragment>
    )
  }
}

SearchResultsInfinite.propTypes = {
  searchResults: MobxPropTypes.arrayOrObservableArray.isRequired,
  gridSettings: MobxPropTypes.objectOrObservableObject.isRequired,
  gridMaxW: PropTypes.number.isRequired,
  routeTo: PropTypes.func.isRequired,
  loadMore: PropTypes.func.isRequired,
  hasMore: PropTypes.bool.isRequired,
  total: PropTypes.number.isRequired,
}

export default SearchResultsInfinite
