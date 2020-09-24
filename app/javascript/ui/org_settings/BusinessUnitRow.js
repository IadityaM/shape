import {
  businessUnitsStore,
  businessUnitDeploymentsStore,
} from 'c-delta-organization-settings'

import { Row } from '~/ui/global/styled/layout'
import { TextField } from '~/ui/global/styled/forms'
import { DisplayText } from '~/ui/global/styled/typography'

import BusinessUnitActionMenu from './BusinessUnitActionMenu'
import { observable, runInAction } from 'mobx'
import {
  observer,
  inject,
  PropTypes as MobxPropTypes,
  PropTypes,
} from 'mobx-react'
import OrganizationRoles from './OrganizationRoles'
import DropdownSelect from './DropdownSelect'

// TODO: maybe just pass in currentUserOrganization.primary_group as prop?
@inject('apiStore')
@observer
class BusinessUnitRow extends React.Component {
  @observable
  isEditingName = null
  @observable
  businessUnit = {}
  @observable
  editableNameValue = null
  @observable
  businessUnitErrors = null

  constructor(props) {
    super(props)

    runInAction(() => {
      // this.isEditingName = props.editingBusinessUnitName
    })

    props.apiStore.fetch(
      'groups',
      props.apiStore.currentUserOrganization.primary_group.id,
      true
    )
  }

  updateBusinessUnit = async (businessUnit, params) => {
    this.setLoading(true)
    const model = new businessUnitsStore.model()
    const modelInstance = new model({
      id: businessUnit.id,
    })
    const data = {
      business_unit: params,
    }

    try {
      const promise = modelInstance.save(data, {
        optimistic: false,
      })
      const result = await promise
      this.setEditingBusinessUnitId(null)
      this.setEditingBusinessUnitName(null)
      this.setBusinessUnitErrors(null)
      this.refreshBusinessUnits()
      // TODO: Just update one BU so we don't have to refetch all the BUs?
      this.setLoading(false)
      return result
    } catch (err) {
      this.setError(true)
      this.setBusinessUnitErrors(err.error)
    }
  }

  cloneBusinessUnit = async businessUnit => {
    try {
      this.setLoading(true)
      const model = new businessUnitsStore.model()
      const modelInstance = new model({
        id: businessUnit.id,
      })

      const promise = modelInstance.rpc('clone', {
        optimistic: false,
      })
      const result = await promise
      this.refreshBusinessUnits()
      this.setLoading(false)
      return result
    } catch (err) {}
  }

  removeBusinessUnit = async businessUnit => {
    try {
      this.setLoading(true)
      const model = new businessUnitsStore.model()
      const modelInstance = new model({
        id: businessUnit.id,
      })

      const promise = modelInstance.destroy({
        optimistic: false,
      })
      const result = await promise
      this.refreshBusinessUnits()
      this.setLoading(false)
      return result
    } catch (err) {}
  }

  updateBusinessUnitDeployment = async (businessUnitDeployment, params) => {
    const model = new businessUnitDeploymentsStore.model()
    const modelInstance = new model({
      id: businessUnitDeployment.id,
    })
    const data = {
      business_unit_deployment: params,
    }
    try {
      const promise = modelInstance.save(data, {
        optimistic: false,
      })
      const result = await promise
      if (result) {
        this.refreshBusinessUnits()
      }
    } catch (err) {}
  }

  handleNameInputKeyPress = businessUnit => {
    if (event.key === 'Enter') {
      this.handleSaveBusinessUnit(businessUnit, {
        name: this.editingBusinessUnitName,
      })
    }
  }

  handleNameInputChange = e => {
    this.setEditingBusinessUnitName(e.target.value)
  }

  handleSaveBusinessUnit = businessUnit => {
    this.updateBusinessUnit(businessUnit, {
      name: this.editingBusinessUnitName,
    })
  }

