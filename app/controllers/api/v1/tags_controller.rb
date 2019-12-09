class Api::V1::TagsController < Api::V1::BaseController
  load_and_authorize_resource :organization, only: :index
  before_action :load_tags, only: %i[index]

  def index
    render jsonapi: @tags
  end

  private

  def load_tags
    @tags = ActsAsTaggableOn::Tag.order(taggings_count: :desc).limit(1000)
    return @tags if @organization.blank?

    @tags = @tags.where(
      'organization_ids @> ?', [@organization.id].to_json
    )
  end
end
