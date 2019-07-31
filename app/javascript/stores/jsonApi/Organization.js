import { apiUrl } from '~/utils/url'
import { ReferenceType } from 'datx'

import BaseRecord from './BaseRecord'
import Item from './Item'

class Organization extends BaseRecord {
  static type = 'organizations'
  static endpoint = apiUrl('organizations')

  API_createTermsTextItem() {
    return this.apiStore.request(
      `organizations/${this.id}/add_terms_text`,
      'PATCH'
    )
  }

  API_removeTermsTextItem() {
    return this.apiStore.request(
      `organizations/${this.id}/remove_terms_text`,
      'PATCH'
    )
  }

  API_bumpTermsVersion() {
    return this.apiStore.request(
      `organizations/${this.id}/bump_terms_version`,
      'PATCH'
    )
  }

  attributesForAPI = [
    'in_app_billing',
    'name',
    'domain_whitelist',
    'filestack_file_attributes',
    'deactivated',
  ]
}

Organization.type = 'organizations'

Organization.refDefaults = {
  terms_text_item: {
    model: Item,
    type: ReferenceType.TO_ONE,
    defaultValue: null,
  },
}

export default Organization
