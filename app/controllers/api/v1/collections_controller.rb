class Api::V1::CollectionsController < Api::V1::BaseController
  deserializable_resource :collection, class: DeserializableCollection, only: [:create, :update]
  load_and_authorize_resource :organization, only: [:create]
  load_and_authorize_resource :collection_card, only: [:create]
  before_action :load_collection_with_cards, only: %i[show update]
  # @collection will only be loaded if it hasn't already, but will still authorize
  authorize_resource except: %i[me]

  def show
    render_collection(include:
      [
        roles: [:users],
        collection_cards: [
          :parent,
          record: [
            :filestack_file,
          ],
        ],
      ],
    )
  end

  def me
    # Gets the user collection for this user/org combo
    @collection = current_user.current_user_collection
    render_collection
  end

  def create
    builder = CollectionBuilder.new(params: collection_params,
                                    organization: @organization,
                                    parent_card: @collection_card)

    if builder.save
      render jsonapi: builder.collection
    else
      render_api_errors builder.errors
    end
  end

  def update
    @collection.attributes = collection_params
    if @collection.save
      render_collection
    else
      render_api_errors @collection.errors
    end
  end

  private

  def render_collection(include: nil)
    # include collection_cards for UI to receive any updates
    include ||= [
      roles: [:users],
      collection_cards: [
        :parent,
        record: [:filestack_file],
      ],
    ]

    render jsonapi: @collection, include: include
  end

  def load_collection_with_cards
    # item/collection will turn into "record" when serialized
    @collection = Collection.where(id: params[:id])
                            .includes(
                              roles: [:users],
                              collection_cards: [
                                :parent,
                                :collection,
                                item: [
                                  :filestack_file,
                                ],
                              ],
                            ).first
  end

  def collection_params
    params.require(:collection).permit(
      :name,
      :tag_list,
      collection_cards_attributes: %i[id order width height],
    )
  end
end
