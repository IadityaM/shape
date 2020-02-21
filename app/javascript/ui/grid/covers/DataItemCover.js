import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { observable, runInAction } from 'mobx'

import DataItemCoverCollectionsItems from '~/ui/grid/covers/data-item/DataItemCoverCollectionsItems'
import DataItemCoverDisplayOnly from '~/ui/grid/covers/data-item/DataItemCoverDisplayOnly'
import trackError from '~/utils/trackError'

// eslint-disable-next-line react/no-multi-comp
@inject('apiStore')
@observer
class DataItemCover extends React.Component {
  @observable
  targetCollection = null

  componentDidMount() {
    this.loadDatasets()
  }

  componentDidUpdate() {
    const { item } = this.props
    if (!item.primaryDataset) {
      this.loadDatasets()
    }
  }

  async loadDatasets() {
    const { item } = this.props
    await item.API_fetchDatasets()
    const {
      primaryDataset: { data_source_id },
    } = item
    if (data_source_id) {
      this.loadTargetCollection(data_source_id)
    }
  }

  loadTargetCollection = async (id = null) => {
    const { apiStore } = this.props
    if (!id) {
      runInAction(() => {
        this.targetCollection = null
      })
      return
    }
    try {
      const res = await apiStore.fetch('collections', id)
      runInAction(() => {
        this.targetCollection = res.data
      })
    } catch (e) {
      trackError(e)
    }
  }

  render() {
    const { item, card } = this.props
    if (item.isReportTypeCollectionsItems) {
      return (
        <DataItemCoverCollectionsItems
          item={item}
          card={card}
          targetCollection={this.targetCollection}
          loadTargetCollection={this.loadTargetCollection}
        />
      )
    }
    return <DataItemCoverDisplayOnly item={item} card={card} />
  }
}

DataItemCover.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
  card: MobxPropTypes.objectOrObservableObject.isRequired,
  // eslint-disable-next-line react/no-unused-prop-types
  datasetLength: PropTypes.number,
}

DataItemCover.defaultProps = {
  datasetLength: 1,
}

DataItemCover.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default DataItemCover
