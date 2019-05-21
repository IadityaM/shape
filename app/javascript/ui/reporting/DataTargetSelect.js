import _ from 'lodash'
import PropTypes from 'prop-types'
import { observable, runInAction } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import trackError from '~/utils/trackError'
import { Select, SelectOption } from '~/ui/global/styled/forms'
import AutoComplete from '~/ui/global/AutoComplete'
import v from '~/utils/variables'

function formatCollections(collections) {
  return collections.map(collection => ({
    value: collection.id,
    label: collection.name,
    data: collection,
  }))
}

@inject('apiStore')
@observer
class DataTargetSelect extends React.Component {
  @observable
  type = 'Organization'
  @observable
  editing = false

  constructor(props) {
    super(props)
    this.debouncedSearch = _.debounce((term, callback) => {
      if (!term) {
        callback()
        return
      }

      this.props.apiStore
        .searchCollections({
          query: term,
          per_page: 30,
        })
        .then(res => callback(formatCollections(res.data)))
        .catch(e => {
          trackError(e)
        })
    }, 350)
  }

  componentDidMount() {
    const {
      item: {
        primaryDataset: { data_source_id },
      },
    } = this.props
    if (!data_source_id) return
    runInAction(() => {
      this.type = 'Collection'
    })
  }

  onSearch = (value, callback) => this.debouncedSearch(value, callback)

  get currentValue() {
    const { item, targetCollection } = this.props
    if (targetCollection && !this.editing) {
      return targetCollection.name
    }
    return item.data_source_id ? 'Collection' : this.type
  }

  handleChange = e => {
    e.preventDefault()
    const { item, onSelect } = this.props
    const { data_source } = item
    const { value } = e.target
    runInAction(() => (this.type = value))

    if (value === 'Organization') {
      onSelect()
    } else if (value === 'Collection') {
      runInAction(() => (this.editing = true))
    } else if (data_source) {
      onSelect({ custom: data_source })
    }
  }

  get selectOptions() {
    const options = ['Organization', 'Collection']
    const { targetCollection } = this.props
    if (targetCollection && !this.editing) {
      options.push(targetCollection.name)
    }
    return options
  }

  render() {
    return (
      <form className="form" style={{ display: 'inline-block' }}>
        <Select
          classes={{ root: 'select', selectMenu: 'selectMenu' }}
          displayEmpty
          disableUnderline
          name="role"
          onChange={this.handleChange}
          value={this.currentValue}
          inline
        >
          {this.selectOptions.map(opt => (
            <SelectOption
              classes={{ root: 'selectOption', selected: 'selected' }}
              key={opt}
              value={opt}
            >
              {opt}
            </SelectOption>
          ))}
        </Select>
        {this.type === 'Collection' &&
          this.editing && (
            <div
              style={{
                display: 'inline-block',
                marginBottom: '10px',
                backgroundColor: v.colors.commonLight,
              }}
            >
              <AutoComplete
                options={[]}
                optionSearch={this.onSearch}
                onOptionSelect={option => this.props.onSelect(option)}
                placeholder="Collection name"
                keepSelectedOptions
                style={{ display: 'inline-block' }}
              />
            </div>
          )}
      </form>
    )
  }
}

DataTargetSelect.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

DataTargetSelect.propTypes = {
  item: MobxPropTypes.objectOrObservableObject,
  targetCollection: MobxPropTypes.objectOrObservableObject,
  onSelect: PropTypes.func,
}

DataTargetSelect.defaultProps = {
  item: null,
  targetCollection: null,
  onSelect: null,
}

export default DataTargetSelect
