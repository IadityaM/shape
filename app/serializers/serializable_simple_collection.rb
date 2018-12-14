class SerializableSimpleCollection < BaseJsonSerializer
  type 'collections'

  attributes :created_at, :updated_at, :name, :organization_id
  attribute :cover do
    @object.cached_cover || {}
  end

  attribute :type do
    @object.type || @object.class.name
  end

  attribute :breadcrumb, if: -> { @force_breadcrumbs } do
    Breadcrumb::ForUser.new(
      @object,
      @current_user,
    ).viewable_to_api
  end

  has_one :parent_collection_card
  has_many :collection_cards
end