  render() {
    // const {} = this.props
    const {
      isEditingName,
      editableNameValue,
      businessUnitErrors,
      businessUnit,
      handleNameInputKeyPress,
      handleNameInputChange,
      handleSaveBusinessUnit,
    } = this

    const {
      industrySubcategories,
      contentVersions,
      updateBusinessUnit, // TODO: move this here instead of passing it in?
      updateBusinessUnitDeployment,
    } = this.props

    return (
      <Row>
        <form
          style={{
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              width: '170px',
              marginRight: '20px',
            }}
          >
            {isEditingName ? (
              <React.Fragment>
                <TextField
                  style={{
                    width: 'inherit',
                  }}
                  autoFocus
                  // onFocus={() => this.focusOnNameInput()} // TODO: use a ref
                  id={'new-team-name'}
                  value={editableNameValue} // TODO: May need to make this a separate component to handle updating value
                  onChange={handleNameInputChange}
                  onBlur={e => handleSaveBusinessUnit(businessUnit)}
                  onKeyPress={e => handleNameInputKeyPress(businessUnit)}
                />
                <span
                  style={{
                    color: 'red',
                  }}
                >
                  {businessUnitErrors}
                </span>
              </React.Fragment>
            ) : (
              <DisplayText> {businessUnit.name} </DisplayText>
            )}
          </div>
          <div
            style={{
              marginRight: '20px',
            }}
          >
            <DropdownSelect
              label={'Industry'}
              record={businessUnit}
              options={industrySubcategories}
              updateRecord={params => updateBusinessUnit(businessUnit, params)}
              fieldToUpdate={'industry_subcategory_id'}
            />
          </div>
          <div
            style={{
              marginRight: '20px',
            }}
          >
            {/*
                                  TODO: this updates a BU Deployment, not the BU itself
                                  - It should probably accept the BU Deployment as the record
                                  - and use content_version_id as the fieldToUpdate
                                */}
            <DropdownSelect
              label={'Content Version'}
              toolTip={
                'Content Versions provide alternative wording to content that are more suitable for certain kinds of teams or organizations. We suggest leaving the default if you are unsure.'
              }
              objectToUpdateName={businessUnit.name}
              record={businessUnit.closest_business_unit_deployment}
              options={contentVersions}
              updateRecord={params =>
                updateBusinessUnitDeployment(
                  businessUnit.closest_business_unit_deployment,
                  params
                )
              }
              fieldToUpdate={'content_version_id'}
            />
          </div>
          <div
            style={{
              marginRight: '20px',
            }}
          >
            <DropdownSelect
              label={'Structure'}
              toolTip={
                "Select 'Vertical' for any market-facing team or organizational unit. Select 'Horizontal' for any internally-facing teams, departments, or other organizational groups."
              }
              record={businessUnit}
              options={[
                {
                  name: 'Vertical',
                  id: 'Vertical',
                },
                {
                  name: 'Horizontal',
                  id: 'Horizontal',
                },
              ]}
              updateRecord={params => updateBusinessUnit(businessUnit, params)}
              fieldToUpdate={'structure'}
            />
          </div>
          <div
            style={{
              width: '42px',
              marginTop: '2px',
            }}
          >
            <BusinessUnitActionMenu
              name={businessUnit.name}
              handleClone={() => this.cloneBusinessUnit(businessUnit)}
              handleRemove={() => this.removeBusinessUnit(businessUnit)}
              handleRename={() => {
                this.setEditingBusinessUnitName(businessUnit.name)
                this.setEditingBusinessUnitId(businessUnit.id)
              }}
            />
          </div>
          {/* Admins */}
          <div
            style={{
              width: '80px',
              marginTop: '-10px',
            }}
          >
            <OrganizationRoles
              roles={
                this.props.apiStore.currentUserOrganization.primary_group.roles
              }
              canEdit={
                this.props.apiStore.currentUserOrganization.primary_group
                  .can_edit
              }
            />
          </div>
          {/* Members */}
          <div
            style={{
              width: '80px',
              marginTop: '-10px',
            }}
          >
            <OrganizationRoles
              roles={
                this.props.apiStore.currentUserOrganization.primary_group.roles
              }
              canEdit={
                this.props.apiStore.currentUserOrganization.primary_group
                  .can_edit
              }
            />
          </div>
        </form>
      </Row>
    )
  }
}

BusinessUnitRow.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

BusinessUnitRow.defaultProps = {
  organization: {},
  contentVersions: [],
  industrySubcategories: [],
  supportedLanguages: [],
}

BusinessUnitRow.propTypes = {
  updateBusinessUnit: PropTypes.func,
  updateBusinessUnitDeployment: PropTypes.func,
  organization: MobxPropTypes.objectOrObservableObject.isRequired,
  contentVersions: MobxPropTypes.arrayOrObservableArray(
    MobxPropTypes.objectOrObservableObject
  ),
  industrySubcategories: MobxPropTypes.arrayOrObservableArray(
    MobxPropTypes.objectOrObservableObject
  ),
  supportedLanguages: MobxPropTypes.arrayOrObservableArray(
    MobxPropTypes.objectOrObservableObject
  ),
}

export default BusinessUnitRow