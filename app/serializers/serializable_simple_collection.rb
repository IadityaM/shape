class SerializableSimpleCollection < BaseJsonSerializer
  type 'collections'

  attributes :created_at, :updated_at, :name, :organization_id
  attribute :cover do
    @object.cached_cover || {}
  end

  attribute :type do
    @object.type || @object.class.name
  end

  has_many :collection_cards
end
