import PropTypes from 'prop-types'
import { Flex } from 'reflexbox'
import { Fragment } from 'react'
import { action, observable, runInAction } from 'mobx'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import pluralize from 'pluralize'
import styled from 'styled-components'

import { apiStore, uiStore } from '~/stores'
import CollectionSort from '~/ui/grid/CollectionSort'
import FilterBar from './FilterBar'
import FilterMenu from './FilterMenu'
import FilterSearchModal from './FilterSearchModal'
import MethodLibraryFilterBar from './MethodLibraryFilterBar'
const SortContainer = styled.div`
  position: relative;
  top: ${props => (props.top ? props.top : 0)}px;
`

@observer
class CollectionFilter extends React.Component {
  @observable
  currentFilterLookupType = null
  @observable
  rendered = false

  @action
  componentDidMount() {
    // update this observable because FilterBar uses a portal (with a DOM id)
    // so we want to make sure this has rendered before trying to render FilterBar
    this.rendered = true
  }

  get tagFilters() {
    const { filterBarFilters } = this.props.collection
    return filterBarFilters.filter(filter =>
      ['tag', 'user_tag'].includes(filter.filter_type)
    )
  }

  get searchFilters() {
    const { filterBarFilters } = this.props.collection
    return filterBarFilters.filter(filter => filter.filter_type === 'search')
  }

  /*
   * This method is a decorator that wraps any changes in the collection filters
   * and sets up a loader, and fetches the collection cards after the filter
   * change has happened. It should be used for all methods that change filters
   * that required a collection card reload
   */
  async onFilterChange(fn) {
    uiStore.update('isLoading', true)
    try {
      const result = await fn()
      const { collection } = this.props
      await collection.API_fetchCards()
      return result
    } catch (e) {
      throw e
    } finally {
      uiStore.update('isLoading', false)
    }
  }

  filterIsDupe = filter => {
    const {
      collection: { collection_filters },
    } = this.props
    const existingFilter = collection_filters.find(
      f =>
        f.text.toUpperCase() === filter.text.toUpperCase() &&
        f.filter_type === filter.filter_type
    )
    return !!existingFilter
  }

  onCreateFilter = async tag => {
    const { collection } = this.props
    const { currentFilterLookupType } = this
    if (!currentFilterLookupType) return
    let backendFilterType = pluralize
      .singular(currentFilterLookupType)
      .toLowerCase()
      .split(' ')[0]

    if (backendFilterType === 'tag') {
      const { internalType } = tag
      // NOTE: internalType is set under Organization::searchTagsAndUsers
      if (internalType === 'users') {
        backendFilterType = 'user_tag'
      }
    }
    const filter = {
      text: tag.label,
      filter_type: backendFilterType,
      selected: false,
    }
    if (!this.filterIsDupe(filter))
      return collection.API_createCollectionFilter(filter)
  }

  onDeleteFilter = async tag => {
    return this.onFilterChange(async () => {
      const { collection } = this.props
      const filter = apiStore.find('collection_filters', tag.id)
      if (filter) {
        return collection.API_destroyCollectionFilter(filter)
      }
    })
  }

  onSelectFilter = async tag => {
    return this.onFilterChange(async () => {
      const filter = apiStore.find('collection_filters', tag.id)
      const { collection } = this.props
      if (collection.isBoard && collection.viewMode !== 'list') {
        collection.setViewMode('list')
      }
      return filter.API_toggleSelected(collection, !tag.selected)
    })
  }

  onShowAll = ev => {
    return this.onFilterChange(() => {
      const { collection } = this.props
      const { collection_filters } = collection
      return Promise.all(
        collection_filters.map(filter =>
          filter.API_toggleSelected(collection, false)
        )
      )
    })
  }

  openSearchModal = filterType => () => {
    runInAction(() => {
      this.currentFilterLookupType = filterType
    })
  }

  render() {
    const {
      collection,
      collection: {
        isParentMethodLibrary,
        filterBarFilters,
        methodLibraryFilters,
      },
      canEdit,
      sortable,
      inSearchCollection,
    } = this.props
    const isFilterBarActive =
      this.rendered &&
      ((filterBarFilters && filterBarFilters.length > 0) ||
        collection.isSearchCollection)

    let totalResults = !uiStore.isLoading
      ? collection.collection_cards.length
      : 0

    let filterMenuMarginBottom
    if (inSearchCollection) {
      filterMenuMarginBottom = 0
      totalResults = collection.searchResultsCollection.collection_cards.length
    } else {
      filterMenuMarginBottom = 24
    }
    return (
      <Fragment>
        {this.rendered && isParentMethodLibrary && (
          <MethodLibraryFilterBar
            filters={methodLibraryFilters}
            onSelect={this.onSelectFilter}
          />
        )}
        <Flex align="flex-end">
          {isFilterBarActive && (
            <FilterBar
              filters={filterBarFilters}
              totalResults={totalResults}
              onDelete={this.onDeleteFilter}
              onSelect={this.onSelectFilter}
              onShowAll={this.onShowAll}
              showIcon={isParentMethodLibrary}
            />
          )}
          <Flex align="flex-end" ml="auto">
            {canEdit && (
              <FilterMenu
                marginBottom={filterMenuMarginBottom}
                onFilterByTag={this.openSearchModal('Tags')}
                onFilterBySearch={this.openSearchModal('Search Term')}
              />
            )}
            {sortable && (
              <SortContainer
                // if FilterMenu is shown then CollectionSort needs to bump up
                top={canEdit ? -15 : 0}
              >
                <CollectionSort collection={collection} />
              </SortContainer>
            )}
            {!!this.currentFilterLookupType && (
              <FilterSearchModal
                filters={
                  this.currentFilterLookupType === 'Tags'
                    ? [...this.tagFilters]
                    : [...this.searchFilters]
                }
                onCreateTag={this.onCreateFilter}
                onRemoveTag={this.onDeleteFilter}
                onSelectTag={this.onSelectFilter}
                onModalClose={this.openSearchModal(null)}
                filterType={this.currentFilterLookupType}
                modalOpen={!!this.currentFilterLookupType}
              />
            )}
          </Flex>
        </Flex>
      </Fragment>
    )
  }
}

CollectionFilter.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  canEdit: PropTypes.bool,
  sortable: PropTypes.bool,
  inSearchCollection: PropTypes.bool,
}

CollectionFilter.defaultProps = {
  canEdit: false,
  sortable: false,
  inSearchCollection: false,
}

export default CollectionFilter
