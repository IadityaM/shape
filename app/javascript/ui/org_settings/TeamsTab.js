// import PropTypes from 'prop-types'
// import { useState, useEffect, Fragment } from 'react'

// import { businessUnitsStore } from 'c-delta-organization-settings'
// import { Row } from '../global/styled/layout'
// import DropdownSelect from './DropdownSelect'

// // TODO: pass in organization from C∆Tabs component
// const TeamsTab = ({ organization, industrySubcategories }) => {
//   const [businessUnits, setBusinessUnits] = useState([])
//   const [isLoading, setIsLoading] = useState(false)
//   const [isError, setIsError] = useState(false)

//   useEffect(() => {
//     async function businessUnits() {
//       console.log('fetching BUs')
//       try {
//         setIsLoading(true)
//         const response = await businessUnitsStore.fetch()
//         console.log('BU response: ', response)
//         setBusinessUnits(response)
//         setIsLoading(false)
//       } catch (err) {
//         console.log('failed to fetch BUs: ', err)
//         setIsError(true)
//       }
//     }
//     businessUnits()
//   }, [])

//   // TODO: figure out table implemenation
//   return (
//     <div>
//       {isError && <div>Something went wrong...</div>}
//       {isLoading ? (
//         <div>Loading...</div>
//       ) : (
//         <Fragment>
//           {businessUnits.map(businessUnit => (
//             <Row>
//               <form>
//                 <DropdownSelect
//                   label={'Industry'}
//                   record={organization}
//                   options={industrySubcategories}
//                   updateRecord={updateOrg}
//                   fieldToUpdate={'industry_subcategory_id'}
//                 />{' '}
//                 <DropdownSelect
//                   label={'Content Version'}
//                   toolTip={
//                     'Content Versions provide alternative wording to content that are more suitable for certain kinds of teams or organizations. We suggest leaving the default if you are unsure.'
//                   }
//                   record={organization}
//                   options={contentVersions}
//                   updateRecord={updateOrg}
//                   fieldToUpdate={'default_content_version_id'}
//                 />
//               </form>
//             </Row>
//           ))}
//         </Fragment>
//       )}
//     </div>
//   )
// }

// TeamsTab.propTypes = {
//   organization: PropTypes.object,
//   // TODO: fix these to use MobxPropTypes
//   industrySubcategories: PropTypes.arrayOf(PropTypes.object),
//   contentVersions: PropTypes.arrayOf(PropTypes.object),
//   updateRecord,
// }

// export default TeamsTab
